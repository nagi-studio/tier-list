# 投稿社区模板

合并后的模板会出现在 Toy 的「模板中心」里，所有人都能一键使用。

## 三步投稿

1. Fork 本仓库，在 `templates/` 下新建一个文件夹，名字用小写英文和短横线，比如 `templates/milk-tea/`。
2. 在文件夹里写 `template.json`：

   ```json
   {
     "$schema": "../schema.json",
     "title": "奶茶品牌排位",
     "description": "一句话介绍",
     "author": "你的 GitHub 用户名",
     "tags": ["饮品"],
     "tiers": "cn",
     "items": [
       {"name": "蜜雪冰城", "image": "images/mixue.png"},
       {"name": "霸王茶姬", "image": "images/chagee.svg"},
       {"name": "自己泡的", "emoji": "🫖"}
     ]
   }
   ```

3. 图片放进同目录的 `images/`，然后发 Pull Request。机器人会自动检查格式，有问题会在 PR 里告诉你哪里要改。

## 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 标题，最多 60 字 |
| `tiers` | ✅ | `"classic"`（S+ – D）、`"cn"`（夯 → 拉完了）、`"numeric"`（T0 – T4），或自定义：`["神", "人", "鬼"]` / `[{"label": "神", "color": "#ff7f7f"}]` |
| `items` | ✅ | 1–200 个选手，名字不能重复 |
| `items[].emoji` | | Emoji 或 1–3 个字，没有图片时显示 |
| `items[].image` | | `images/` 下的 png / jpg / webp / gif / svg，每张 ≤ 2MB |
| `items[].icon` | | 内置品牌 Logo，可选值见 `src/components/BrandAvatar.jsx`（如 `openai`、`anthropic`） |
| `items[].tier` | | 预先放进第几级（从 0 开始），不填就在待定区 |
| `description` / `author` / `tags` | | 显示在模板中心 |

用 VS Code 打开时，`$schema` 那一行会给你自动补全和报错提示。

## 图片

- 构建时会自动缩成 128×128 的 WebP 打进 Toy 包，原图大一点没关系（≤ 2MB）。
- **Logo 优先用 SVG**，会等比缩放并留白；照片会居中裁成正方形。
- 只放你有权使用的图片：官方 Logo、自己拍的、CC0 / MIT 等允许再分发的素材。在模板目录里加一个 `NOTICE.md` 写明来源（参考 `templates/programming-languages/`）。

## 本地预览（可选）

```sh
bun install
bun run check   # 校验所有模板 + 跑单元测试
bun run dev     # 打开 http://127.0.0.1:5173 → ⋯ → 模板中心
```

## 审核

- 内容要符合 B 站社区规范：不涉政、不色情、不引战、不人身攻击。
- 合并后随 Toy 下次更新上线，上线前还会经过 B 站的审核。
