# AGENTS.md

A Bilibili Toy (static tier-list editor, React + TypeScript + Bun) plus community templates in `templates/`. Most pull requests add a template.

## Adding a template

1. Create `templates/<id>/template.json`. Fields and rules live in `CONTRIBUTING.md` and `templates/schema.json`; follow them.
2. Images go in `templates/<id>/images/`. Prefer SVG for logos. Then **compress them**: `bun run images <id>` (shrinks rasters to ≤512px). CI rejects any image over 500KB, and the Toy only ships 128px versions, so large sources just bloat the repository.
3. When the template has images, add `templates/<id>/NOTICE.md` stating where each image comes from and its license. CI requires it.
4. `bilibili` is the contributor's own Bilibili UID: ask the human for theirs. The build shows that account's nickname and avatar as the author.
5. Run `bun run check` and fix what it reports.

Done when `bun run check` passes and the diff touches only `templates/<id>/`.

## Generated files

Edit the source, then regenerate:

| Generated | Source | Regenerate |
| --- | --- | --- |
| `public/community/**`, `src/data/community.json` | `templates/` | `bun run templates` |
| `templates/schema.json` | `src/lib/template.ts` | `bun run schema` |
| `src/data/models.json`, `public/logos/` | Artificial Analysis | `bun scripts/sync-aa.ts` |

## Changing the app

- State changes go through `dispatch(action)` in `src/store/editor.ts`; components read state with `useEditor()`.
- Data from outside (localStorage, imported files, share links, fetched templates, SDK responses) is parsed with zod at that boundary; code past the boundary trusts the types.
- Browser tests: `bun run dev`, then `bun run test:e2e`.
- Publishing to Bilibili is done by the maintainer after merge.
