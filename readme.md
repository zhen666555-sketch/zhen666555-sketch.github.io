**简体中文** · [English](README.en.md)

[![ZHEN · Full-stack developer｜应用、服务与数据](assets/readme-cover.svg)](https://zhen666555-sketch.github.io/)

# 曹泽祯 · ZHEN

**全栈开发工程师｜微信小程序、Java / Node.js / Python**

参与过文旅票务、户外活动与知识服务系统开发，工作覆盖小程序、运营后台、服务端与数据库。下面三个案例展示了我在交易一致性、活动流程和数据分析上的具体工作。

**[访问在线作品集](https://zhen666555-sketch.github.io/)**　·　[GitHub](https://github.com/zhen666555-sketch)　·　[邮件联系](mailto:zhen666555@gmail.com)

## 代表项目

### [龙庆峡｜文旅票务平台](https://zhen666555-sketch.github.io/#longqingxia)

*北京菲尔迪斯实习项目 · 微信原生小程序 / Java 21 / Spring Boot / MySQL*

**22 次请求 → 1 次。** 在每页 20 笔订单的回归场景中，通过历史快照和批量摘要合并请求，避免商品接口异常阻断历史订单查询。

对接微信支付和第三方票务，以服务端确认支付驱动出票；用幂等键、订单快照和持久化任务处理回调重试，支持按张退票后保留余票。

### [野一下｜户外活动管理平台](https://zhen666555-sketch.github.io/#yeyixia)

*北京菲尔迪斯实习项目 · 微信原生小程序 / Node.js / MySQL / 腾讯云 COS*

**7 张核心关系表。** 将原 JSON 快照迁入 MySQL，用唯一约束、事务和版本校验防止重复报名、覆盖写入。

串联主理人准入、活动审核、报名、保险登记、签到和完成审核。修改稿单独审核，费用变化后引导用户重新确认报名；退款需求仅登记与核对。

### [城市共享单车协同分析系统](https://zhen666555-sketch.github.io/#bike-transit)

*毕业设计 · 全栈开发 · 2025.11 — 2026.04 · Flask / GeoPandas / XGBoost*

**236 个物理站点、约 136 万条 POI。** 结合已有单车出行统计构建站点与小时尺度的接驳特征，通过地图和图表呈现结果。

按物理站点划分训练集和测试集，在训练折内拟合标准化参数；比较 OLS 与 XGBoost，并用 SHAP 和 PDP 解释特征。

## 实习经历

### 北京菲尔迪斯网络传媒有限公司

**全栈开发工程师（实习）｜2026.08 — 至今**

- 参与龙庆峡票务平台重构和野一下活动平台迭代，开发微信原生小程序、运营后台与服务端接口。
- 处理支付确认、异步出票、按张退票及活动变更后的重新报名；通过幂等、业务快照和事务约束保护订单与报名状态。
- 参与回归测试、腾讯云部署、版本回滚准备、备份校验与恢复演练，分别记录后端、后台及微信开发版交付。

### 晶锐科技有限公司

**全栈开发工程师（实习）｜2026.03 — 2026.06**

- 参与静疗知护平台开发，使用 Vue 3、Pinia 和 Flask-RESTX 实现业务页面及接口，覆盖知识检索、规则推荐与护理记录。
- 参与 Neo4j 知识关系整理、MongoDB 记录查询和 RAG 问答链路开发；配套登录续期、分页筛选及缓存。

## 其他项目

### [静疗知护 · 静脉输液知识图谱与智能问答平台](https://zhen666555-sketch.github.io/#iv-therapy)

*晶锐科技实习项目｜Vue 3、Flask、Neo4j、MongoDB、RAG*

- 将专业文档分块并记录来源，融合关键词、向量和图谱检索结果，去重排序后构造模型上下文。后端提供普通查询和 SSE 接口，并返回引用来源。
- 参与导管推荐规则与护理记录接口开发，将表单参数、规则结果与记录持久化串联。部分前端问答仍为演示路径。

### [知行法鉴 · 交通法律咨询 AI 小程序](https://zhen666555-sketch.github.io/#zhixing)

*全栈开发（小程序与云函数）｜2025.10 — 2025.12｜微信原生小程序、CloudBase、Node.js、DeepSeek API*

- 将事故描述经云函数提交给模型，把响应解析为案情分析、法规参考和处理建议。区分正常回答、云端通用建议与客户端离线示例，并维护聊天加载和滚动状态。

### [友邻社区 · HarmonyOS 智慧社区物业管理平台](https://zhen666555-sketch.github.io/#harmony-community)

*移动端开发｜2025.01 — 2025.04｜ArkTS、ArkUI、Stage / UIAbility*

- 使用 ArkUI 组织 20 个业务页面，封装公共 HTTP 请求、登录令牌与页面状态；对接物业公告、快递领取、家政预约和投诉反馈接口。

### [超市购物小程序](https://zhen666555-sketch.github.io/#shopping)

*小程序前端、Java 后端协作｜2024.11 — 2025.01｜微信原生小程序、Spring Boot、MyBatis、MySQL*

- 开发商品浏览、购物车和订单查询页面，对接商品规格、订单明细与用户信息接口。购物车操作后重新读取服务端结果，保持勾选与数量一致；支付和退款不在已完成范围内。

## 技术栈

- **客户端：** 微信原生小程序、JavaScript、Vue 3、Pinia、Element Plus、ArkTS / ArkUI
- **服务端与数据：** Java、Spring Boot、Spring Security、MyBatis、Node.js、Python、Flask、MySQL、Neo4j、MongoDB
- **分析与 AI：** GeoPandas、NetworkX、OLS、XGBoost、SHAP / PDP、RAG、DeepSeek API
- **工程交付：** Git、GitHub Actions、JUnit、Node.js 测试、腾讯云 CVM / COS、Nginx、systemd

## 仓库介绍

这是曹泽祯的个人主页源码与中英双语简历仓库，收录全栈开发实习经历和项目案例。在线作品集由 GitHub Pages 托管；本地直接用浏览器打开 `index.html`，即可浏览包含深空 Canvas 动效的响应式主页。
