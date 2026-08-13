# DailyFlora Cloud

这是 DailyFlora 专用的 HBuilderX / uniCloud 后端项目壳，不替换仓库根目录的 Vite 网页前端。

在 HBuilderX 中打开本目录，然后在 `uniCloud-aliyun` 上关联服务空间：

- 服务空间：`dailyflora`
- SpaceID：`mp-7937f272-ccea-46ee-ac33-3e23abb1fa49`
- 云服务商：阿里云

部署顺序：

1. 关联已有服务空间。
2. 在 `uniCloud-aliyun/database` 初始化数据库 schema。
3. 在 `uniCloud-aliyun/cloudfunctions/dailyflora-api` 上传部署。
4. 配置 URL 化路径并把 HTTPS 地址写入主项目的 `VITE_DAILYFLORA_API_BASE`。

不要在此项目或 GitHub 中写入 `clientSecret`、AccessKey 或其他管理凭证。
