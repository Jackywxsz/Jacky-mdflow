# Jacky-mdflow

把 Obsidian 笔记排版为微信公众号文章、X Articles 长文和小红书图文卡片，在侧栏预览后复制或导出。

仅支持桌面端，最低需要 Obsidian 1.7.2。免费使用，无需登录。

Jacky-mdflow is a desktop plugin that formats Markdown notes for WeChat Official Accounts, X Articles, and Xiaohongshu.

## 支持的平台

- **微信公众号**：14 套排版主题，支持标题、重点标记、引用、代码和图片说明，复制后粘贴到公众号编辑器。
- **X Articles**：复制长文正文，保留图片位置，另行导出图片素材 ZIP。
- **小红书**：生成 3:4 图文卡片，支持模板、字体、字号、头像、分页及单页或批量导出。

## 开始使用

1. 打开要发布的 Markdown 笔记。
2. 点击左侧 Jacky-mdflow 图标，或在命令面板运行「Jacky-mdflow：打开内容分发面板」。
3. 在侧栏选择平台和主题，查看预览。
4. 公众号直接复制正文；X Articles 复制正文并按图片占位符补图；小红书下载当前页或导出全部页。

小红书可选「二级标题分页」或「正文卡片流」，用 `---` 手动换页。更多示例见 [详细用法](https://github.com/Jackywxsz/Jacky-mdflow/blob/main/docs/USAGE.md)。

## 使用提示

- 公众号正文不额外叠加左右边距；「暖橙」主题使用橙色标题和圆角配图，不自动添加章节编号。
- 更新前已复制到公众号的草稿，需要重新复制并替换正文，才能应用新版排版。
- X Articles 的图片需单独上传；下载失败的素材会列在 ZIP 中的 `FAILED_IMAGES.txt`。
- 小红书自动分页可能需要手动微调，超长图片、代码或表格可用 `---` 调整。
- 外链图片可能受图床限制，建议优先使用 Vault 内的本地图片。

## 隐私与联网

- 不收集遥测数据，不将笔记上传到作者服务器。
- 笔记含有外链图片时，会请求该图片地址，用于预览、复制和导出；排版不依赖远程服务。
- 读取当前 Vault 的笔记和图片。主动选择头像或封面时，会读取所选图片，其数据保存在当前 Vault 的插件配置中。
- 「关于作者」和下方个人站链接是静态推广入口，不自动加载远程广告；点击后由浏览器打开。

## 最近更新

### 1.5.1 · 2026-10-03

- 精简插件说明，安装和开发文档移至仓库，更多资源统一链接到个人站。
- 将公众号主题「橙色阅读」更名为「暖橙」，保留原有排版。

### 1.5.0 · 2026-10-03

- 减少公众号正文两侧的额外留白，复制后的阅读区更宽。
- 新增橙色标题、灰黑正文和圆角配图的公众号主题。
- 补充公众号排版所参考的 Skill 来源与许可致谢。

完整历史见 [更新日志](https://github.com/Jackywxsz/Jacky-mdflow/blob/main/CHANGELOG.md)。

## 更多资源与反馈

- [Jacky 无限生长 · 个人站](https://www.jackywxsz.club/)
- [问题反馈与功能建议](https://github.com/Jackywxsz/Jacky-mdflow/issues)
- [安装与开发文档](https://github.com/Jackywxsz/Jacky-mdflow/tree/main/docs)

## 许可与致谢

代码以 [AGPL-3.0](https://github.com/Jackywxsz/Jacky-mdflow/blob/main/LICENSE) 授权。

公众号的六套增强主题及部分 HTML 兼容处理，参考并适配自 [gzh-design-skill](https://github.com/isjiamu/gzh-design-skill)。感谢甲木 × 摸鱼小李共建的排版设计与主题组件库，保留原项目的 AGPL-3.0 © 2026 甲木 × 摸鱼小李版权声明。

其他依赖：[html-to-image](https://github.com/bubkoo/html-to-image/blob/master/LICENSE)（MIT，© 2017-2025 W.Y.）、[JSZip](https://github.com/Stuk/jszip/blob/main/LICENSE.markdown)（MIT，© 2009-2016 Stuart Knightley、David Duponchel、Franz Buchinger、António Afonso）。
