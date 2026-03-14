# 发给后端的文件清单

这份文档是给你自己用的“发文件路线图”。

## 现在优先发给后端的现有文档

`学习文档/项目信息文档.md`
作用：让后端先知道项目是什么、页面有哪些、现在已经是“前端 + 独立 REST 后端”架构。

`学习文档/当前前端所需后端接口文档.md`
作用：这是最重要的一份。它描述的是前端代码当前真实依赖的接口，不是理想方案。

`学习文档/前端联调对接指南.md`
作用：让后端快速看到 Base URL、鉴权方式、统一响应结构、前端联调示例。

`学习文档/发给后端的接口问题清单.md`
作用：把最容易卡住联调的几个问题先提出来，避免双方各自开发一轮后才发现协议没对齐。

## 如果后端要负责 AI 出题链路，再补发这些

`学习文档/发给后端的一次性出题改造提示词.md`
作用：告诉后端为什么现在前端默认要走“一次性生成整套题目”，而不是老的分批补题。

`学习软件/生成链路迁移说明.md`
作用：说明当前前端真实入口、兼容保留逻辑、以及 `/questions/generate` 为什么已经是主入口。

`学习软件/模式A.md`
作用：后端如果要实现 Mode A 的出题规则，就需要这份。

`学习软件/模式B.md`
作用：后端如果要实现 Mode B 的出题规则，就需要这份。

## 不建议第一轮就发给后端的内容

`学习文档/AI-文档总览.md`
这是仓库内部导航文档，适合自己梳理，不适合首轮直接丢给后端。

`学习软件/页面文档.md`
这是偏早期的产品草图和页面想法，不是当前最准确的接口依据。

`学习文档/AI牛马刷题产品需求文档.md`
这份更偏完整产品背景，首轮接口对接不一定需要，只有后端想深入理解业务时再补发。

`学习软件/README.uniapp.md`
这更偏前端工程启动说明，不是后端联调重点。

`uni-preset-vue-vite/`
这是模板参考目录，不是当前真实业务工程。

## 如果你不想自己挑

你可以直接把下面这几份新整理文档发给后端：

1. `backend-handoff-01-project-context.md`
2. `backend-handoff-02-required-apis.md`
3. `backend-handoff-03-data-contract.md`
4. `backend-handoff-04-open-questions.md`
5. `backend-handoff-05-short-prompts.md`
6. `backend-handoff-06-rollout-order.md`

## 这 6 份新整理材料分别解决什么问题

`backend-handoff-01-project-context.md`
回答“这个项目在做什么，后端为什么要接这些接口”。

`backend-handoff-02-required-apis.md`
回答“前端现在到底在等哪些接口，哪些必须先做，哪些可以第二轮补”。

`backend-handoff-03-data-contract.md`
回答“字段必须怎么长，返回结构必须怎么包”。

`backend-handoff-04-open-questions.md`
回答“哪些坑要先确认，不然会反复返工”。

`backend-handoff-05-short-prompts.md`
回答“你发给后端的第一条消息怎么写最省事”。

`backend-handoff-06-rollout-order.md`
回答“如果材料太多，先做什么，再做什么”。
