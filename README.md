# 2050 TRPG 规则书

基于 [VitePress](https://vitepress.dev) 构建的 TRPG 规则文档站（双等级系统：生物 10 级 + 职业 10 级）。

## 本地开发

```bash
npm install        # 安装依赖
npm run docs:dev   # 启动开发服务器（http://localhost:5173/）
npm run docs:build # 构建静态站点（输出到 docs/.vitepress/dist）
npm run docs:preview # 预览构建产物
```

## 目录结构

```
docs/
├── index.md           # 主页
├── intro.md           # 引言
├── dev-log.md         # 开发日志
├── core/              # 核心系统（类型/动作/检定/属性/影响度与破坏力）
├── characters/        # 种族（人类/亚种/生物等级速查）
├── classes/           # 职业（英雄/格斗家/职业规划）
└── lore/              # 世界观与势力
```

## 部署到 GitHub Pages

1. 推送代码到 GitHub 仓库
2. 仓库 Settings → Pages → 选择分支部署或使用 GitHub Actions
3. 若部署到项目子路径（`https://<user>.github.io/<repo>/`），需在 `docs/.vitepress/config.mjs` 中设置：

```js
export default defineConfig({
  base: '/<repo-name>/'
})
```
