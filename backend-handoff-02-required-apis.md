# 给后端的前端必需接口清单

这份清单不是理想方案，而是前端代码当前真实在调用的接口清单。

## 第一轮必须先跑通的接口

`POST /auth/guest`
这是所有后续接口的入口。前端需要拿到 `token`、`refreshToken`、`expiresIn`、`user`。

`GET /users/me`
前端会在已有 token 时用它确认当前登录态是否有效。

`PATCH /users/me`
资料页会更新昵称和头像 URL。

`GET /llm/config`
首页和“我的”页面都会先拉当前 LLM 配置。

`PUT /llm/config`
用户改 provider、apiKey、baseUrl、model 后，前端会立刻同步到后端。

`POST /llm/config/verify`
前端会在用户填写 key 时触发校验；如果这个接口只是占位成功，前端会误判 key 可用。

`GET /tags`
首页、题集页、我的页面都会读用户标签。

`PUT /tags`
用户改标签后会同步保存。

`GET /practice-session/current`
练习页进入时会尝试从后端恢复当前会话。

`PUT /practice-session/current`
前端生成题目或会话变动后会同步当前练习会话。

`DELETE /practice-session/current`
交卷或退出时会清空当前会话。

`POST /questions/generate`
这是当前主生成入口。前端默认期望它一次性返回整套题目、会话、任务状态。

## 第二轮建议补齐的接口

`POST /files/avatar`
资料页上传头像时会调用，前端当前上传字段名是 `file`。

`GET /llm/providers`
资料页会拉 provider 列表；如果没有，前端会退回本地默认列表。

`POST /tags/generate`
“我的”页面会根据目标语句生成标签建议。

`POST /tags/retag-historical`
“我的”页面会触发历史题目重打标签。

`GET /question-bank`
题集页会按 `mainTab + tag + page + pageSize` 查询题库；前端也会优先用它做题库 hydration。

`DELETE /question-bank`
题集页批量删除题目时调用，请求体是 `{ ids: string[] }`。

`POST /question-bank/{questionId}/attempt`
练习页交题时会调用，前端需要拿到是否正确、正确答案、解析、练习统计字段。

`PATCH /question-bank/{questionId}/mastered`
题集页切换“已掌握”状态时调用。

`PATCH /question-bank/tags`
题集页批量改标签时调用。

## 兼容保留接口

`GET /generation-jobs/{jobId}`
只有当后端还保留旧的生成任务模型时，前端才会读它。

`POST /generation-jobs/{jobId}/batches/{batchIndex}`
只有当首次生成没有返回足量题目时，前端才可能触发它。

`POST /generation-jobs/{jobId}/cancel`
用户取消生成时会调用。

## 可以作为第一轮兜底方案的接口

`GET /question-bank/full`
如果分页题库查询还没稳定，前端还能先用整包快照接口兜底恢复题库。

`PUT /question-bank/full`
前端本地题库变化后，会把整包快照同步到后端。

## 对后端最重要的优先级结论

最小可联调主流程至少要先有：

1. `POST /auth/guest`
2. `GET /users/me`
3. `GET /llm/config`
4. `PUT /llm/config`
5. `GET /tags`
6. `PUT /tags`
7. `POST /questions/generate`
8. `GET /practice-session/current`
9. `PUT /practice-session/current`

如果后端想尽快让前端主流程完整可用，最优先补齐的是：

1. `POST /llm/config/verify`
2. `GET /question-bank`
3. `POST /question-bank/{questionId}/attempt`
4. `PATCH /question-bank/{questionId}/mastered`
5. `PATCH /question-bank/tags`
6. `POST /files/avatar`

## 前端最在意的不是“接口数量多”，而是这三件事

1. `/questions/generate` 能不能一次性返回整套题。
2. 返回的 `question/session/generationJob` 字段能不能固定。
3. 认证、头像上传、PATCH、DELETE body 这些协议细节能不能先说清楚。
