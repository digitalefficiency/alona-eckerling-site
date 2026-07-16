# /media/client/ — the client's own media, register-gated

Client-owned real media (the professional's portrait, the clinic, the team) lands here **ONLY via
`ingest-assets.mjs install`** — never hand-copied. Every file must have a hash-matching row in the
dest-root `assets-manifest.json` with an approved/installed status and a **brief-confirmed license**;
`scripts/lint-media.mjs` fails otherwise. A file on disk with no manifest row is treated as
prior-client leakage. The scaffold ships this directory EMPTY (this README only).
See `site-foundry/references/materials-intake.md` (step 0m, חדר-החומרים).
