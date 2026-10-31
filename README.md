# 万物皆可排

B 站 Toy：在线做 Tier 排行榜。拖一拖排好，导出图片或者发链接给朋友。

**打开：** https://www.bilibili.com/toy/tier-list

## 投稿模板

Toy 里「模板中心」的社区模板，都来自这个仓库的 `templates/` 目录。

1. 新建 `templates/<英文名>/template.json`：

   ```json
   {
     "$schema": "../schema.json",
     "title": "奶茶品牌排位",
     "author": "你的 B 站昵称",
     "bilibili": "你的 B 站 UID",
     "tiers": "cn",
     "items": [
       {"name": "蜜雪冰城", "image": "images/mixue.png"},
       {"name": "自己泡的", "emoji": "🫖"}
     ]
   }
   ```

2. 图片放进同目录的 `images/`。
3. 提 Pull Request。CI 会自动检查，合并后随下次更新上线。

字段和图片要求见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 本地运行

```sh
bun install
bun run dev     # http://127.0.0.1:5173
bun run check   # 校验模板 + 测试
```

## 许可

代码 MIT。模型数据来自 [Artificial Analysis](https://artificialanalysis.ai)，品牌 Logo 来自 [LobeHub Icons](https://github.com/lobehub/lobe-icons) 和 [Devicon](https://github.com/devicons/devicon)，商标归各自所有者。
