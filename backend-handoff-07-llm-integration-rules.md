# 大模型调用前端规则与后端配合清单

这份文档只描述“前端当前真实实现”的大模型相关规则，以及后端需要配合的接口/契约，方便你直接发给后端同学联调。

## 1. 前端当前大模型调用规则（真实行为）

### 1.1 Provider 与默认配置

- 支持 provider：`qwen | deepseek | openai | gemini`
- 默认预设：
  - `qwen`：`https://dashscope.aliyuncs.com/compatible-mode/v1` + `qwen-plus`
  - `deepseek`：`https://api.deepseek.com` + `deepseek-chat`
  - `openai`：`https://api.openai.com/v1` + `gpt-5.2`
  - `gemini`：`https://generativelanguage.googleapis.com/v1beta` + `gemini-2.5-flash`
- 前端会保存：
  - 当前 `provider/apiKey/baseUrl/model`
  - 分 provider 的 `managedKeys`
  - key 校验结果缓存（按 key 指纹）

### 1.2 前端实际请求模式

- `qwen/deepseek`：走 `OpenAI Chat Completions` 风格（`/chat/completions`）
- `openai`：走 `Responses`（`/responses`）
- `gemini`：走 `generateContent`
- 前端直连 LLM 时：
  - 超时：`45s`
  - `maxOutputTokens` 范围：`256 ~ 4096`
  - 默认温度：`0.3`

### 1.3 API Key 校验规则

- 在“我的”页，用户编辑/确认 Key 后会触发校验。
- 校验顺序：
  1. 先调后端 `POST /llm/config/verify`
  2. 如果后端不可用，再前端直连 provider 健康检查兜底
- 前端期望校验结果：`status: success|error|unknown` + `message` + `checkedAt`

### 1.4 生成题目主链路规则

- 前端主流程优先走后端 `POST /questions/generate`
- 只有当返回同时包含 `data.session` 和 `data.generationJob` 才认定“后端接管成功”
- 若接口缺失或返回不满足契约，前端会自动回退本地生成链路（local fallback）

## 2. 后端必须配合的接口（大模型与跨设备同步相关）

### 2.1 必须（建议第一优先级）

- `POST /auth/refresh`
- `POST /auth/guest`
- `GET /users/me`
- `GET /llm/config`
- `PUT /llm/config`
- `POST /questions/generate`
- `GET /practice-session/current`
- `PUT /practice-session/current`
- `DELETE /practice-session/current`

### 2.2 强烈建议（没有会影响体验或跨设备恢复完整性）

- `POST /llm/config/verify`
- `GET /llm/providers`
- `GET /generation-jobs/{jobId}`
- `POST /generation-jobs/{jobId}/batches/{batchIndex}`（仅 `2|3`）
- `POST /generation-jobs/{jobId}/cancel`
- `GET /generation-jobs/active`（前端已实现调用，当前接口文档未列出，但用于恢复“进行中任务”非常关键）

### 2.3 与个性化标签联动（LLM体验相关）

- `GET /tags`
- `PUT /tags`
- `POST /tags/generate`
- `POST /tags/retag-historical`

## 3. 后端契约要求（前端依赖的硬规则）

### 3.1 通用协议

- 统一响应外壳：
  - 成功：`{ code: 0, message: "ok", data: ... }`
  - 失败：`code != 0`
- 统一错误码语义：
  - `40100`：未登录/token失效（前端会触发刷新或清理登录态）
- 除 `GET /health`、`POST /auth/guest`、`POST /auth/refresh` 外，其余接口都要 Bearer Token
- 时间字段统一毫秒时间戳，字段命名 `camelCase`

### 3.2 LLM 配置相关

- `GET/PUT /llm/config` 的 `data` 至少包含：
  - `provider/apiKey/baseUrl/model/managedKeys`
- `GET /llm/providers` 返回必须是：
  - `{ providers: [{ value, label }] }`，不是数组直出
- `POST /llm/config/verify` 返回建议：
  - `{ status, message, checkedAt }`
  - 失败时也尽量把该结构放到 `data`，便于前端直接展示

### 3.3 生成链路相关

- `POST /questions/generate` 返回至少要有：
  - `savedCount`
  - `session`
  - `generationJob`
- `generationJob.status` 仅使用：`running | completed | canceled`
- `batchState.status` 仅使用：`pending | loading | done | error`
- `practice-session` 对象建议带 `generationJobId`，用于恢复任务

## 4. 跨设备恢复时序（后端需配合）

前端启动恢复流程是：

1. 有 `refreshToken` 时先 `POST /auth/refresh`（不先 guest）
2. refresh 成功后依次拉取：
   - `GET /users/me`
   - `GET /tags`
   - `GET /llm/config`
   - `GET /practice-session/current`
3. 任务恢复：
   - 若 `session.generationJobId` 存在，查 `GET /generation-jobs/{jobId}`
   - 或查 `GET /generation-jobs/active` 获取 running 任务
4. 只有 refreshToken 不存在或 refresh 明确失败时，才走 `POST /auth/guest`

## 5. 当前前端降级策略（后端需要知道）

- 当以下接口返回“未实现/计划中”特征（HTTP 404 或业务码 `40400/40001`）时，前端会自动降级本地逻辑：
  - `POST /questions/generate`
  - `POST /generation-jobs/{jobId}/batches/{batchIndex}`
  - `GET /generation-jobs/active`
- 这会导致“看起来能用”，但后端侧状态不完整，跨设备续练与任务恢复会变弱。

## 6. 直接发后端的一段简短提示词

请按前端现有联调契约保证以下能力：  
1）`GET/PUT /llm/config` 与 `POST /llm/config/verify` 可用；  
2）`POST /questions/generate` 返回完整 `session + generationJob`；  
3）支持 `GET /practice-session/current` 与 `GET /generation-jobs/{jobId}`（最好补 `GET /generation-jobs/active`）以恢复进行中任务；  
4）统一返回 `{ code, message, data }`，并正确使用 `40100`。
