# 给后端的联调问题清单

这份可以直接发给后端，让对方按问题逐条回复。

## 可直接转发给后端的话术

后端同学你好，前端这边准备开始联调。为了避免双方先各写一轮、最后发现协议没对上，想先把几个关键问题确认清楚。麻烦你们按下面问题逐条回复一下，最好能直接给出“是否已上线 + 实际请求示例 + 实际响应示例”。

## 建议后端优先回复的 6 个核心问题

`1. 当前真实可用的接口清单是什么`
请直接告诉我们哪些接口已经上线、哪些还没上线、哪些只是占位接口。尤其是下面这些前端主流程已经会用到的接口：

- `/questions/generate`
- `/question-bank`
- `/question-bank/{questionId}/attempt`
- `/question-bank/{questionId}/mastered`
- `/question-bank/tags`
- `/llm/providers`
- `/tags/generate`
- `/tags/retag-historical`

`2. /questions/generate 是否已经支持一次性返回整套题目`
前端现在默认 `initialBatchCount = targetCount`，也就是默认希望一次拿到整套题。请确认：

- 是否能直接返回完整 `session.questions`
- 是否会同时返回完整 `generationJob`
- 当整套题已经返回完时，`generationJob.status` 是否会是 `completed`
- 如果仍保留批次接口，什么情况下前端才需要再调用 batch 接口

`3. /files/avatar 的真实上传协议是什么`
前端当前真实实现是上传字段名 `file`。请确认：

- 是否使用 `multipart/form-data`
- 后端是否接受字段名 `file`
- 是否需要额外 formData
- 支持的格式和大小限制是什么
- 上传失败时返回什么错误码

`4. token 刷新策略是什么`
当前登录返回了 `refreshToken` 和 `expiresIn`，但还没有看到明确的刷新接口。请确认：

- 是否有类似 `/auth/refresh` 的接口
- 如果没有，token 过期后是否直接重新走游客登录
- token 失效时统一返回什么 code

`5. /llm/config/verify 是真实校验还是占位成功`
前端会把这个结果展示给用户，请确认：

- 是否真的会去调用目标 provider 做校验
- 失败时 `status` 和 `message` 的真实返回值是什么
- 如果当前还没实现，请明确告诉我们，避免前端把占位成功当成真实成功

`6. 题库和练习会话返回的是不是完整对象`
前端需要的不是“简化版题目”，而是尽量完整的 `StoredQuestion` / `PracticeSession`。请确认：

- `/question-bank`
- `/question-bank/full`
- `/practice-session/current`
- `/questions/generate`

这些接口里返回的题目对象，是否都包含：

- `id`
- `type`
- `stem`
- `options`
- `answer`
- `explanation`
- `evidence_quote`
- `keypoint_id`
- `difficulty`
- `tag`
- `mode`
- `practiceCount`
- `wrongCount`
- `isMastered`
- `createdAt`
- `lastWrongAt`

## 前后端建议统一的补充约定

`DELETE /question-bank`
前端当前用 body 传 `ids`。请确认你们网关和服务都稳定支持 `DELETE body`；如果不稳，建议新增一个更稳的别名接口，比如 `POST /question-bank/delete`。

`PATCH` 接口兼容性
前端当前用到了多个 `PATCH`。如果你们某些网关、框架、中间层对 `PATCH` 支持不稳定，请提前告诉我们是否需要提供 `POST` 或 `PUT` 的兼容方案。

`requestNonce` 幂等
前端生成接口会带 `requestNonce`，建议后端把它作为幂等键的一部分，避免用户连续点击时重复生成多套题。

`错误码`
建议至少统一：

- `40001` 参数错误
- `40002` 业务校验失败
- `40100` 未登录或 token 失效
- `40300` 无权限
- `40400` 资源不存在
- `40900` 并发冲突或重复提交
- `42900` 频率限制
- `50000` 服务异常
- `50010` LLM 调用失败

## 希望后端按什么格式回复最省时间

你可以让后端按下面格式回复：

```md
接口：POST /questions/generate
状态：已上线 / 开发中 / 未开始
请求体：...
响应体：...
与前端文档差异：...
预计可联调时间：...
```

这样比一句“这个差不多能用”更节省双方时间。
