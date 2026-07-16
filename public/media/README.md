# public/media/ — the scaffold ships ZERO reusable client media

This template intentionally ships **no photography, no logo, no film**. A prior client's images must never
become a new client's images (that is the "it reused the Barzilay media" failure). Every asset is either
GENERATED for this client or is the client's own real photo.

- **generated/** — AI stills + film frames land here, produced in the generation step (5) per each section's
  `plan/sections/<NN>.md` **layer 8** (premium model, `site-foundry/references/premium-generation.md`).
- **Real photos** (headshots, real environment) — the client's own, captured per `media-studio.md` PHOTO-BRIEF.
- **Logo** — drop `logo.png` (+ optional `logo-dark.png`) here; until then `BrandLogo` shows the name wordmark.

`lint-media.mjs` fails the build if a page references a `/media/…` file that does not exist — so a page can
never ship pointing at template/placeholder media. Point refs at `/media/generated/<section>.webp`.
