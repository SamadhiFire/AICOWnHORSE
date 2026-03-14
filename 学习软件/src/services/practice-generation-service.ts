import {
  clearGenerationJob,
  createGenerationJobAfterInitial,
  replaceGenerationJob,
} from '../utils/generation-job'
import { runPipeline } from '../utils/pipeline'
import {
  addGeneratedQuestions,
  buildQuestionSignature,
  loadQuestionBank,
  type PracticeMode,
  upsertStoredQuestions,
} from '../utils/question-bank'
import {
  replaceActivePracticeSession,
  saveActivePracticeSession,
  type PracticeFeedbackMode,
} from '../utils/practice-session'
import { abortAllLlmRequests } from '../utils/llm'
import { requestInitialGenerationFromPreferredSource } from './practice-generation-source-service'

export interface StartPracticeGenerationInput {
  material: string
  type: 'single' | 'multi'
  difficulty: 'easy' | 'medium' | 'hard'
  mode: PracticeMode
  feedbackMode: PracticeFeedbackMode
  targetCount: number
  initialBatchCount: number
  userTags: string[]
  requestNonce: number
  timeoutMs: number
}

export interface StartPracticeGenerationSuccess {
  savedCount: number
  sessionId: string
}

export type StartPracticeGenerationResult =
  | {
      success: true
      output: StartPracticeGenerationSuccess
    }
  | {
      success: false
      error: string
    }

const GENERATE_FAIL_MESSAGE = '生成失败，请稍后重试'

function resolveInitialGenerationTemperature(requestNonce: number): number {
  const nonce = Math.max(0, Math.floor(Number(requestNonce || 0)))
  const step = nonce % 4
  return 0.46 + step * 0.03
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      abortAllLlmRequests()
      reject(new Error(timeoutMessage))
    }, timeoutMs)

    promise
      .then((result) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(error)
      })
  })
}

function shouldKeepGenerationJobAfterInitial(input: {
  targetCount: number
  loadedCount: number
  status?: string
}): boolean {
  const targetCount = Math.max(1, Math.floor(Number(input.targetCount || 1)))
  const loadedCount = Math.max(0, Math.floor(Number(input.loadedCount || 0)))
  const status = String(input.status || '').trim()
  if (status === 'completed' || status === 'canceled') return false
  return loadedCount < targetCount
}

export async function startPracticeGeneration(
  input: StartPracticeGenerationInput,
): Promise<StartPracticeGenerationResult> {
  clearGenerationJob()
  try {
    const initialGenerationSeed = `initial_${Date.now()}_${input.requestNonce}`
    const sourceResult = await requestInitialGenerationFromPreferredSource(
      {
        material: input.material,
        type: input.type,
        difficulty: input.difficulty,
        mode: input.mode,
        feedbackMode: input.feedbackMode,
        targetCount: input.targetCount,
        initialBatchCount: input.initialBatchCount,
        userTags: input.userTags,
        requestNonce: input.requestNonce,
      },
      async () => {
        const excludedSignatures = [...new Set(
          loadQuestionBank()
            .map((item) => buildQuestionSignature(item))
            .filter(Boolean),
        )]

        return withTimeout(
          runPipeline(
            input.material,
            input.type,
            input.initialBatchCount,
            input.difficulty,
            input.mode,
            input.userTags,
            {
              skipResultCache: true,
              cacheKeySuffix: initialGenerationSeed,
              generationSeed: initialGenerationSeed,
              temperature: resolveInitialGenerationTemperature(input.requestNonce),
              excludeSignatures: excludedSignatures,
            },
          ),
          input.timeoutMs,
          '生成超时，请检查网络或 API 配置后重试',
        )
      },
    )

    if (sourceResult.source === 'backend') {
      const saved = upsertStoredQuestions(sourceResult.payload.session.questions)
      const session = replaceActivePracticeSession(sourceResult.payload.session)
      const shouldKeepJob = shouldKeepGenerationJobAfterInitial({
        targetCount: input.targetCount,
        loadedCount: Math.max(
          Number(sourceResult.payload.generationJob?.loadedCount || 0),
          sourceResult.payload.session.questions.length,
        ),
        status: sourceResult.payload.generationJob?.status,
      })

      if (shouldKeepJob) {
        replaceGenerationJob(sourceResult.payload.generationJob)
      } else {
        clearGenerationJob()
      }

      if (!session) {
        throw new Error('题目生成成功，但会话初始化失败')
      }

      return {
        success: true,
        output: {
          savedCount: Math.max(saved.length, Number(sourceResult.payload.savedCount || 0)),
          sessionId: session.id,
        },
      }
    }

    const result = sourceResult.payload
    if (!result.success || !result.output) {
      return {
        success: false,
        error: result.error || GENERATE_FAIL_MESSAGE,
      }
    }

    const saved = addGeneratedQuestions(result.output.questions, input.mode)
    if (saved.length === 0) {
      return {
        success: false,
        error: '本次没有可用题目，请调整材料后重试',
      }
    }

    const session = saveActivePracticeSession(saved, input.mode, input.feedbackMode)
    if (saved.length < input.targetCount) {
      createGenerationJobAfterInitial({
        sessionId: session.id,
        material: input.material,
        type: input.type,
        difficulty: input.difficulty,
        mode: input.mode,
        feedbackMode: input.feedbackMode,
        userTags: input.userTags,
        targetCount: input.targetCount,
        initialQuestions: saved,
        keypoints: result.output.keypoints,
      })
    } else {
      clearGenerationJob()
    }

    return {
      success: true,
      output: {
        savedCount: saved.length,
        sessionId: session.id,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.trim() : ''
    return {
      success: false,
      error: message || GENERATE_FAIL_MESSAGE,
    }
  }
}
