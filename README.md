# MDFlow Publisher

在 Obsidian 里完成「Markdown 写作 -> 平台预览 -> 一键复制 / 导出」的内容分发插件。当前支持微信公众号、X Articles、小红书。

## 付费知识库与答疑群

<a href="https://mp.weixin.qq.com/s/x924y3O9-nWda5OTHArKKg">
  <img src="assets/creator-ai-course.jpg" alt="创作者 AI 课：用 AI 杠杆、代码杠杆、媒体杠杆，重塑内容创作生产体系" width="720">
</a>

我的付费知识库与答疑群欢迎加入：
[https://mp.weixin.qq.com/s/x924y3O9-nWda5OTHArKKg](https://mp.weixin.qq.com/s/x924y3O9-nWda5OTHArKKg)

期待与你的深度链接，一起用AI赋能，创作生财📈

## 当前能力

### 微信公众号

- Markdown 转公众号可粘贴 HTML
- 6 种排版主题
- 图片自动转 Base64，复制后可直接粘贴到公众号编辑器
- 兼容 Obsidian 原生渲染链路，支持内部图片、任务列表、嵌入等常见写法

### X Articles

- 生成适合直接粘贴到 X Articles 的长文内容
- 保留更清晰的段落、标题、列表结构
- 自动识别文章图片，在正文里生成 `【插入图片 01：文件名】` 占位符
- 导出图片素材 ZIP，方便按占位符顺序上传到 X

### 小红书

- 3:4 图文卡片预览与导出
- 仅 `Jacky 模板` 带封面页
- 内置默认主题、赛博橙式、赛博薄荷、冷灰橙调等卡片主题
- 支持模板、字体、字号、头像等设置
- 支持下载当前页、批量导出全部页 ZIP
- 优化自动分页，尽量减少大面积空白、跳页和内容裁切

## 更新日志

### 2026-06-27 / v1.1.0

- X Articles 支持图片占位符和图片素材 ZIP 导出，解决长文里图片难以同步的问题。
- 修复 X Articles 部分图片被漏掉的问题，导出时会尽量保留本地图片、外链图片和 Base64 图片。
- 小红书新增 `赛博橙式` 主题，适配 Jacky 品牌橙色。
- 小红书移除部分不常用主题，让主题列表更干净。
- 优化小红书分页和内容测量逻辑，减少跳页、底部大面积空白和内容裁切。
- 修复小红书切换文章时预览偶发滞后的问题。

### 2026-05-29

- 小红书新增 `暗橙风格`、`亮绿风格`、`冷灰橙调` 3 个模板。
- 暗色模板下载图片时不再变成白底，白色文字可以正常显示。
- 模板下拉顺序调整为 `Jacky 模板`、`默认主题` 优先。
- 加粗、强调和高亮文字会跟随当前模板的重点色。

## 如何更新插件

1. 前往 [Releases](https://github.com/Jackywxsz/mdflow-publisher/releases) 下载最新版发布包。
2. 解压后把 `main.js`、`styles.css`、`manifest.json` 覆盖到你的 Obsidian 插件目录：

```text
.obsidian/plugins/mdflow-publisher/
```

3. 重启 Obsidian，或关闭再启用 `MDFlow Publisher` 插件。
4. 在插件设置里确认版本号为最新版。

## 安装

### 手动安装

1. 前往 [Releases](https://github.com/Jackywxsz/mdflow-publisher/releases) 页面下载最新发布包
2. 安装时只需要 `main.js`、`styles.css`、`manifest.json` 这 3 个文件
3. 如果你下载的是压缩包，解压后把这 3 个文件放到你的 Vault 目录：

```text
.obsidian/plugins/mdflow-publisher/
```

4. 重启 Obsidian
5. 在 `设置 -> 第三方插件` 中启用 `MDFlow Publisher`

### 开发模式

```bash
git clone https://github.com/Jackywxsz/mdflow-publisher.git
cd mdflow-publisher
npm install
npm run dev
```

## 使用方式

1. 打开一个 Markdown 文件
2. 点击左侧边栏图标，打开右侧 `MDFlow Publisher` 面板
3. 选择目标平台
4. 根据平台导出：

- 微信公众号：复制到剪贴板后，直接粘贴到公众号编辑器
- X Articles：复制正文后粘贴到 X，按 `【插入图片 xx】` 占位符上传导出的图片素材
- 小红书：下载当前页或导出全部页 ZIP

## X Articles 图片规则

X 不能像公众号一样稳定接收剪贴板里的本地图片，所以插件采用更稳的方式：

1. 正文复制时保留图片位置，自动写成 `【插入图片 01：文件名】`。
2. 同时导出图片素材 ZIP。
3. 发布到 X Articles 时，按占位符顺序把图片上传到对应位置。

如果图片下载失败，ZIP 里会带 `FAILED_IMAGES.txt`，可以根据里面的路径手动补图。

## 小红书规则

这是当前版本最重要的使用规则。

- `##` 二级标题：作为一个分节的标题，也会显示在图片上方
- `---` 分页符：在同一个二级标题下强制换页
- `###` 三级标题：只作为正文里的小标题，不负责分节
- 如果没有写 `---`，插件会根据内容长度、图片、代码块、列表等做自动分页

### 推荐写法

如果你要稳定控制分页，建议按下面的方式写。

```md
## 这是这一组卡片的标题

开头说明文字。

---

![图片](your-image.png)

这一页继续讲图片对应的内容。

### 这是正文子标题

补充说明。
```

### 推荐排版习惯

- 你希望显示在卡片上方的标题，直接写成 `##`
- 图片较高、代码块较长、列表较多时，优先手动加 `---`
- 一页里不要塞太多长段落，必要时主动拆成两页
- 想做封面时，使用 `Jacky 模板`
- 想快速出图时，优先使用其他无封面极简模板

## 已知限制

- 当前仅支持桌面端 Obsidian，`manifest.json` 中为 `isDesktopOnly: true`
- 小红书自动分页仍然是启发式规则，不是像素级排版引擎
- 长图、超长代码块、超长表格仍可能需要手动插入 `---` 微调
- 极少数外链图片图床可能不稳定，建议优先使用 Obsidian 本地图片或稳定 CDN
- 小红书目前更适合图文卡片导出，不是所见即所得设计器

## 开发

```bash
npm install
npm run dev
npm run build
```

如果你想直接部署到本地 Vault：

```bash
export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
npm run deploy
```

## 技术栈

- TypeScript
- Obsidian API
- Obsidian `MarkdownRenderer`
- `html-to-image`
- `jszip`

## License

[MIT](LICENSE)
