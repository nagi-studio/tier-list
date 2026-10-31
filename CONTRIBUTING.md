# 投稿模板

## 目录

```
templates/milk-tea/          ← 小写英文和短横线
  template.json
  images/mixue.png
  NOTICE.md                  ← 有图片时写明来源
```

## template.json

```json
{
  "$schema": "../schema.json",
  "title": "奶茶品牌排位",
  "description": "一句话介绍",
  "bilibili": "12345678",
  "video": "BV1xx411c7mD",
  "tags": ["饮品"],
  "tiers": "cn",
  "items": [
    {"name": "蜜雪冰城", "image": "images/mixue.png"},
    {"name": "霸王茶姬", "image": "images/chagee.svg"},
    {"name": "自己泡的", "emoji": "🫖"}
  ]
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 最多 60 字 |
| `tiers` | ✅ | `"classic"`（S+ 到 D）、`"cn"`（夯 到 拉完了）、`"numeric"`（T0 到 T4），或者自己写：`["神", "人", "鬼"]`、`[{"label": "神", "color": "#ff7f7f"}]` |
| `items` | ✅ | 1–200 个选手，名字不能重复 |
| `items[].image` | | `images/` 里的 png / jpg / webp / gif / svg，每张不超过 500KB |
| `items[].emoji` | | 没有图片时显示，Emoji 或 1–3 个字 |
| `items[].icon` | | 内置品牌 Logo，比如 `openai`、`anthropic` |
| `items[].tier` | | 预先放进第几级（从 0 数），不填就在待定区 |
| `bilibili` | | 你的 B 站 UID，就是 `space.bilibili.com/` 后面那串数字。昵称和头像会自动显示，旁边有「去关注」；用这个模板导出的图片会署你的名 |
| `video` | | 你的一个视频的 BV 号，模板卡片上会显示「看视频」 |
| `author` | | 署名。填了 `bilibili` 就不用写，查不到昵称时才会用它 |
| `description`、`tags` | | 显示在模板中心 |

用 VS Code 编辑时，`$schema` 那行会提供补全和报错提示。

## 图片

- 提交前运行 `bun run images <文件夹名>`，把图片缩到 512px 以内并压缩。Toy 里只用 128×128，太大的原图只会让仓库变臃肿。
- Logo 尽量用 SVG，会完整保留并留白；照片会居中裁成正方形。
- 只放你有权使用的图片，并在 `NOTICE.md` 写明来源，可以参考 `templates/programming-languages/`。

## 本地预览

```sh
bun install
bun run check   # 只校验
bun run dev     # 打开后点 ⋯ → 模板中心
```

## 审核

- 内容要符合 B 站社区规范。
- `bilibili` 只能填你自己的 UID。
- 合并后随 Toy 下次更新上线，上线前还要过 B 站审核。
