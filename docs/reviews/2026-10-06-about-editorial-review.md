# DailyFlora About 全文审校 · 2026-10-06

## 审校对象与结论

本会话当前模型独立重读 About 英文全文、中文全文与各章节衔接，并对照当前页面和相关功能代码。审校基线为 `3c850bdfdfb3fad4570c52ec6d1dd7420de13832`；用户指出的原句可在 `1715c4a54f223ca6df6d8bc5f9e64d7f87e8cb7e` 对照。这里没有声称另行调用了一个外部模型，也不根据作者模型版本推断文案质量。

**主要问题是叙事立场与产品不合，而非几处英语语法。** 全文把“可以轻松观看的花束网页／桌面展示”反复写成“不被注视、不被展示、不索取注意力的存在”。这让读者难以理解为什么要打开、欣赏、收藏它。安静可以是一种观看方式，不应成为排斥观看的原则。

第一轮的 “A living bouquet for your screen.” 和 “scent and thoughts” 只是局部替换，没有解决段落衔接；不应作为整篇审校后的定稿。

交付：本报告及 [完整中英文候选稿](2026-10-06-about-copy-candidate.md)。本轮只增加审校文档；候选稿尚未覆盖网页。PR 的 header 修复仍保留，文案部分处于待审状态。

## 全文章节检查

| 位置 / 键 | 判断 | 处理意见 |
| --- | --- | --- |
| 页面标题、hero.title | “A bouquet for every day” 清楚、贴合日期花束，可保留。 | 作为整篇主线，不必每章再说一次。 |
| hero.tagline | “Where dates meet flowers.” 简洁，有项目识别度。 | 保留；旁边补一句具体的产品说明。 |
| meta.description | “digital art experience” 太宽，初访者仍不知道是什么。 | 说明是屏幕上的动态数字花束；桌面版本的 Beta 状态放在 Platforms。 |
| hero.caption | “growing in real time” 容易被理解为植物持续生长。当前代码可确认的是生成、渲染与视角运动。 | 改为 “A bouquet in motion.”，不把动画说成持续生长。 |
| opening.line / depth | “Out of the dark” 与 “depth of black” 几行之内重复同一个画面。 | 留一次黑底与花的描写，其余位置增加信息。 |
| opening.watch（用户指出的原句） | “It does not ask to be watched.” 语法成立，表达立场不合适：视觉作品本来就值得看。上一句 “does not ask what you are doing” 也在回答没人提出的问题。 | 整段重写为实际可见的花瓣、枝条、光线，不只替换最后半句。 |
| opening.arrives | “It simply arrives.” 与第一轮替换句没有自然因果，也没有说明怎样“到来”。 | 与日期变化连接，避免孤立的玄虚短句。 |
| opening.colour | 用户希望香气与思绪，这应是全文感官与记忆的线索，不能只把 colour 换成两个词。 | 候选：“Every day carries its own fragrance, its own thoughts.”；后文承接雨后、清晨、记忆。香气作为花的联想，不写成硬件功能。 |
| opening.bright / quiet / white | “Some” 在 days 与 flowers 之间指代含混；“air leans quietly” 类比牵强，“白色所以无话可说”没有铺垫。 | 让三个画面各自清楚，减少为押气氛而拼接的比喻。 |
| opening.light | 光停在花瓣上是有画面的；叶间留着风与屏幕效果的联系较弱。 | 可保留光线意象，用转动视角时的细节承接。 |
| window.label / calendar | 日历的一扇窗有想象空间，但不应再叠加大量抽象句。 | 本章落实“在屏幕上怎么看”，选择日期、拉近、旋转、全屏与时钟即可。 |
| window.title | “This is not an image that needs to be finished.” 让人反问：谁需要完成这张图？也可能被读成产品没完成。 | 删除这个无来由的否定句。 |
| window.remains | “经过时在，转身后还在”有轻微诗意，但没有增加产品理解。 | 可用一处桌面陪伴场景表达，不再反复论证“存在”。 |
| window.mac | 单独点名 Mac，使人误以为动态画面是 Mac 专属，与浏览器和 Windows 内容不一致。 | 浏览器讲观看；macOS / Windows Beta 统一导向 Platforms。 |
| window.time / every 24H | “时间不再与花分隔”抽象；`every 24H` 可以保留为视觉标识。 | 正文写日期和 Clock Mode。代码按本地下一日零点触发，不能进一步写成从打开网页起每满 24 小时新增永久作品。 |
| keep.label / title / intro | “Keep a day in bloom” 是有效的花与记忆比喻；“花请求再次被看”延续了不必要的拟人。 | 从人的选择出发：“A bouquet you want to see again.”，接清楚的收藏动作。 |
| keep.garden | “Your personal garden is not made for display.” 擅自限制用户如何使用收藏，且没有必要。 | 改为收藏喜欢的花束、以后回来看的正面说明。 |
| keep.date | 一日期一花束作为日常花束概念成立；不能扩展成所有自定义花束也严格一一对应。 | 用日期唤起记忆；不增加数据完整性或永久保存承诺。 |
| keep.return / colour / stillness / temperature | “那天的一部分还在”可以保留为情感线索；颜色、安静、温度三连偏通用，温度不是保存的数据。 | 改成喜欢的颜色、记得的一天、想起的人，让收藏理由更具体。 |
| grow.title | “a memory that has not yet found its name” 好听但绕，也不帮助用户理解如何创作。 | 以一张对自己有意义的图片开头。 |
| grow.image / feeling / sentence | 并列陈列很像三种独立输入模式；当前会员表单要求图片，文字是偏好备注。 | 明确“图片＋备注”；感觉、颜色、形态是选图和描述的方向，不伪装成文本独立生成。 |
| grow.form / share | “shape it” 容易被理解为生成后可编辑花型；当前生成列表可确认的是打开、改名、删除。 | 写成提交生成请求、查看进度、完成后打开结果；不承诺即时生成或生成后完整编辑。 |
| bloom.title / experience | 标题与第一句几乎逐字重复，随后仍在重复第一、二章的安静陪伴。 | 本章改为花束的视觉构成：颜色、枝条、疏密、观看角度，给读者新的内容。 |
| bloom.attention / remains | 再次否定观看价值：“Not as another object asking for attention.” “As a bouquet that remains.” 也只是对比残句。 | 全段重写，描述值得看的地方。 |
| bloom.presence | 书、音乐、工作是可理解的生活场景。 | 可以在观看章用一次；不把它延伸成抽象的“被选择留在身边的事物旁的一种存在”。 |
| bloom.final | “Every day brings a new flower” 混用单朵花、花束、日更作品。现有日期切换不等于每天归档一件新作品。 | 回到“每天的花束”和“喜欢就回来看看”的观看体验，避免新增花型或永久日更归档暗示。 |
| creator.body / label | 创作者署名清楚。 | 保留 CALFN LAU；不要为重写而扩张团队、履历或技术贡献。 |
| creator.contact | “or related conversations” 过于兜底。 | 精简为合作、展览、授权和媒体咨询；邮箱保持现有值。 |
| creator.legal / rights | 导航名称与署名属于必要信息。 | 保留；这轮不是法律条款审查。 |
| 页脚 | “No need to possess it.” 又在否定收藏；“flower” 与主线 bouquet 不一致。 | 候选：“A bouquet for today. A reason to come back tomorrow.” |
| 辅助文字 / ARIA | 应直说图像或控件的用途，不需要参与抒情。 | Today、Read the story 保留；花束画面用 “Today's bouquet in motion”等可理解描述。 |

## 已对照的实现证据

- `src/main.ts:1485`：按日期与 seed 重建场景，并更新 URL；`src/main.ts:1503`：按设备本地次日零点附近安排日期切换。它们不能单独证明“每天新增并永久归档一件独立作品”。
- `src/member.ts:55`：收藏通过日期、seed、theme 拼接打开地址。可表达“收藏后回来看看”，不承诺生成器变化后仍永久像素一致。
- `src/member.ts:77`：生成结果链接、改名和删除；`src/member.ts:92`：任务状态；`src/member.ts:226`：先有图片才可提交，文字是偏好备注。
- `src/i18n/index.ts` 的 VIEW / tutorial 文案及 `src/main.ts` 中相关控件支持旋转视角、缩放、全屏、日期选择和 Clock Mode 的表述。
- `downloads/index.html` 列有 macOS / Windows Beta 下载入口。本轮没有下载、运行安装包，也没有做在线账户和生成服务的端到端验收。因此候选稿标注 Beta，并不宣称远端可靠性已经通过验证。

## 相邻页面一致性核对

这是与 About 承诺有关的检查，不等于全站每一种语言和所有状态的完整审校。

1. **Objects：登记成功文案缺少实现。** `bouquet-shop/index.html` 的按钮处理只设置 toast 文本和计时器，没有持久化、表单提交或网络登记；`objects.toast` 却说 “Presale interest saved”。候选处理是把按钮改成明确的合作联系入口，或者真正实现登记后再保留成功提示。不能只把 toast 写得更好听。
2. **My garden：用户界面混入开发语言。** “这里不会显示虚构数据”、seed、Admin 本机 Codex、WebP、不进入 GitHub，均不适合作为普通用户的主要说明。应分别表达“尚无收藏”“等待处理”“图片将用于这次生成”。技术诊断可留在内部工具。会员正文大量硬编码中文，不能声称切换七种语言后页面全文已经本地化。
3. **Platforms：有用信息与内部实现混排。** 系统要求、芯片版本、Beta 状态、关闭窗口后的行为对用户有用；Three.js、MediaPipe、heavy runtime assets 不应占据产品介绍中心。下载可用性、签名状态等具体事实需由对应版本验证，本轮不改成更强的承诺。
4. **Sign in：主体清楚。** “Welcome back to your garden.” 和登录动作匹配，可以保留。“Sign in to an existing account” 用于导航偏长，但属于统一命名选择，不是语义错误。
5. **SciFi：主要是工具标签。** ROTATE / FULLSCREEN / PALETTE 等清楚，不应为了“统一诗意”改成难懂的动作。花束命名可保留作品语言。
6. **翻译源存在历史残留。** `src/i18n/index.ts` 的旧 `about.*` 与本页实际使用的 `aboutStory.*` 并存。修改应以 HTML 的 `data-i18n` 实际引用为准，不能看见旧文字就断言它在线显示。审校稿确定后，七种语言与 HTML fallback 应同步，避免切语言后恢复被否定的语义。

## 完整候选稿的取舍

保留“日期与花相遇”“让一天继续盛放”和用户指定的香气、思绪。每章承担一件事：每日画面、观看方式、收藏意义、以图片创作、花束的视觉语言、创作者。文字可以有诗意，但每段都应指向看得到的画面、说得清的感受或实际可做的动作。

中英文按各自语言写，不逐字套译。“fragrance, its own thoughts” 是候选表达，不是把用户的两个词机械替换回英文。`every 24H` 保留为用户要求的视觉文字；其旁边不用技术计时解释破坏阅读。

## 状态

- About 中英文全文：完成独立审校，附完整候选稿。
- 另外五种语言：尚未围绕新候选稿重新翻译，不声明全语种定稿。
- 网站代码：本轮未继续覆盖；已提交的顶部栏修复保留。
- 构建：代码基线 `3c850bdfdfb3fad4570c52ec6d1dd7420de13832` 的代码改动此前通过 `npm run build:vercel` 和桌面 / 手机 12 项顶部栏检查。本轮仅文档，无新增构建或在线验收结论。
- 合并 / 发布：未执行。
