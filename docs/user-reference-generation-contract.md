# DailyFlora 用户参考图生成正式契约

状态：正式开发契约（Vercel Blob + Supabase 实现代码已建立；Supabase 密钥与迁移待连接）
版本：1.1
日期：2026-07-22

## 目的

这份契约固定用户上传参考图并生成私人花花时的使用流程、数据边界和存储方式。后续接入 uniCloud、用户中心和超管后台时直接复用本契约，不重新发明字段或把图片塞入数据库。

## 用户流程

1. 已登录用户选择一张参考图。
2. 浏览器把图片处理成一张主参考 WebP 和一张小缩略 WebP。
3. 页面显示缩略预览，用户确认后提交。
4. 系统保存两张图片并开始识别。
5. 系统将识别结果匹配到 DailyFlora 已有的系统花材能力，生成颜色、构图、seed 和 Three.js 渲染参数。
6. 生成成功后自动新增一条“我的花花”记录；用户不需要执行导出操作。
7. 用户和有权限的超管以后可通过缩略图回忆当时上传了什么，并可查看主参考图和生成结果。

旧生成记录采用追加式保存。复制再生成会创建新记录，不热修改旧记录。

## 每次生成新增什么

每次生成只新增以下三项：

1. `reference.webp`：压缩后的主参考图，建议最长边 2048px。
2. `thumbnail.webp`：供用户记录列表和超管后台浏览的小缩略图，建议最长边 320px。
3. 一条用户生成参数记录。

两张 WebP 存入 Vercel Private Blob；参数记录存入 Supabase Postgres。Vercel 部署目录、GitHub 和本地项目目录均不承担用户图片的长期存储。Vercel Blob 是独立的私有对象存储，不属于部署包。

## 系统花材边界

系统花材库是 DailyFlora 的公共系统能力，不属于任何用户。

- 识别过程只匹配系统已经存在的花材和生成能力。
- 不为用户新建花材。
- 不复制系统花材到用户数据。
- 用户生成记录不得包含 `materials`、`materialList` 或同义的用户花材列表字段。
- 系统匹配过程中的临时候选可以存在于任务内存或日志中，但不作为用户资产保存。
- 为了复现结果，可以保存匹配器版本、系统版本和 Three.js 参数；这些不是用户花材列表。

## 单条数据库记录

一条记录至少包含：

```text
record_id
user_id
reference_asset
thumbnail_asset
recognition_result
palette
composition
seed
render_params
matcher_version
system_version
status
created_at
updated_at
```

其中 `reference_asset` 和 `thumbnail_asset` 只保存对象存储定位信息、尺寸和字节数，不保存图片 Base64。`render_params` 只保存复现该束花所需的渲染参数，不内嵌或复制系统花材定义。

不另建一条“用户花材”记录，也不为了同一次生成拆出独立的用户上传数据库记录。对象存储中的两张文件和这一条生成记录通过同一个 `record_id` 关联。

## 建议存储路径

```text
users/{user_id}/references/{record_id}/reference.webp
users/{user_id}/references/{record_id}/thumbnail.webp
```

路径中的 ID 使用系统内部稳定 ID，不使用邮箱、昵称或原始文件名。

## 图片处理约束

- 输入必须是浏览器可解码的图片，源文件默认不超过 20MB。
- 主参考图最长边默认 2048px，不放大较小图片，WebP quality 默认 0.86。
- 缩略图最长边默认 320px，不裁切，WebP quality 默认 0.8。
- 不长期保存用户上传的原始大图、RAW、HEIC 副本或额外成品截图。
- 如果浏览器无法解码源图片或输出 WebP，应在上传前明确报错，不创建半成品记录。

## 系统流程与状态

```text
preparing → uploading → recognizing → ready
                          └──────────→ failed
```

1. 后端先校验用户身份并分配 `record_id` 与私有存储路径。
2. 前端生成两张 WebP 后上传到对应路径。
3. 两个文件均成功后，写入一条 `recognizing` 参数记录并触发识别。
4. 识别服务只返回识别摘要、颜色、构图和渲染输入；系统花材匹配不生成用户花材数据。
5. 生成参数完成后原子更新为 `ready`。
6. 任一步失败均标记 `failed`；定时清理没有有效记录关联的孤立文件。

## 权限

- 用户只能创建和读取自己的记录。
- 普通用户不能根据对象存储路径猜测或读取他人的图片。
- 超管通过服务端角色校验读取缩略图和主参考图，不能依赖前端隐藏按钮。
- 前端通过需要 Supabase Bearer token 的 DailyFlora API 读取图片，不公开永久裸链或 Blob 读写 token。
- 删除账户时，两张图片与参数记录进入同一删除流程。

## 迁移与备份

数据库导出不包含对象存储文件。迁移时必须同时备份：

1. 用户生成参数记录；
2. `reference.webp` 与 `thumbnail.webp`；
3. `record_id`、`asset_id` 和存储路径映射。

业务记录使用自己的稳定 ID，不把 uniCloud 域名当作永久主键。这样以后迁移到其他对象存储时只需搬运文件并更新路径映射，不丢失用户生成历史。

## 当前代码入口

浏览器图片处理和正式记录类型位于：

- `src/userReferenceAssets.ts`
- `src/extendedTypes.ts`

当前实现入口还包括：

- `src/userReferenceCloud.ts`：Private Blob 客户端直传、记录创建、完成、失败、列表和删除。
- `api/reference-uploads.ts`：验证 Supabase 用户后签发五分钟、限定路径和 WebP 类型的上传 token。
- `api/reference-records.ts`：Supabase 参数记录的创建、读取、完成和一致删除。
- `api/reference-asset.ts`：验证用户或超管身份后转发私有图片。
- `api/reference-usage.ts`：超管容量检查。
- `supabase/migrations/20260722000000_user_reference_generations.sql`：正式数据表与 RLS。

识别服务本身仍是后续模块；当前接口已经固定其 `recognizing → ready/failed` 输入输出边界。
Preview/Development 与 Production 使用不同的 Private Blob store；数据库记录同时保存并强制过滤 `data_environment`，测试记录不会出现在正式站。
