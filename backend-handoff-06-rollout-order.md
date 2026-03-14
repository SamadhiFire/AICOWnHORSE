# 文档很多时的对接顺序

如果你担心一次发太多材料把后端看晕，建议按下面顺序来，不要一上来把所有文档一起丢过去。

## 第一步：先做“接口边界确认”

先发这 3 份：

1. `backend-handoff-01-project-context.md`
2. `backend-handoff-02-required-apis.md`
3. `backend-handoff-05-short-prompts.md`

这一步你只想拿到 4 个结果：

1. 后端现在真实可用的接口有哪些
2. 哪些接口还没上线
3. 当前联调 Base URL 是什么
4. `/questions/generate` 是否已经是一体化返回

这一步不要先聊太深的产品细节，也不要先聊 Mode A / Mode B。
先把“有没有、通不通、谁负责”说清楚。

## 第二步：再做“字段契约对齐”

等后端告诉你“哪些接口能联调”之后，再发这 2 份：

1. `backend-handoff-03-data-contract.md`
2. `backend-handoff-04-open-questions.md`

这一步你要后端确认的是：

1. 每个接口实际请求体
2. 每个接口实际响应体
3. 返回对象是不是完整 `StoredQuestion / PracticeSession / GenerationJob`
4. 头像上传、token 刷新、PATCH、DELETE body 这些协议细节

也就是说，第二步解决的是“字段怎么长”，不是“功能要不要做”。

## 第三步：如果后端要接 AI 出题，再补“生成规则材料”

只有当后端明确要负责 AI 出题链路时，再补发下面这些：

1. `学习文档/发给后端的一次性出题改造提示词.md`
2. `学习软件/生成链路迁移说明.md`
3. `学习软件/模式A.md`
4. `学习软件/模式B.md`

这一步要解决的是：

1. 为什么前端默认要求一次性生成整套题
2. 为什么 batch 接口现在只是兼容保留
3. Mode A / Mode B 的规则边界
4. question schema 到底固定成什么样

也就是说，先确认接口，再确认字段，最后再确认 AI 生成规则。

## 第四步：最后做一次最小联调冒烟

建议按这个顺序测，不要一开始就全量联调：

1. `POST /auth/guest`
2. `GET /users/me`
3. `GET /llm/config`
4. `PUT /llm/config`
5. `GET /tags`
6. `PUT /tags`
7. `POST /questions/generate`
8. `GET /practice-session/current`
9. `PUT /practice-session/current`

主流程通了以后，再测这些二级能力：

1. `GET /question-bank`
2. `POST /question-bank/{questionId}/attempt`
3. `PATCH /question-bank/{questionId}/mastered`
4. `PATCH /question-bank/tags`
5. `POST /files/avatar`
6. `POST /tags/generate`
7. `POST /tags/retag-historical`

## 你和后端沟通时最省事的一句话

先让后端确认“接口有没有”，再让后端确认“字段长什么样”，最后才让后端确认“AI 出题规则怎么落”。

这样顺序最稳，也最不容易返工。
