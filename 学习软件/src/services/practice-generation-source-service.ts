import type { GenerateResult } from '../types'
import {
  createQuestionsGenerationJobInBackend,
  isPlannedEndpointError,
  triggerGenerationBatchInBackend,
  type GenerationBatchPayload,
  type GenerationJobPayload,
} from '../utils/backend-sync'

export type GenerationSource = 'backend' | 'local_fallback'

export type InitialGenerationSourceResult =
  | {
      source: 'backend'
      payload: GenerationJobPayload
    }
  | {
      source: 'local_fallback'
      payload: GenerateResult
    }

export type BatchGenerationSourceResult =
  | {
      source: 'backend'
      payload: GenerationBatchPayload
    }
  | {
      source: 'local_fallback'
      payload: GenerateResult
    }

export async function requestInitialGenerationFromPreferredSource(
  backendPayload: Parameters<typeof createQuestionsGenerationJobInBackend>[0],
  runLocalFallback: () => Promise<GenerateResult>,
): Promise<InitialGenerationSourceResult> {
  try {
    const remotePayload = await createQuestionsGenerationJobInBackend(backendPayload)
    if (remotePayload?.session && remotePayload.generationJob) {
      return {
        source: 'backend',
        payload: remotePayload,
      }
    }
  } catch (error) {
    if (!isPlannedEndpointError(error)) {
      // fall back to the local adapter when backend is unavailable or transiently broken
    }
  }

  return {
    source: 'local_fallback',
    payload: await runLocalFallback(),
  }
}

export async function requestBatchGenerationFromPreferredSource(
  jobId: string,
  batchIndex: 2 | 3,
  runLocalFallback: () => Promise<GenerateResult>,
): Promise<BatchGenerationSourceResult> {
  try {
    const remotePayload = await triggerGenerationBatchInBackend(jobId, batchIndex)
    if (remotePayload?.generationJob && remotePayload.session) {
      return {
        source: 'backend',
        payload: remotePayload,
      }
    }
  } catch (error) {
    if (!isPlannedEndpointError(error)) {
      // fall back to the local adapter when backend is unavailable or transiently broken
    }
  }

  return {
    source: 'local_fallback',
    payload: await runLocalFallback(),
  }
}
