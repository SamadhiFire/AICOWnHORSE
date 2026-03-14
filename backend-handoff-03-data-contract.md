# 给后端的详细数据契约

这份文档用于把“字段必须怎么返回”一次说清楚。

## 1. 通用约定

统一响应外壳：

```ts
type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
}
```

成功约定：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

基础规则：

- 除 `POST /auth/guest` 外，其他接口都带 `Authorization: Bearer <token>`。
- 字段命名统一 `camelCase`。
- 时间统一毫秒时间戳。
- 业务失败不要只靠 HTTP 200，请保证 `code != 0` 时 message 可读。

## 2. 认证与用户

用户对象：

```ts
interface UserProfile {
  userId: string
  nickname: string
  avatarUrl: string
  createdAt: number
  updatedAt: number
  lastLoginAt: number
}
```

游客登录返回：

```ts
interface GuestLoginData {
  token: string
  refreshToken: string
  expiresIn: number
  isNew: boolean
  user: UserProfile
}
```

接口要求：

`POST /auth/guest`

```json
{
  "nickname": "游客用户",
  "avatarUrl": ""
}
```

返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 7200,
    "isNew": true,
    "user": {
      "userId": "u_123",
      "nickname": "游客用户",
      "avatarUrl": "",
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000,
      "lastLoginAt": 1760000000000
    }
  }
}
```

`GET /users/me`
返回 `ApiEnvelope<UserProfile>`。

`PATCH /users/me`
请求体：

```json
{
  "nickname": "新的昵称",
  "avatarUrl": "https://cdn.example.com/avatar.png"
}
```

返回 `ApiEnvelope<UserProfile>`。

`POST /files/avatar`
前端当前真实上传方式是 `uni.uploadFile`。
前端当前真实请求约定是：

- 上传字段名：`file`
- 额外 formData：当前没有
- 鉴权：`Authorization: Bearer <token>`

建议后端返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "url": "https://cdn.example.com/avatar/u_123.png"
  }
}
```

## 3. LLM 配置

Provider 枚举：

```ts
type LlmProvider = 'qwen' | 'deepseek' | 'openai' | 'gemini'
```

配置对象：

```ts
interface LlmConfigData {
  provider: LlmProvider
  apiKey: string
  baseUrl: string
  model: string
  managedKeys: {
    qwen: string
    deepseek: string
    openai: string
    gemini: string
  }
  updatedAt?: number
}
```

当前前端默认 provider 预设：

- `qwen`: `https://dashscope.aliyuncs.com/compatible-mode/v1` + `qwen-plus`
- `deepseek`: `https://api.deepseek.com` + `deepseek-chat`
- `openai`: `https://api.openai.com/v1` + `gpt-5.2`
- `gemini`: `https://generativelanguage.googleapis.com/v1beta` + `gemini-2.5-flash`

`GET /llm/config`
返回 `ApiEnvelope<LlmConfigData>`。

`PUT /llm/config`
请求体与返回体都按 `LlmConfigData`。

`POST /llm/config/verify`
请求体：

```json
{
  "provider": "deepseek",
  "apiKey": "sk-xxxx"
}
```

返回体：

```ts
interface ApiKeyValidationData {
  status: 'success' | 'error'
  message: string
  checkedAt: number
}
```

`GET /llm/providers`
前端当前期望的返回体不是数组直出，而是：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "providers": [
      { "value": "qwen", "label": "千问" },
      { "value": "deepseek", "label": "DeepSeek" },
      { "value": "openai", "label": "OpenAI" },
      { "value": "gemini", "label": "Gemini" }
    ]
  }
}
```

## 4. 用户标签

前端本地约束：

- 最多 7 个标签
- 单个标签最长 12 个字符
- 自动去重

`GET /tags`

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tags": ["考研英语", "阅读理解"]
  }
}
```

`PUT /tags`
请求体：

```json
{
  "tags": ["考研英语", "阅读理解"]
}
```

返回建议与 `GET /tags` 一致。

`POST /tags/generate`
请求体：

```json
{
  "goal": "我想针对考研英语阅读做强化练习"
}
```

返回建议：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tags": ["考研英语", "阅读理解", "长难句"]
  }
}
```

`POST /tags/retag-historical`
请求体：

```json
{
  "tags": ["考研英语", "阅读理解"],
  "force": true
}
```

返回体：

```ts
interface RetagSummary {
  targetCount: number
  updatedCount: number
  remainingCount: number
  usedAi: boolean
  skipped: boolean
}
```

## 5. 题目与题库

选项对象：

```ts
interface QuestionOption {
  key: string
  text: string
  isCorrect?: boolean
}
```

题目对象：

```ts
interface StoredQuestion {
  id: string
  type: 'single' | 'multi'
  stem: string
  tag: string
  options?: QuestionOption[]
  answer: string
  explanation?: string
  evidence_quote: string
  keypoint_id: string
  difficulty: 'easy' | 'medium' | 'hard'
  createdAt: number
  mode: 'modeA' | 'modeB'
  practiceCount: number
  wrongCount: number
  isMastered: boolean
  category_order?: number
  lastWrongAt?: number
}
```

对题目对象的硬性建议：

- `id` 必须稳定。
- `type` 只能是 `single` 或 `multi`。
- `answer` 单选形如 `A`，多选形如 `A,C`。
- `options` 最好直接给 `A-D` 四个选项。
- `evidence_quote` 不要为空。
- 如果后端返回的是会话题目或分页题目，也尽量返回完整 `StoredQuestion`，不要返回裁剪版。

`GET /question-bank/full`
返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "questions": []
  }
}
```

`PUT /question-bank/full`
请求体：

```json
{
  "questions": []
}
```

建议返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "savedCount": 10
  }
}
```

`GET /question-bank`
查询参数：

- `mainTab`: `all | wrong | mastered`
- `tag`: `string`
- `page`: `number`
- `pageSize`: `number`

返回体：

```ts
interface QuestionBankQueryData {
  list: StoredQuestion[]
  total: number
  tagStats: Array<{
    tag: string
    count: number
  }>
}
```

`DELETE /question-bank`
请求体：

```json
{
  "ids": ["q_1", "q_2"]
}
```

返回体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "deletedCount": 2
  }
}
```

`POST /question-bank/{questionId}/attempt`
请求体：

```json
{
  "userChoice": "A",
  "feedbackMode": "instant"
}
```

返回体：

```ts
interface AttemptResult {
  isCorrect: boolean
  correctAnswer: string
  explanation: string
  practiceCount: number
  wrongCount: number
  lastWrongAt: number
}
```

`PATCH /question-bank/{questionId}/mastered`
请求体：

```json
{
  "isMastered": true
}
```

返回体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "updated": true
  }
}
```

`PATCH /question-bank/tags`
请求体：

```json
{
  "tagById": {
    "q_1": "考研英语",
    "q_2": "阅读理解"
  }
}
```

返回体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "updatedCount": 2
  }
}
```

## 6. 当前练习会话

会话对象：

```ts
interface PracticeSession {
  id: string
  createdAt: number
  mode: 'modeA' | 'modeB'
  feedbackMode: 'instant' | 'after_all'
  questions: StoredQuestion[]
}
```

`GET /practice-session/current`
建议返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "session": null
  }
}
```

或者：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "session": {
      "id": "session_1760000000000",
      "createdAt": 1760000000000,
      "mode": "modeA",
      "feedbackMode": "instant",
      "questions": []
    }
  }
}
```

`PUT /practice-session/current`
请求体：

```json
{
  "session": {
    "id": "session_1760000000000",
    "createdAt": 1760000000000,
    "mode": "modeA",
    "feedbackMode": "instant",
    "questions": []
  }
}
```

返回建议：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "session": {
      "id": "session_1760000000000",
      "createdAt": 1760000000000,
      "mode": "modeA",
      "feedbackMode": "instant",
      "questions": []
    }
  }
}
```

`DELETE /practice-session/current`
前端对返回体要求不高，只要 `code = 0` 即可，`data` 可以为空对象。

## 7. 题目生成

知识点对象：

```ts
interface Keypoint {
  id: string
  title: string
  importance_score: number
  evidence_quote: string
  why_important: string
}
```

批次状态对象：

```ts
interface GenerationBatchState {
  index: 1 | 2 | 3
  requestedCount: number
  loadedCount: number
  status: 'pending' | 'loading' | 'done' | 'error'
  attempts: number
  error: string
}
```

生成任务对象：

```ts
interface GenerationJob {
  jobId: string
  sessionId: string
  material: string
  type: 'single' | 'multi'
  difficulty: 'easy' | 'medium' | 'hard'
  mode: 'modeA' | 'modeB'
  feedbackMode: 'instant' | 'after_all'
  userTags: string[]
  targetCount: number
  loadedCount: number
  keypoints: Keypoint[]
  usedStemSignatures: string[]
  status: 'running' | 'completed' | 'canceled'
  nonce: number
  batchState: {
    batch1: GenerationBatchState
    batch2: GenerationBatchState
    batch3: GenerationBatchState
  }
  createdAt: number
  updatedAt: number
}
```

`POST /questions/generate`
请求体：

```json
{
  "material": "学习材料正文",
  "type": "single",
  "difficulty": "medium",
  "mode": "modeA",
  "feedbackMode": "instant",
  "targetCount": 20,
  "initialBatchCount": 20,
  "userTags": ["考研英语", "阅读理解"],
  "requestNonce": 1760000000000
}
```

前端把它当主入口，所以返回至少要满足：

- `session` 必须有
- `generationJob` 必须有
- `session.questions.length` 最好已经达到 `targetCount`
- `generationJob.status` 最好已经是 `completed`
- `generationJob.loadedCount` 最好已经达到 `targetCount`
- `savedCount` 最好返回，便于前端展示

推荐返回体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "savedCount": 20,
    "keypoints": [],
    "session": {
      "id": "session_1760000000000",
      "createdAt": 1760000000000,
      "mode": "modeA",
      "feedbackMode": "instant",
      "questions": []
    },
    "generationJob": {
      "jobId": "job_1760000000000",
      "sessionId": "session_1760000000000",
      "material": "学习材料正文",
      "type": "single",
      "difficulty": "medium",
      "mode": "modeA",
      "feedbackMode": "instant",
      "userTags": ["考研英语", "阅读理解"],
      "targetCount": 20,
      "loadedCount": 20,
      "keypoints": [],
      "usedStemSignatures": [],
      "status": "completed",
      "nonce": 0,
      "batchState": {
        "batch1": { "index": 1, "requestedCount": 20, "loadedCount": 20, "status": "done", "attempts": 1, "error": "" },
        "batch2": { "index": 2, "requestedCount": 0, "loadedCount": 0, "status": "done", "attempts": 0, "error": "" },
        "batch3": { "index": 3, "requestedCount": 0, "loadedCount": 0, "status": "done", "attempts": 0, "error": "" }
      },
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  }
}
```

`GET /generation-jobs/{jobId}`
前端当前期望：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "generationJob": {}
  }
}
```

`POST /generation-jobs/{jobId}/batches/{batchIndex}`
如果后端还保留补批逻辑，建议返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "appendedCount": 10,
    "questions": [],
    "session": {},
    "generationJob": {}
  }
}
```

`POST /generation-jobs/{jobId}/cancel`
建议返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "cancelled": true
  }
}
```

## 8. 前端对生成接口的真实兼容点

前端当前只有在满足下面条件时，才会把后端返回当成“成功接管”：

- 初次生成：`data.session` 和 `data.generationJob` 同时存在
- 补批生成：`data.session` 和 `data.generationJob` 同时存在

也就是说，如果后端只返回 `questions`，不返回 `session` 或 `generationJob`，前端会认为协议还没对齐。

## 9. 这份契约里最容易被忽略的点

1. `GET /llm/providers` 返回的是 `{ providers: [...] }`，不是数组直出。
2. `POST /files/avatar` 前端当前上传字段名是 `file`。
3. `Keypoint` 当前前端类型里包含 `why_important`。
4. `StoredQuestion` 不是纯题干对象，它还带 `practiceCount`、`wrongCount`、`isMastered`、`mode` 等状态字段。
5. `/questions/generate` 不是只返回题，而是要尽量一次把 `session + generationJob + questions` 一起返回。
