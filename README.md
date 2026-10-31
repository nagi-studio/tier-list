# Tier Studio · 万物皆可排

一个为 B 站 Toy 构建的纯前端 Tier 排名编辑器。React 19 + Vite + Tailwind CSS 4，UI 使用 shadcn/ui（Radix）和 Lucide，使用 Bun 管理依赖和运行任务。

```sh
bun install --frozen-lockfile
bun run dev
bun run build
```

只上传 `dist/`；Vite 使用相对 base，兼容 `/toy/<slug>/`。无需后端或账号，榜单自动保存在当前浏览器，可导出 / 导入 JSON 迁移。

- dnd-kit：鼠标、触摸手柄、键盘跨等级排序。手机长按卡片约 180ms；点击卡片可直接选择等级。
- 等级模板：S+ / S / A / B / C / D、从夯到拉、T0–T4。名称、颜色和行顺序可编辑。
- 选手模板：AI 大模型、饮品、空白。支持自定义名称、Emoji 和图片；上传图片在浏览器内缩小后保存。
- PNG 导出、JSON 导入导出、撤销重做、明暗主题。
- AI 目录精选各家当前主力系列，来源为 Artificial Analysis 的公开发行目录；是固定日期快照，不是性能排名或实时 API。详细来源见 `src/data/models-source.json`。
- Logo 使用 LobeHub 官方 Avatar 组件，遵循上游 MIT 许可。第三方品牌标识归各自权利人所有。

验证：

```sh
bun run test
# 先运行 bun run dev；Playwright 需已安装浏览器。
bun run test:e2e
# 已有 Chromium 时可指定二进制：
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome bun run test:e2e
```

桌面和移动端浏览器测试覆盖跨行拖拽、触摸拖拽、编辑、模板切换、刷新恢复、PNG 和 JSON 导出。状态测试覆盖前后排序、等级缩减保留选手，以及导入数据的完整性。
