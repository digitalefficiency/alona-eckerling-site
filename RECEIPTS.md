# RECEIPTS — 2026-07-17 13:04

## שערים (gates)
- lint-copy (אפס placeholder/ביטויים אסורים): ✅ PASS
- lint-motion (טוקנים בלבד): ✅ PASS
- lint-design (עיצוב דורכן — DESIGN-DIRECTION בנוי ומבודל): ✅ PASS
- lint-plan (תכנון שלם — WIREFRAME + קובץ עמוק פר-סקשן): ✅ PASS
- lint-pain (הכאב-העוגן מגיע למסך-1 — סקשן ה-Hero): ✅ PASS
- lint-compose (כל בלוק-COPY נצרך — אפס יתומים): ✅ PASS
- lint-variety (גיוון-בתוך-אחדות — ארכיטיפ שונה פר-סקשן): ✅ PASS
- lint-structure (הורכב מ-STORY, לא ריסקון של דיפולט): ✅ PASS
- lint-media (מדיה מיוצרת/אמיתית — אפס ריסייקל של מדיה-תבנית): ✅ PASS
- lint-market (בניית-en — אפס מחרוזות-chrome עבריות שנשארו): ✅ PASS
- lint-seo (SELF-canonical פר-עמוד אינדקסבילי + sitemap/robots — הורג את באג ה-canonical-לבית): ✅ PASS
- lint-i18n (אתר דו-לשוני — hreflang פר-עמוד + עץ-לוקאל + sitemap; רדום באתר חד-לשוני): ✅ PASS
- lint-legal (זהות-משפטית מפורמטרת + אפס זהות-לקוח-קודם בקבצים נשלחים): ✅ PASS
- lint-lead (צינור-לידים — endpoint קיים · ResponsePromise צמוד · honeypot שמור): ✅ PASS
- lint-content (תוכן-לקוח — סכימה פר-אוסף · אפס HTML גולמי · alt חובה; רדום בלי אוספים): ✅ PASS
- validate-configs (סרט): — (הסקריפט לא קיים בפרויקט זה)

## סכימות (JSON-LD)
- `/`: — (השרת לא זמין על :3000 — הריצו `pnpm build && pnpm start -p 3000` והריצו שוב)

## Lighthouse (הרף: ≥90 בביצועים/SEO/נגישות)
- דולג — השרת לא רץ על :3000. להרצה אמיתית: `pnpm build && pnpm start -p 3000` ואז `node scripts/prove.mjs`.

_הקבלות האלו מצורפות ל-HANDOFF.md — מספרים אמיתיים מהריצה, לעולם לא הערכות._
