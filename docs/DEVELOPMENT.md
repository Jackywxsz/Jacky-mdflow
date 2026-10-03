# 开发

```bash
npm ci
npm run dev
npm run build
```

如果你想直接部署到本地 Vault：

```bash
export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
npm run deploy
```

部署后，在 Obsidian 中重载插件并打开 Jacky-mdflow 面板，再运行 `npm run test:wechat`。此检查在已安装插件的真实 DOM 中验证正文宽度、主题编号与暖橙样式，不修改笔记；多个 Vault 同时打开时可用 `npm run test:wechat -- --vault="你的 Vault 名称"` 指定目标。
