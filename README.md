# 万物皆可排

> 👉 **想投稿模板？看 [CONTRIBUTING.md](CONTRIBUTING.md)**，三步就行。

B 站 Toy 上的纯前端 Tier 排行榜编辑器。React 19 + Vite + Tailwind CSS 4，交互组件用 Radix（shadcn/ui），图标用 Lucide，Bun 管理依赖和任务。

```sh
bun install --frozen-lockfile
bun run dev
bun run build
bun run check             # 校验社区模板 + 单元测试
bun scripts/sync-aa.mjs   # 从 Artificial Analysis 重新同步模型库
```

只上传 `dist/`；Vite 用相对 base，兼容 `/toy/<slug>/`。没有后端和账号：榜单自动存在当前浏览器，可以导出 / 导入 JSON。

## 功能

- 拖拽：鼠标、触摸（长按约 180ms）、键盘都能跨等级排序；点卡片可直接选等级。按住等级色块可整行拖动换位置。
- 等级预设：S+ – D、从夯到拉、T0 – T4；名称、颜色、顺序都能改。
- 选手库：默认放「当下旗舰」——每家 AA 智能指数最高的模型（≥ 30），再加上所有 ≥ 49 的前沿模型。搜索覆盖 AA 收录的全部 500+ 个模型。
- 自定义选手：Emoji / 首字、上传图片（浏览器内缩小）、40 家品牌 Logo。
- 右键等级 / 卡片有快捷菜单；拖进待定区的垃圾桶即可删除（可撤销）。
- 模板中心：内置模板 + `templates/` 下的社区模板。
- 分享链接：整份榜单压缩进 `?t=…`，不需要后端；B 站 App 内可拉起分享面板、生成二维码。分享前用 Toy SDK 的内容安全检查过一遍文字。
- 导出图片、JSON 导入导出、撤销重做、明暗主题。

## 社区模板怎么上线

```
templates/<id>/template.json + images/   ← 投稿人提 PR，CI 跑 build-templates --check
        │ bun run build
        ▼
public/community/<id>.json + <id>/*.webp  ← 图片缩成 128px WebP，随 Toy 包走 B 站 CDN
src/data/community.json                   ← 模板中心的索引
```

图片不走 GitHub 外链：国内访问不稳定、导出 PNG 会跨域，也绕过了平台审核。

## 代码结构

```
src/
  main.jsx              入口：初始化 store、注册全局快捷键
  App.jsx               页面骨架 + 弹窗路由
  store/editor.js       editorReducer（编辑 / 撤销重做 / 拖拽）+ 外部 store，持久化在 dispatch 里完成
  lib/                  纯函数：board（棋盘操作）、template（模板格式 / 分享编解码）、catalog（模型库）、share、toySdk、files、image、toast
  hooks/                useMediaQuery
  components/           通用组件：Logo、BrandAvatar、Modal、Toast、ui/（shadcn）
  features/board/       Toolbar、Board、TierRow、Pool、Tile、DropZone
  features/library/     选手库面板
  features/dialogs/     选手 / 等级 / 题材 / 确认弹窗
  styles/               tokens、base、layout、board、library、overlays、responsive
  data/                 models.json（scripts/sync-aa.mjs 生成）、community.json（scripts/build-templates.mjs 生成）
templates/              社区模板源文件 + schema.json
```

状态全部走 `dispatch({type, ...})`，组件用 `useSyncExternalStore` 订阅，不靠 `useEffect` 同步。

## 数据与许可

- 模型名单、厂商、发布日期和智能指数来自 [Artificial Analysis](https://artificialanalysis.ai/leaderboards/models) 公开页面，是某一天的快照（见 `src/data/models-source.json`）。
- 品牌 Logo 来自 LobeHub Icons（MIT），只引用 SVG 和配色常量。第三方品牌标识归各自权利人所有。

## 测试

```sh
bun run test                       # 棋盘、reducer、模板格式、分享编解码、模板构建的单元测试
bun run dev & bun run test:e2e     # Playwright：桌面 + 移动端
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome bun run test:e2e
```
