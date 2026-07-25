# ביקורת UI/UX — אלונה אקרלינג · 2026-07-25

> נוצר עם סקיל `ui-ux-pro-max` (מאגר של כ-99 חוקי UX ב-10 קטגוריות עדיפות) כעדשת-ביקורת, על גבי בדיקה ידנית של הבילד.
> **שיטה:** 14 יחידות ביקורת (7 עמודים סקשן-אחר-סקשן + 6 עדשות רוחביות + אימות-מחדש של 25 הממצאים ההיסטוריים), 29 סוכנים, 108 ממצאים גולמיים → **98 עברו אימות אדוורסרי** (10 הופרכו).
> חלוקה: 1 חוסם · 12 חשובים · 53 שיפורים · 32 ליטוש.

---

## 0. ממצאים מבדיקה ידנית (לא נמצאו על ידי הסריקה האוטומטית)

שלושת אלה התגלו בהרצת הבילד ובסריקת `public/` בפועל, ואינם מופיעים ב-98 הממצאים שלמטה.

### 0.1 [חוסם] `public/_examples/` מגיש שלושה עמודי דמו ממותגים של הלקוח הקודם

`public/` מוגש ציבורית, כך שבעלייה לאוויר הכתובות האלה יחזירו עמודי נדל"ן ממותגים על הדומיין של אלונה:

- `/_examples/premium-about.html` — «ברזילי · חוויית עמוד אודות (דמו)», כולל «סבתא שרונה · ד״ר בועז · רועי», «שמאות מקרקעין», שאלות על תמ״א 38
- `/_examples/emil-motion.html` — «Emil · מעבדת מושן · ברזילי», כולל «היטל השבחה» ו«שמאי מהמשרד יחזור אליכם»
- `/_examples/taste-directions.html` — «taste-skill · כיווני עיצוב · ברזילי», כולל «רישיון מ‑1992 · #307»

**למה זה חוסם:** זו חשיפה של עבודה ללקוח אחר על נכס של לקוחה, ופגיעה במקצועיות אם מישהו נתקל בזה. הקבצים גם מפנים ל-`/media/services/urban-renewal.webp` שלא קיים.

**התיקון:** `rm -rf site/public/_examples`. אין אליהם שום קישור מהאתר. כדאי גם להוסיף שער שנכשל על מחרוזות הלקוח הקודם בתוך `public/`, כי `lint-media` בודק רק תמונות ולא HTML.

### 0.2 [חשוב] הבילד נכשל על `.next` מלוכלך

`pnpm build` נכשל בהרצה ראשונה:

```
Error: ENOENT: no such file or directory, open
'.next/static/D1pVW5l4g4W9U6poEGC9U/_buildManifest.js.tmp.5ovx3xth94v'
```

אחרי `rm -rf .next` הבילד עובר נקי (exit 0, כל 34 המתכונים נבנים כ-SSG). זה עקבי עם בעיית ה-iCloud הידועה במאגר הזה. **שווה לתעד ב-HANDOFF** כדי שהלקוחה או מפתח הבא לא יחשבו שהאתר שבור.

### 0.3 [שיפור] שתי אזהרות בילד אמיתיות

| אזהרה | פירוט | תיקון |
|---|---|---|
| `middleware` deprecated | Next 16 מבקש `proxy` במקום. הקובץ רדום כאן (`if (!isBilingual) return` בשורה 21) אבל זה חוב ברמת התבנית שיחזור בכל אתר עתידי | שינוי שם ל-`src/proxy.ts` + `export function proxy()` |
| NFT over-tracing | `next.config.ts → src/lib/content.ts → src/lib/collections.ts → src/app/feed.xml/route.ts` עושה פעולות קבצים דינמיות, אז Turbopack גורר את כל הפרויקט ל-bundle | לתחום את קריאות ה-fs ל-`path.join(process.cwd(), "content", ...)` סטטי, או `turbopackIgnore` |

בנוסף, `/blog` נבנה כ-route סטטי בזמן ש-`content/blog/` ריק — עמוד אוסף ריק חי.

---

## 1. מה כבר תוקן (התעלמו מ-DESIGN-AUDIT.md הישן)

הביקורת הישנה מ-16-17.07 מסומנת "☐ פתוח" על 67 ממצאים, אבל **21 מתוך 25 החוסמים והחשובים כבר תוקנו באמת**. אומת מול הקוד היום:

- ✅ דיסקליימר הפוטר — «ייעוץ רפואי או תזונתי אישי» (הנוסח השמאי נעלם)
- ✅ `manifest.ts` — התיאור של אלונה, `theme_color: #17382C`
- ✅ `opengraph-image.png` / `twitter-image.png` — כרטיס אמיתי של אלונה (ירוק-אורן, R.D.)
- ✅ `icon.svg` — סמל עלה חדש בפלטת «ירוק צלול»
- ✅ `UrbanRenewalLeadForm.tsx` ו-`/sane-voice` — נמחקו

הדוח שלמטה מתייחס **רק למצב הקוד היום**.

---
# ביקורת סופית לפני מסירה — אלונה אקרלינג

## שורה תחתונה

זה בניין חזק. הפלטה החדשה («ירוק צלול») מיושמת נקי כמעט בכל מקום, ה-RTL הוא מהטובים שראיתי (סריקה מלאה של תכונות פיזיות מול לוגיות החזירה כמעט אפס באגים אמיתיים), משמעת ה-YMYL נשמרת בקפדנות (אפס עדויות מומצאות, אפס לפני/אחרי, אפס הבטחה רפואית), וה-SequenceFilm הוא קוד המושן הכי ממושמע במאגר. הקופי מודבק נאמנה מ-COPY.md, וכל השערים עוברים.

הסיכון האמיתי לפני מסירה הוא לא עיצובי, הוא תפעולי: **הליד לא הולך לשום מקום**. אין יעד מוגדר לטופס, וכשהוא נכשל השרת עדיין עונה "הצלחה" והמשתמשת מקבלת הבטחה לחזרה אישית תוך 4 ימי עסקים. לצד זה, טבעת הפוקוס נעלמת לגמרי מכל כפתורי ה-CTA באתר (ה-clip-path של btn-chamfer חותך אותה), ובאנר העוגיות מכסה במובייל את שורת ההמרה כולה בביקור הראשון. אלה שלושה דברים שעולים כסף או חשיפה, לא ניואנסים.

מעבר לזה יש שלוש משפחות של חוב שמצטברות ולא נראות בשום שער: טוקנים שעוקפים את עצמם (טרקינג, רדיוסים, צללים, סקאלת כותרות), נגישות שקיימת בקוד אבל לא באמת (מגירת מובייל שנשארת בטאב-אורדר, אין skip-link, שגיאות טופס שלא מוכרזות), ותמונות גולמיות שעוקפות את next/image בשלושה עמודים. ה-DESIGN-AUDIT הישן כבר לא רלוונטי: מתוך 25 החוסמים ההיסטוריים, 21 תוקנו באמת ו-2 התיישנו. שני התיקונים עצמם יצרו שני חובות חדשים קטנים, שמופיעים למטה.

---

## קריטי (חוסם מסירה)

### 1. טבעת הפוקוס נעלמת מכל כפתור CTA באתר
**איפה:** [globals.css:341](site/src/app/globals.css:341) (הכלל `.btn-chamfer`), נצפה ב-[ContactQuietForm.tsx:322](site/src/components/ContactQuietForm.tsx:322), [contact/page.tsx:155](site/src/app/contact/page.tsx:155), ועוד 18 מקומות.

`.btn-chamfer` מקבל `clip-path: polygon(...)`. clip-path חותך כל מה שהאלמנט מצייר, כולל box-shadow חיצוני, ו-`ring-2` + `ring-offset-2` של Tailwind הם בדיוק זה. יחד עם `focus-visible:outline-none` על אותם אלמנטים, התוצאה היא שאין שום סימן פוקוס. סרקתי: 20 מתוך 22 מופעי `btn-chamfer` באתר משלבים `outline-none` עם ring חיצוני. זה כולל את ה-Header, את שני הטפסים, את ImageHero ואת כל עמודי הבית/הליווי/עליי/מתכונים/המלצות.

**למה זה חוסם:** האתר מפרסם ב[/accessibility](site/src/app/accessibility/page.tsx:45) הצהרת ת"י 5568 / WCAG 2.0 AA. משתמש מקלדת או switch-control שעובר על מסלול ההמרה לא רואה כלום זז. זו לא נקודה תיאורטית, זה הדבר הראשון שבודק נגישות פותח איתו, ולקוחה עם הצהרה חתומה חשופה.

**התיקון:** ב-globals.css, ליד הכלל של `.btn-chamfer`:
```css
.btn-chamfer:focus-visible { clip-path: none; outline: 2px solid var(--color-navy); outline-offset: 3px; }
```
זו הדרך הזולה והנכונה: מוותרים על הצ'מפר רק בפריים הממוקד, השילואט נשמר בכל שאר המצבים. אם מעדיפים ring, רק `focus-visible:ring-inset` שורד clip-path, ואז חובה למחוק `ring-offset-*`.

---

### 2. הליד נעלם: אין יעד מוגדר, והשרת עונה "הצלחה" גם כשהשליחה נכשלת
**איפה:** [api/lead/route.ts:97-110](site/src/app/api/lead/route.ts:97) — עלה משתי זוויות (יחידת "יצירת קשר" ויחידת "טפסים + המרה").

שני דברים נפרדים באותו בלוק. ראשית, `LEAD_WEBHOOK_URL` לא מוגדר, אז כל ליד נוחת ב-`console.info` של פונקציה serverless. שנית, וזה החמור: כשה-webhook **כן** מוגדר ונכשל, `deliverSigned` כבר עשה שני ניסיונות עם timeout של 5 שניות והחזיר false, הקוד רושם `[lead:fallback]` ל-console, ואז עדיין מחזיר `{ ok: true }`. הטופס מחליף למסך התודה שאומר «קיבלתי את הפנייה שלך. אני חוזרת אלייך אישית, עד 4 ימי עסקים».

**למה זה חוסם:** מיכל (אווטאר A) משאירה טלפון, מקבלת הבטחה שדיאטנית מוסמכת תחזור אליה, ואף אחד לא יחזור. זה נקודת הכשל היחידה של כל ה-ROI של הפרויקט. השער `lint-lead` ב-RECEIPTS מסמן PASS כי הוא רק בודק ש-`LEAD_WEBHOOK_URL` מופיע כמחרוזת בקובץ — [launch-verify.mjs:156](site/scripts/launch-verify.mjs:156) עושה regex על טקסט המקור, לא בדיקת env.

**התיקון (שלושה חלקים, חשוב לא לפספס את הניואנס):**
1. ב-route.ts, כשל **מוגדר** בלבד מחזיר שגיאה: `if (webhook && !landed) return Response.json({ok:false, error:"delivery_failed"}, {status:502})`. את ענף "אין webhook" משאירים ב-200 — זו תנוחת הבדיקה המכוונת שמתועדת ב-[MARKETING.md:59](site/MARKETING.md:59), ואם נשבור אותה כל שליחה תציג שגיאה כבר היום.
2. ב-[ContactLeadForm.tsx:104](site/src/components/ContactLeadForm.tsx:104) — הוסיפו למסלול ה-serverError יציאה לוואטסאפ («לא הצלחתי לקלוט את הפנייה. אפשר לכתוב לי ישירות בוואטסאפ» עם קישור ל-`https://wa.me/${site.whatsapp}`). ContactQuietForm כבר מציג שורת וואטסאפ, שם לא צריך.
3. **משימת שיגור:** להגדיר `LEAD_WEBHOOK_URL` + `LEAD_WEBHOOK_SECRET` בוורסל, לעשות שליחה end-to-end אמיתית ולרשום את הקבלה ב-RECEIPTS.md. להקשיח את launch-verify.mjs:156 שייכשל כש-env ריק בבילד. שימו לב: ב-[MARKETING.md §5](site/MARKETING.md) (שיגור) אין בכלל שורה על חיבור יעד הליד. זו הפרצה בצ'קליסט.

---

### 3. באנר העוגיות מכסה במובייל את שורת ההמרה ואת כפתור הנגישות
**איפה:** [CookieConsent.tsx:31](site/src/components/CookieConsent.tsx:31) מול [StickyContactBar.tsx:33](site/src/components/StickyContactBar.tsx:33) ו-[AccessibilityMenu.tsx:125](site/src/components/AccessibilityMenu.tsx:125).

הבאנר הוא `fixed inset-x-0 bottom-0 z-[60]` עם `pb-3` בלבד (12.75px ב-root של 17px), והכרטיס שבתוכו אטום (`bg-navy/95` + backdrop-blur). שורת ההמרה הדביקה תופסת 0-59.5px ב-z-50, וכפתור הנגישות תופס 17-68px ב-z-[55]. כלומר הכרטיס מכסה מלמטה 12.75px ומעלה — כ-47 מתוך 59.5 הפיקסלים של שורת ההמרה, ואת כפתור הנגישות במלואו. זה נכון לכל גובה כרטיס, לא תלוי בהערכה.

**למה זה חוסם:** כל מבקרת מובייל חדשה, כלומר כל ליד חדש, רואה את שורת «וואטסאפ + בואי נדבר» מושחרת עד שהיא מכריעה בעניין העוגיות. וואטסאפ הוא ערוץ ההפניה העיקרי של הלקוחה. חמור מזה לת"י 5568: מבקרת עם לקות ראייה שצריכה את תפריט הנגישות כדי לקרוא את הבאנר, לא יכולה להגיע לכפתור שפותח אותו. זה מצב לולאה סגורה.

**התיקון:** ב-CookieConsent.tsx:31 להרים את הבאנר מעל הכרום התחתון במקום להיערם עליו:
```
px-3 pb-[calc(3.5rem+0.75rem+env(safe-area-inset-bottom))] sm:px-4 md:pb-4
```
ובמקביל להגדיר את הסולם פעם אחת ב-globals.css (`--z-header:50 / --z-sticky:50 / --z-a11y:55 / --z-consent:60`) ולצרוך אותו, כדי שהצף הבא לא ייכנס עיוור.

---

## חשוב (פוגע בהמרה או באיכות)

### 4. מגירת הניווט הסגורה משאירה 7 יעדי טאב בלתי נראים
**איפה:** [Header.tsx:145-147](site/src/components/Header.tsx:145) — עלה משתי זוויות (נגישות + כרום גלובלי).

הסגירה נעשית עם `overflow-hidden` + `max-h-0` + `opacity-0` בלבד. אף אחד מהם לא מוציא אלמנט מסדר הטאב או מעץ הנגישות. מתחת ל-768px (וזה כולל דסקטופ בזום 400%, כלומר בדיוק האוכלוסייה שמשתמשת במקלדת) כל משתמש מקלדת נופל לתוך שישה קישורי ניווט + CTA בלתי נראים, וכל אחד מהם גורם לדפדפן לנסות לגלול קופסה באפס גובה לתוך המסך. ה-`aria-expanded={false}` על ההמבורגר סותר ישירות את מה שנגיש בפועל.

**התיקון:** `inert={!open}` על ה-`<nav id="mobile-nav">` בשורה 142. React 19.2.4 מעביר את זה ילידית, זה מוציא גם מסדר הטאב וגם מעץ הנגישות, וטרנזיציית ה-max-height נשארת שלמה.

### 5. JSON-LD של המתכונים מפרסם ערכים תזונתיים כשלבי הכנה
**איפה:** [\[collection\]/\[slug\]/page.tsx:65](site/src/app/[collection]/[slug]/page.tsx:65).

ה-lookahead `(?=\n##\s|$)` דורש רווח מיד אחרי `##`, אז כותרת `###` לא סוגרת סקשן. הרצתי את הפרסר עצמו על protein-pancakes.md: הוא פולט 9 recipeInstructions, כששלבים 6-9 הם «אנרגיה (קלוריות) - 367 קק"ל», «שומן - 9.7 גרם», «חלבון- 32.9 גרם», «פחמימה- 51.8 גרם». זה קורה ב-9 מתוך 34 מתכונים. בנוסף, מסנן הרכיבים לא בודק תו רשימה, אז ב-24 מתוך 34 מתכונים נכנסות שורות כמו `**לרוטב:**` או «(עבור 13 פנקייקים)» כ-recipeIngredient.

**למה זה חשוב:** זה דומיין YMYL תזונתי שכל סיפור ה-SEO שלו הוא ארכיון מהוגר של 93 URL-ים ישנים. כרטיס תוצאה עשיר שאומר "שלב 6: אנרגיה 367 קק"ל" הוא בדיוק הרשלנות ששירה הספקנית סורקת בשבילה, וזה מה שהלקוחה תראה ברגע שתריץ Rich Results Test במסירה.

**התיקון:** לשנות את הטרמינטור ל-`(?=\n#{2,}\s|$)`, ולהוסיף בשורות 68-71 סינון `.filter((l) => /^\s*[-*]\s/.test(l))` **לפני** ה-replace. בונוס אמיתי: את בלוק `### ערכים תזונתיים` שהשתחרר לפלוט כ-`nutrition: { "@type": "NutritionInformation", ... }`. לנעול את שלושת ההתנהגויות בהארנס הקיים, ולבדוק גם על מתכון רב-קבוצות (soba-noodle-salad).

### 6. עמוד /team/alona מדבר בלשון זכר-רבים ובקול של משרד
**איפה:** [team/\[slug\]/page.tsx:184](site/src/app/team/[slug]/page.tsx:184) — `text={"רוצים להתייעץ?\nדברו איתנו."}`.

כל מחרוזת אחרת באתר היא נקבה-יחיד, גוף ראשון, אישה אחת מדברת לאישה אחת. השורה הזו יושבת בבאנד ההמרה של העמוד ש-/about שולח אליו את שירה במפורש, והיא ב-sitemap. היא לא ב-COPY.md (שורה 239 רושמת רק את הקישור הנכנס). בדקתי: שתי המחרוזות האחרות בלשון זכר-רבים במאגר (HomeLeadSection, CtaBand) שייכות לרכיבים שאף אחד לא מייבא, אז זה העמוד החי היחיד עם קול של סוכנות.

**התיקון:** להחליף למחרוזת נקבה-יחיד בקול של §22 ב-/about (למשל «רוצה לשמוע עוד?\nבואי נדבר.»), ולהוסיף לCOPY.md תחת כותרת «עמוד: /team/alona». באותו מעבר: שורה 73 `{ label: "אודות" }` צריכה להיות `"עליי"` כדי להתאים ל-nav ב-site.ts — כרגע שני צמתי BreadcrumbList נותנים לאותו URL שני שמות.

### 7. §14 ב-/coaching מגיש 866KB תמונות גולמיות שעוקפות את next/image
**איפה:** [coaching/page.tsx:683, 692, 705](site/src/app/coaching/page.tsx:683) — עלה גם ביחידת ביצועים.

שלושה תגי `<img>` גולמיים מאחורי eslint-disable. green-shakshuka.jpg הוא 494KB ב-1536x2048 עבור באנד מובייל של 375x250; שני התמבנילים המרובעים (193KB + 199KB) מוגשים לתוך ריבועים של כ-135px. אין srcset, אין sizes, אין AVIF/WebP — ב-next.config.ts אין בכלל בלוק `images`. next/image היה מגיש כאן בערך 50KB. Lighthouse לא תופס את זה כי כולם lazy מתחת לקיפול, ולכן /coaching עדיין מקבל 91.

**נקודה שימושית למי שמתקן:** התיקון כבר קיים בקובץ ולא בשימוש — `ProofStill` בשורה 286 הוא עוטף next/image + grade-tint + grain שמוגדר ואף פעם לא נקרא.

**התיקון:** להחליף את שלושת התגים ב-next/image. שני התמבנילים דרך MediaFrame הקיים עם `ratio="1/1"` ו-`sizes="(max-width:768px) 45vw, 200px"` (הוא כבר מחיל grade-tint + grain, אז ה-overlay הידני יכול ללכת). הבליד: `<Image fill sizes="(max-width:768px) 100vw, 52vw" />` בתוך העוטף הממוקם הקיים. שימו לב: זה עולה אפס LCP, הרווח הוא כ-866KB תעבורה סלולרית ופחות ג'אנק פענוח בטלפון חלש.

### 8. הסרט מזריק גובה 420vh אחרי window.load, והעמוד קופץ מתחת לקוראת
**איפה:** [SequenceFilm.tsx:198](site/src/components/SequenceFilm.tsx:198).

`cinema` מתהפך רק אחרי window.load + 300ms + פענוח פריים 0. באותו רגע קורים שני דברים: התאום הסטטי עוזב את הלייאאוט (שורה 326, `cinema ? "sr-only" : "py-24"`), והסקשן גדל ל-420vh. בדסקטופ של 900px זו קפיצה נטו של כ-2,700px לכל מה שמתחת ל-§02 — הדוסייה, רצועת ההסמכות, טופס הליד. הסרט יושב מסך אחד מתחת להירו ו-LCP הוא 3.7 שניות, אז window.load נוחת הרבה אחרי שקוראת אמיתית התחילה לגלול. Lighthouse נותן CLS 0 כי הוא לא גולל.

**מיטיגציות שכדאי לדעת:** Chrome ו-Firefox מפעילים scroll anchoring כברירת מחדל והאתר לא מבטל אותו, אז קוראת שכבר מתחת לסרט מוגנת חלקית. Safari (מק ו-iOS) לא. וזה קורה פעם אחת לטעינה.

**התיקון (בזהירות):** לשמור את הגובה מהצביעה הראשונה, אבל **לא** דרך `@media (prefers-reduced-motion: no-preference)` — כי אז קוראת בלי JS תקבל קופסה של 420vh עם 880px טקסט בתוכה. במקום זה: מחלקה שהקומפוננטה הלקוחית מוסיפה ב-mount, או שמירת הגובה ברגע ש-`near` הופך true אבל **לפני** שהתאום נשלף מהלייאאוט.

### 9. שגיאות ולידציה בטפסים לא מוכרזות והפוקוס לא זז
**איפה:** [ContactLeadForm.tsx:74](site/src/components/ContactLeadForm.tsx:74) והפסקאות ב-151, 167, 204 — עלה מארבע יחידות שונות (בית, ליווי, נגישות, טפסים).

ב-submit שנכשל ה-handler עושה `setErrors` ו-`return`. שלוש פסקאות השגיאה הן `<p>` רגילות בלי `role="alert"` ובלי `aria-live`, בזמן ש-serverError בשורה 206 **כן** נושא `role="alert"` — כלומר זו השמטה, לא בחירה. הפוקוס נשאר על כפתור השליחה. הטופס הוא `noValidate`, אז גם הבועה הילידית לא מכסה. משתמשת קורא-מסך לוחצת «שליחה» ומקבלת שקט מוחלט.

הצד ההפוך של אותו באג: במסלול ההצלחה (שורות 112-119) כל ה-`<form>` נעלם ומוחלף ב-`<div role="status">` טרי. אזור חי שנכנס ל-DOM יחד עם התוכן שלו לא מוכרז אמין ב-NVDA/VoiceOver, וכפתור השליחה הממוקד בדיוק נהרס, אז הפוקוס נופל ל-`<body>`.

**הערת דיוק:** שגיאת ההסכמה (שורה 204) כן מוצגת ישירות מעל הכפתור ובתוך המסך, אז תרחיש "לחצתי ולא קרה כלום" חל על שם וטלפון, לא על ההסכמה.

**התיקון:** `role="alert"` על שלוש הפסקאות; לפני ה-return המוקדם למקד את הפקד הראשון — `ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()`; ובמסלול ההצלחה `tabIndex={-1}` על העוטף + focus ב-effect. הקוד הנכון כבר קיים ב-[ContactQuietForm.tsx:83](site/src/components/ContactQuietForm.tsx:83) — כדאי להרים ל-`src/lib/form-focus.ts` ולצרוך משני הצדדים.

### 10. צבע שגיאת הוולידציה נכשל בניגודיות בכל מקום שבו הוא מופיע
**איפה:** [globals.css:30](site/src/app/globals.css:30) — `--color-bad: #d6455d`. עלה משתי יחידות.

חישבתי: על לבן (כרטיס ContactLeadForm) 4.31:1, על sand #EFF3EC (כרטיס /contact) 3.84:1, על bg #FBFCF9 4.19:1. כולם מתחת ל-4.5:1, וכל השגיאות ב-`text-sm` (14.9px), אז אין פטור טקסט-גדול. 13 נקודות שימוש. בקופסת ה-serverError עם `bg-bad/10` זה יורד ל-3.40:1. הציון a11y 100 לא רואה את זה כי הצמתים קיימים רק אחרי כשל שליחה. בנוסף #d6455d הוא ארגמן קר בפלטה שמכוונת חמימה.

**התיקון:** לשנות ל-`#A34E46` (זה rose-ink שכבר בפלטה, 5.01:1 על sand) או ל-`#B3243C` (6.4:1 על לבן, 5.7:1 על sand). להוסיף `--color-bad-soft` נפרד לקופסת ההתראה במקום ערבוב אלפא של אותו גוון כושל.

### 11. ה-Reveal על תמונת ה-LCP של /coaching מאפס אותה אחרי הצביעה
**איפה:** [coaching/page.tsx:414](site/src/app/coaching/page.tsx:414).

ההערה שלוש שורות מתחת אומרת את זה בעצמה: "this band IS the mobile LCP". MediaFrame מקבל `eager` ופולט `loading="eager" fetchPriority="high"`. אבל `<Reveal>` מריץ useLayoutEffect בהידרציה שמחיל `translate-y-6 opacity-0`, ואז מחכה ל-IntersectionObserver. אימתתי בדפדפן חי ב-412x823 שהבאנד באמת מועמד ה-LCP (58,051px² מול 35,243px² למועמד הבא).

**דיוק:** ה-SSR מרנדר `opacity-100`, אז אם התמונה נצבעת לפני שההידרציה נוחתת (המקרה השכיח), Chrome כבר רשם את ה-LCP והמחיר הוא הבזק ולא זמן. אבל ההבזק עצמו — מיכל רואה תמונת קליניקה, היא נעלמת, היא חוזרת — הוא בדיוק ההפך מהשקט שהעמוד מוכר.

**התיקון:** למחוק את עוטף ה-`<Reveal>` סביב הבאנד (להשאיר `<div className="relative mt-10 lg:hidden">`). ההירו כבר נושא MOrchestrate, וחוק הבית הוא אורקסטרטור אחד לסקשן. אם רוצים reveal, חייב להיות כזה ששומר opacity (ClipReveal). שימו לב ש-`--dur-reveal` הוא 1s, אז החלפת טוקן פשוטה תאט, לא תזרז.

---

## שיפורים (הרף הפרימיום)

### טוקנים שהאתר עוקף את עצמו
- **טרקינג הקיקר.** [globals.css:44-49](site/src/app/globals.css:44) כותב מפורשות «never re-roll tracking-[…] on a kicker row», ובכל זאת ארבעה ערכים חיים בעמוד הבית לבד: `0.14em` ב-[page.tsx:284](site/src/app/page.tsx:284) (הקיקר הראשון שמבקרת רואה), `0.12em` ב-SequenceFilm 254 ו-329, ועוד `.15em/.16em/.2em/.22em` ב-15 קבצים נוספים. המופעים ב-`.18em` (PageHero, CredentialStrip, ResultCard, MChapter) זהים מספרית לטוקן — היגיינה בלבד. התיקון: `tracking-eyebrow` בכל מקום, ואז grep ב-lint gate על `tracking-\[`.
- **סקאלת הכותרות.** `--text-display` מוגדר ב-globals.css:97, מתועד בסטייל-גייד, ונצרך על ידי **אפס** רכיבים. במקביל 13 קבצים מגלגלים clamp ידני משלהם ל-h2. הדלתא הוויזואלית קטנה (ה-h1 של הבית הוא 3.3rem מול 3.4rem בעמודים פנימיים, כלומר 1.7px, ורק מעל 1156px), אז זו איחוד סקאלה ולא "להגדיל את הכותרת". מתחילים מ-PageHero.tsx:28 שמגלגל ידנית בתוך הרכיב שהטוקן נקרא על שמו.
- **רדיוסים.** שני טוקנים (8px כפתור / 16px כרטיס) נצרכים 5 פעמים בסך הכול, מול `rounded-[10px]` x44, `rounded-[6px]` x32, `rounded-[4px]` x27, `rounded-[16px]` x26, `rounded-2xl` x12. הליבה האמיתית: אותו תפקיד "כרטיס" מרונדר ב-16 / 12 / 10 / 14 בקבצים שונים, ו-DESIGN-DIRECTION.md:25 קובע 16. שימו לב שה-CTA-ים ב-`rounded-[6px]` הם **לא** באג — ההערה בטוקן אומרת מפורשות שה-CTA-ים הולכים דרך `.btn-chamfer`.
- **סולם הצללים.** globals.css:57-63 מקצה את הרמות בשמות מפורשים ("2 = sticky chrome (Header, StickyContactBar), 3 = modals (AccessibilityMenu, CookieConsent)") וכל אחד מהם מתעלם. השלושה הבאמת חורגים הם השחורים הגולמיים: [CookieConsent.tsx:33](site/src/components/CookieConsent.tsx:33), [AccessibilityMenu.tsx:125](site/src/components/AccessibilityMenu.tsx:125), [WhatsAppFloat.tsx:18](site/src/components/WhatsAppFloat.tsx:18), פלוס שלושה `shadow-sm` ב-SequenceFilm.
- **טקסט על נייבי.** 28 מופעים של `text-slate-*` (הרמפה הכחלחלה של Tailwind) על שדה ירוק-שחור שבמכוון עבר de-blue ב-07-19, בחמש דרכים שונות לאותו תפקיד. הכי משמעותי: [SectionHeading.tsx:23](site/src/components/SectionHeading.tsx:23) מחיל את זה על כל ליד כהה באתר. כולם עוברים AA (הגרוע, Footer:62, הוא 4.94:1), אז זו התאמת פלטה ולא כשל. התיקון: להוסיף `--color-on-navy` ו-`--color-on-navy-muted` ל-@theme ולהחליף.

### נגישות שקיימת בקוד אבל לא בפועל
- **אין skip-link, ול-`<main>` אין id.** [layout.tsx:81](site/src/app/layout.tsx:81). grep על "skip" מחזיר אפס תוצאות UI. כל ניווט מכריח משתמש מקלדת לעבור לוגו + 6 קישורים + CTA + המבורגר. Lighthouse עובר כי `bypass` מסתפק בקיום landmark. זה גם סותר את הטענה ב-[/accessibility:31](site/src/app/accessibility/page.tsx:31) «האתר תומך בניווט מקלדת». התיקון: `id="main" tabIndex={-1}` על ה-main, ו-`<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[70] ...">דילוג לתוכן הראשי</a>` כילד ראשון של body. `start-3` ולא `left-3` בגלל ה-RTL, ו-z-[70] כדי לעקוף את באנר העוגיות.
- **כפתור הנגישות הצף יושב על שורת ההמרה.** [AccessibilityMenu.tsx:125](site/src/components/AccessibilityMenu.tsx:125) — `bottom-4 left-4` (17px עד 68px) מול שורה שתופסת 0-59.5px, ב-z גבוה יותר. חפיפה של 40px, ובגלל ה-RTL הצד הפיזי-שמאלי הוא בדיוק חצי «בואי נדבר». התווית הממורכזת נשארת גלויה, אבל זו רצועה של כ-51px שנגנבת ומלכוד מיס-טאפ. התיקון: `bottom-[calc(3.5rem+0.75rem+env(safe-area-inset-bottom))] md:bottom-4`, ואותו הזזה לפאנל בשורה 140. את `left-4` להשאיר — זה מתועד ומכוון ב-[WhatsAppFloat.tsx:3-8](site/src/components/WhatsAppFloat.tsx:3).
- **הגדרות הנגישות השמורות מוחלות רק אחרי הידרציה.** [AccessibilityMenu.tsx:70](site/src/components/AccessibilityMenu.tsx:70) — `useLayoutEffect` רץ אחרי שה-HTML המוזרם כבר נצבע, ואין סקריפט bootstrap ב-layout.tsx. מבקרת עם `textPct: 145` שמור רואה 17px רגיל לאורך כל חלון ה-FCP→hydration (3.7s), ואז העמוד קופץ. התיקון: `<script dangerouslySetInnerHTML>` כילד ראשון של body שקורא את אותו מפתח localStorage ומשחזר את fontSize/filter/classes, עם ייצוא של ה-KEY ושמות המחלקות כדי שלא יתפצלו.
- **«עצירת אנימציות» לא עוצרת את טבעת הסמן.** [EvidenceCursor.tsx:14](site/src/components/EvidenceCursor.tsx:14) בודק רק `prefers-reduced-motion` ולא את `motionAllowed()` שכולל את `html.a11y-stop-motion`. לולאת ה-rAF כותבת transform בכל פריים ואף כלל CSS לא יכול לעצור אותה. זו ההבטחה היחידה שהווידג'ט חייב לקיים. שאר חמשת הרכיבים שנטענו כבעייתיים (Reveal, HeroShutter, HeroEntrance, RevealHeading, StatCounters) למעשה מנוטרלים על ידי כללי ה-CSS הקיימים — רק זה לא.
- **טפסי /contact פחות נגישים מטופס הבית.** [ContactQuietForm.tsx:299](site/src/components/ContactQuietForm.tsx:299) — אין קישור למדיניות הפרטיות בשורת ההסכמה (הטופס הגנרי כן יש לו), אין `aria-label` על ה-form, ואין סימון ויזואלי לשדות חובה. הפריט המהותי הוא הקישור: זו הצהרת הסכמה על דומיין בריאות שגם שומרת IP ו-user-agent. שימו לב שמחרוזת ההסכמה מודבקת מ-COPY.md:355, אז יש לתקן שם קודם.
- **פתיחת שדה האימייל מפילה את הפוקוס.** [ContactQuietForm.tsx:47](site/src/components/ContactQuietForm.tsx:47) — `emailRef` מוצהר ומחובר אבל `.focus()` לא נקרא לעולם, והטריגר נעלם ב-`setEmailOpen(true)`, אז הפוקוס נופל ל-body. באותו מקום: אף אחד לא מוודא פורמט אימייל (לא הלקוח ולא השרת), אז `errors.email` הוא קוד מת.

### תוכן שסותר את עצמו
- **דף העדויות לא יכול לעולם להציג עדות אמיתית.** [testimonials/page.tsx:38](site/src/app/testimonials/page.tsx:38) — המצב הריק הוא JSX ליטרלי בלי שום תנאי. `content/settings/testimonials.json` הוא `[]`, `settings.schema.json` הוא `{}` (אז /admin לא חושף עורך), ו-`export const testimonials` ב-lib/settings.ts לא מיובא בשום מקום. המצב B שמפורט ב-spec 33 שכבה 5 פשוט לא קיים בקוד. במסירה: כשתגיע העדות המאושרת הראשונה, אלונה תצטרך לשלם למפתח. `TestimonialCard` כבר קיים ומשמש בסטייל-גייד. שימו לב שה-props שלו הם `{quote, attribution:{name, context}}` בלי שדות הסכמה, ושCOPY.md §34 כבר מכיל את גרסת הכותרת המאוכלסת — צריך לחווט גם את פיצול הקופי.
- **הסכמה שמבטיחה יותר ממה שהאתר עושה.** [ContactLeadForm.tsx:196](site/src/components/ContactLeadForm.tsx:196) אומרת «לצורך מענה בלבד ולא יועברו לצד שלישי», בזמן ש-route.ts:86-93 חותם IP + user-agent + country, ו-[attribution.ts:157-161](site/src/lib/attribution.ts:157) מחזיר referrer/user_agent/language/screen/viewport **בלי** בדיקת הסכמה. **דיוק חשוב:** נתוני הקמפיין (UTM) כן מוגנים — הם ב-localStorage שנכתב רק אחרי הסכמה. אז ההאשמה המדויקת היא חמישה שדות מכשיר שעוקפים את השער, פלוס משפט הסכמה שסותר את /privacy §5 שמונה חמישה מעבדים חיצוניים. באותו מעבר: /privacy:24,43 ו-/terms:26 עדיין מתארים רכישת חוברת ורשימת Smoove שירדו מהאתר — כולל «המחירים באתר נקובים בשקלים חדשים» כשאין באתר אף מחיר.
- **חבילות /coaching: הבחירה נזרקת בדלת.** [coaching/page.tsx:636](site/src/app/coaching/page.tsx:636) — שלושת ה-CTA מצביעים על `#lead` חשוף, ושדה ה-subject היחיד בטופס הוא ברירת מחדל קשיחה. אישה שבילתה 40 שניות בבחירה בין בסיס 60 יום למורחב 120 יום שולחת ליד זהה לפנייה קרה. `data-cta` נכנס ל-dataLayer ולא ל-payload. **זהירות בתיקון:** `href="#lead?pkg=slug"` אינו fragment תקין והגלילה תיכשל בשקט — להשתמש ב-`/coaching?pkg=<slug>#lead`.
- **34 עמודי המתכונים נגמרים באמצע.** [\[collection\]/\[slug\]/page.tsx:174](site/src/app/[collection]/[slug]/page.tsx:174) — הדף נגמר ב-Prose. אפס מתכונים נושאים gallery ואפס נושאים FAQ, אז שני הסקשנים המותנים מתים לעד. אין רכבת מתכונים קרובים, אין סגירה, אין קישור חזרה לארכיון בגוף. **בהקשר:** ה-layout כן עוטף בכל עמוד Header + Footer + StickyContactBar, אז יש נתיב המרה — הפער האמיתי הוא היעדר סגירה **הקשרית** ורכבת מתכונים, והרצועה הבעייתית באמת היא טאבלט 768-1023px. שימו לב שה-CTA של הארכיון מצביע ל-/coaching בזמן שה-CTA הגלובלי מצביע ל-/contact — צריך להכריע לפני שמעתיקים.
- **/styleguide חי בפרודקשן עם תוכן של הלקוח הקודם.** [styleguide/page.tsx:309](site/src/app/styleguide/page.tsx:309) — BioCard של עורך דין («מלווה משפחות בהסדרי ירושה», «חבר לשכה משנת 2009», «LL.M») על אתר של דיאטנית, פלוס 6 תמונות ב-404 (אין `public/media/team/` ואין `public/media/features/`). זה noindex, לא ב-sitemap, ואין אליו קישור, וכל מחרוזת מסומנת (דמו)/(דוגמה) — אז זה לא זליגת אמון חיה. אבל זו נכס פנימי שנמסר ללקוחה, ושני השערים שהיו תופסים אותו פוטרו ממנו במפורש (lint-copy EXEMPT_DIRS, lint-media BRAND regex).
- **הסתירה בסיטמאפ.** [sitemap.ts:20](site/src/app/sitemap.ts:20) מגיש `/testimonials` בזמן ש[testimonials/page.tsx:69](site/src/app/testimonials/page.tsx:69) מכריז `robots: { index: false }` ללא env gate. אותו קובץ מתעד בכותרת למה /blog **לא** נכלל, מאותה סיבה בדיוק. ביום ההשקה זו שגיאת כיסוי אדומה ב-Search Console על דומיין YMYL חדש.

### תמונות ופורמט
- **הסרט מגיש 1.29MB JPEG לא-רספונסיבי.** [SequenceFilm.tsx:209](site/src/components/SequenceFilm.tsx:209) — 14 פריימים ב-1400x781, בדיוק 1,349,148 בתים, כ-`<img>` גולמי. אייפון 390px מוריד בדיוק אותו דבר כמו דסקטופ 1440px. הבתים **כן** מחוץ לחלון ה-LCP בזכות שער window.load, אז זה מחיר תעבורה וזמן-מוכנות ולא רגרסיית Core Web Vitals. ב-WebP q75 מדובר בכ-400-450KB, ב-AVIF כ-300KB. בנוסף אין שער per-frame: הסקראב כותב `opacity: "1"` על פריים שלא הגיע. תיקון זול לנכונות: לדלג על פריים ש-`img.complete` שלו false, כדי שהסקראב יחזיק את הפריים האחרון שפוענח במקום להראות `bg-sand` חשוף.
- **AVIF לא נסחר בכלל.** אין בלוק `images` ב-[next.config.ts](site/next.config.ts:5), אז ברירת המחדל היא `["image/webp"]` בלבד. אימתתי מול השרת: בקשה עם `Accept: image/avif` מקבלת `content-type: image/webp`. התיקון הוא שורה אחת: `images: { formats: ["image/avif","image/webp"], qualities: [60,75] }`. שימו לב שהצפנת AVIF יקרה בכ-20% ב-CPU, וה-`qualities: [60]` שווה כי quality={60} על שלושת הרקעים השטופים כרגע נחתך ל-75.
- **/about מגיש moroccan-fish.jpg פעמיים כ-`<img>` גולמי.** [about/page.tsx:254, 270](site/src/app/about/page.tsx:254) — 177KB ב-1330x2110 לתוך באנד מובייל של 375x250. **חשוב לדעת:** זו לא חריגה מקומית ל-/about, זה דפוס בית לשכבות בליד דקורטיביות (אותו דבר ב-coaching ו-SequenceFilm), אז לתקן בשני המסלולים או בכלל לא. שתי התגיות lazy ומתחת לקיפול, אז אפס השפעת LCP.
- **אריח ה"מלאכה" ב-/about משתמש בתמונה הכי נמוכה ברזולוציה וחותך 62% ממנה.** [about/page.tsx:470](site/src/app/about/page.tsx:470) — quinoa-citrus-salad.jpg הוא 562x1000 בתוך `aspect-[3/2]` ברוחב של כ-500 CSS px, כלומר בערך 1x במסך רטינה. יש בספרייה חלופות ב-1400-1536 רוחב (green-shakshuka, spinach-cheese-bourekas, homemade-hummus, soba-noodle-salad).
- **הרשת של /recipes מבקשת חצי תמונה לאריחים הרחבים.** [RecipesArchive.tsx:156](site/src/components/RecipesArchive.tsx:156) — רק אריח ה-feature קיבל את ה-`sizes` הרחב, אבל `i % 9 === 4` מייצר עוד שלושה `lg:col-span-2` (אריחים 4, 13, 22, 31) שנכנסים לקופסה של 785px ומצהירים 410px. **דיוק:** `i % 7 === 3` מייצר אריחים **גבוהים**, לא רחבים, אז הם צריכים ערך ביניים משלהם ולא את ה-820px.
- **צ'יפ הקטגוריה על אריחי תמונה יורד ל-3.6:1.** [RecipesArchive.tsx:172](site/src/components/RecipesArchive.tsx:172) — הסקרים הוא `bottom-0 h-2/3`, אז לפינה העליונה שבה הצ'יפ יושב אין הגנה בכלל, רק `bg-navy/40`. הרכבתי מול הפיקסלים האמיתיים בגאומטריית ה-lg: tuna-shawarma 3.59:1, bean-noodle-fish-salad 4.16:1, bulgur-broccoli-salad 4.20:1. `backdrop-blur-sm` מטשטש ולא מכהה. התיקון: `bg-navy/80` והורדת `border-white/25`.
- **71% מהמתכונים בלי זמן הכנה.** 24 מתוך 34 קבצים שולחים את המחרוזת «לא צוין» לשדה שמסומן `"required": true` ב-collections.json. השומר על ספרות ב-[RecipesArchive.tsx:80](site/src/components/RecipesArchive.tsx:80) מפיל אותה בשקט, וה-meta של הכרטיס נופל ל-`tags[0]`, כך ש-24 כרטיסים מציגים מילה אחת בודדה («צמחוני» ב-8, «טבעוני» ב-7) שכבר יושבת כצ'יפ בסרגל הסינון שתי שורות מעל. הפתרון העיקרי הוא תוכן (למלא ערכים אמיתיים, הגוף כבר מציין אותם), והמשני הוא לדחוף `category` לפני `tags[0]`.
- **מסנני התגים AND בלי ספירות ובלי מצב מושבת.** [RecipesArchive.tsx:253](site/src/components/RecipesArchive.tsx:253) — 3 מתוך 21 זוגות תגים ו-17 מתוך 56 צירופי קטגוריה×תג מחזירים אפס, ואז מודפס `labels.empty` שאומר «עוד מתכונים בקטגוריה הזו בדרך» גם כשלא נבחרה שום קטגוריה. הצעד: ספירה חיה לצד כל צ'יפ + `aria-disabled` על אפס + מחרוזת empty שנייה למקרה של תגים בלבד.

### מושן וביצועים
- **lint-motion מדווח "נקי" בזמן ש-14 ליטרלים חיים.** [lint-motion.mjs:41](site/scripts/lint-motion.mjs:41) — הבדיקה דורשת את הצורה `duration:` (prop של אובייקט), אז כל צורת ה-utility של Tailwind בלתי נראית: `duration-700` (Reveal, Gallery, BlogCardGrid, AngularFrame), `duration-500` (StickyScroll, ExpandingPanels x2), `duration-300` (Header x3, MagneticButton), `duration-[800ms]` (BookShelf). בנוסף `collectFiles` סורק רק `.tsx`, וה-ALLOWLIST מכסה את **כל** globals.css, אז `transition: transform 0.25s cubic-bezier(0.2,0.7,0.2,1)` בשורה 191 עובר. שער שמדווח ירוק על חוק שהוא לא אוכף גרוע יותר מהיעדר שער. התיקון הכי משתלם כאן הוא הרחבת ה-lint, לא 14 העריכות.
- **ה-Header מריץ querySelector ו-forced layout בכל אירוע גלילה.** [Header.tsx:29](site/src/components/Header.tsx:29). **דיוק:** `getBoundingClientRect()` לא נקרא בכלל, כי `dh` תמיד null וה-`&&` מקצר — יש קריאת layout אחת (`scrollHeight`) לפריים, לא שתיים, ואירועי גלילה כבר מיושרים לפריים. העלות שנשארת: שאילתת attribute-selector על כל המסמך + forced layout אחד לפריים, משולב עם כתיבות ה-style של SequenceFilm באותו פריים. עוטפים ב-rAF guard ומרימים את ה-querySelector מחוץ ל-handler.
- **ה-Header מנפיש height ו-padding על אלמנט עם backdrop-blur.** [Header.tsx:87](site/src/components/Header.tsx:87) — `transition-[height]` על הלוגו ו-`transition-all` על האי (שמנפיש padding). זה מתרחש באמצע גלילה על אלמנט עם `backdrop-blur-md` וצל. ה-header הוא fixed, אז הריפלואו כלוא בתת-העץ שלו ולא במסמך, ושכבת backdrop-filter מרוסטרת מחדש בכל פריים בכל מקרה — לכן זה medium ולא high. עדיין: להחליף ל-`scale` על הלוגו ולריווח קבוע.
- **`will-change` ננעץ לצמיתות.** [globals.css:426](site/src/app/globals.css:426) — `.split-inner` מקבל `will-change: clip-path` על מחלקת הבסיס, לא על `.is-animating`, וגם תחת reduced-motion. הדפוס הנכון כבר קיים בקובץ פעמיים (`.reveal-heading.is-masked .rh-inner` ו-SequenceFilm שמשחרר ב-IntersectionObserver). החצי החזק יותר הוא ה-JS: `will-change-transform` על שלוש שכבות MScrollScene מלאות-מסך + כל MParallax + כל DeckCard, לכל אורך חיי הרכיב, מול הערה בקוד עצמו שאומרת שה-GPU "חייב את הזיכרון בחזרה".
- **HeroEntrance מאפס CTA שכבר נצבע.** [globals.css:564](site/src/app/globals.css:564) — `hero-fade-up` עם `both` והשהיה של 0.62s מחזיק את ה-from-state, והתכונה שמפעילה אותו נוספת ב-`useEffect` + rAF אחרי הצביעה. הרצף בפועל ב-/recipes: CTA גלוי → CTA ריק ל-620ms → מופיע. ה-h1 עשר שורות מעל משתמש ב-`SplitText autoplay` ששולח `is-animating` כבר ב-HTML של השרת ולכן לא מהבהב. שני מודלי מושן סותרים באותו הירו.
- **סטאק three.js מת אבל עדיין תלות.** three, @react-three/fiber, drei, postprocessing, @react-spring/three ב-package.json, שלושה רכיבים יתומים (Scene3D, StoryScene, ShaderHero) שאף route לא מגיע אליהם, ושלוש מהתלויות לא מוזכרות בכלל בשום מקום ב-src. **דיוק:** `transpilePackages: ["three"]` לא באמת מריץ transpile כי שום דבר לא מייבא — הסרתו לא תזיז את זמן הבילד. הניקוי הוא היגיינת מסירה (גודל התקנה, שטח ביקורת), לא ביצועים.
- **פס ההתקדמות של הסרט מוסתר לגמרי מאחורי שורת ההמרה.** [SequenceFilm.tsx:237](site/src/components/SequenceFilm.tsx:237) — `bottom-0` על במה `sticky top-0 h-[100svh]`, מתחת ל-StickyContactBar שהוא 59.5px. אותו קובץ כבר פתר את זה לכתוביות בשורה 291 (`bottom-[calc(9vh+3.5rem+env(safe-area-inset-bottom))]`). ה-Header כן מצייר פס התקדמות משלו לאורך כל הסקשן המוצמד, אז לא הולכים לאיבוד לגמרי — אבל הרמז ברמת הביט אובד.
- **הקרוסלה הדביקה של §04 עם 500ms קשיח.** [StickyScroll.tsx:64](site/src/components/motion/StickyScroll.tsx:64) — `transition-opacity duration-500` עם עקומת ברירת המחדל של Tailwind. משך של 500ms לגמרי בסדר בבית הזה (`--dur-reveal` הוא 1s), החטא הוא המספר הקשיח והעקומה הזרה. זה נופל תחת תיקון ה-lint למעלה.

### עקביות ויזואלית ומידע
- **שלושת כרטיסי החבילות לא מיושרים.** [coaching/page.tsx:613](site/src/app/coaching/page.tsx:613) — מדדתי חי ב-1280px: כותרות ה-h3 ב-5708/5708/5727 (קו הוורד של הכרטיס המודגש דוחף 19px), ושורות «למי זה מתאים:» ו«מה כלול:» בפער של 47px (ה-chip שרק לכרטיס 1 יש). רק ה-CTA-ים בתחתית מיושרים דרך `mt-auto`. spec 12 קובע מפורשות «identical in system» ו«laid side by side so she can compare-at-a-glance». **התיקון התואם-ספק:** לתת chip לכל שלושת הכרטיסים (הספק מבקש chip משך/דרג לכולם) ולרנדר את הקו על כולם ב-`bg-rose` מול `bg-transparent`. הערה נפרדת: `lg:-translate-y-2` על כרטיס הדגל מחשב ל-`translate: 0px` ב-1280px, אז ההנחה בהערת הקוד לא מתקיימת בדפדפן.
- **§03 בעמוד הבית: אין דיוקן, ומספר הרישיון הכי קטן בסקשן.** [page.tsx:424](site/src/app/page.tsx:424) — החריץ 4:5 מכיל כרטיס ביקור טקסטואלי, ואף תמונה בעמוד הבית לא מכילה אדם. **חשוב:** הדיוקן החסר הוא חוסם-נכס-לקוח מתועד ב-plan layer 8, לא מחדל בנייה, וכלל ה-YMYL אוסר להחליף פנים. מה שכן שווה שינוי: `רישיון משרד הבריאות 204526-11` מרונדר ב-12.75px בצ'יפ אפרפר זהה לזה של «B.Sc», למרות ש-layer 7 קורא לו «the single un-fakeable anchor». זו החלטת טעם מול הספק (שמבקש ארבעה צ'יפים שווים), אבל מול שירה בת 39 היא נכונה.
- **הטקסט העברי מוטה בפאוקס-איטליק.** [SequenceFilm.tsx:270](site/src/components/SequenceFilm.tsx:270), [Comparison.tsx:70](site/src/components/section/Comparison.tsx:70), [page.tsx:620](site/src/app/page.tsx:620). Frank Ruhl Libre נטען עם משקלים 500/700/900 ובלי `style: ["italic"]`, ולמשפחה אין בכלל חיתוך נטוי. הדפדפן מטה את הגליפים העבריים סינתטית. זה מוטיב מכוון ומתועד, אבל בעברית אין מסורת נטויה והצורות נשברות. הכי חלש: הטקסט של Comparison ב-14.9px `text-muted` מעל תמונת רפאים ב-0.16 אטימות.
- **גדלי גופן ב-px מנטרלים את בקרת גודל הטקסט.** [AccessibilityMenu.tsx:52](site/src/components/AccessibilityMenu.tsx:52) עובד דרך דריסת font-size של ה-root, אז כל rem גדל וכל px קפוא. שבע מחרוזות קטנות קפואות, ביניהן הקיקר של ההירו ושורת ההרגעה מתחת ל«בואי נדבר». **דיוק תקינה:** SC 1.4.4 מסופק גם על ידי page zoom של הדפדפן, אז אין כאן כשל תקן — יש ווידג'ט שהאתר מפרסם שעובד חלקית ונראה שבור ב-150%.
- **/team/alona דל יותר מהסקשן ששלח אליו.** [about/page.tsx:508](site/src/app/about/page.tsx:508) — הקישור אומר «לעמוד ההסמכות המלא» ומוביל לעמוד שבו `credentials` הוא עותק מקוצץ בלי שנים ובלי קישור למרשם, ובלי narrative/qa/photo כל העמוד מתמוטט להירו + טופס. בנוסף: שני צמתי Person JSON-LD חולקים `@id` זהה עם מערכי `hasCredential` שונים.
- **manifest ו-favicon על פלטה ישנה.** [manifest.ts:13](site/src/app/manifest.ts:13) — `background_color: "#FBF6F1"` הוא hex מהפלטה שפרשה, וגרפ מחזיר מופע אחד בלבד. אין `<meta name="theme-color">` בכלל (layout.tsx מייצא metadata ולא viewport), אז שורת הכתובת אפורה בכל ביקור. ה-favicon.ico הוא מ-16.07 ומכיל את הנייבי הישן #22304C. **תיקון נכון:** `brand.extra.bg` ולא `brand.colors.bg` (bg לא נמצא ב-colors, זה יישבר). ולגבי ה-ico: לחדש מ-icon.svg ולא למחוק, כדי לא לאבד fallback.
- **אין CTA ראשי בכלל ברצועת הטאבלט 768-1023px.** [Header.tsx:117](site/src/components/Header.tsx:117) — ה-CTA בכותרת מופיע רק ב-lg, וההמבורגר + השורה הדביקה מתים ב-md. **דיוק:** WhatsAppFloat דווקא נדלק בדיוק ב-768 בשביל זה, אז זו לא האפלה מוחלטת — אבל פעולת ההזמנה הראשית לא מרונדרת ככפתור. `lg:inline-flex` → `md:inline-flex`.
- **ה-CTA של הכותרת הוא bg-navy, וענף הזהב שלו הוא קוד מת.** [Header.tsx:118](site/src/components/Header.tsx:118) — `light` נגזר מ-`[data-dark-hero]` שאף עמוד לא מציב, אז הענף שמצייר `bg-gold` לא יכול להתרנדר לעולם, וה-CTA היחיד שיושב על כל דף הוא היחיד בצבע הכותרות. כל שאר ה-primary באתר הם bg-gold.
- **הניווט לא מציין את העמוד הנוכחי.** [Header.tsx:103](site/src/components/Header.tsx:103) — `usePathname()` מיובא ומשמש רק לסגירת המגירה. אין `aria-current` בשום מקום בצד הציבורי. תיקון: לחשב `active` בשני ה-maps ולסמן עם קו תחתון ורוד + `aria-current="page"`, לא בצבע בלבד.
- **/accessibility בלי רכז נגישות בשם ובלי ערוץ שאינו טופס.** [site.ts:55](site/src/lib/site.ts:55) — `accessibilityCoordinator` ריק, אז מרונדר רק ה-fallback «ערוץ פנייה: דרך עמוד יצירת הקשר». מבקרת שנחסמת בגלל בעיית נגישות מופנית לטופס. **אל תתקנו בקוד:** התיבה `alona@alonaeck.com` עדיין לא קיימת (site.ts:25 אומר שהתיבה החיה היא הג'ימייל), והטלפון לא לפרסום בהחלטת הלקוחה. זו משימת נתוני-לקוח לפני השקה, פלוס שער שנכשל כשהשדה ריק ו-allowIndexing true.
- **הדיסקליימר המחייב בתקנון מכסה ייעוץ רפואי בלבד.** [terms/page.tsx:32](site/src/app/terms/page.tsx:32) אומר «ואינם ייעוץ רפואי או תחליף לו», בזמן ש-[Footer.tsx:72](site/src/components/Footer.tsx:72) אומר «רפואי או תזונתי אישי». אלונה דיאטנית: החשיפה שלה היא ייעוץ תזונתי אישי, וזו בדיוק הקטגוריה שהסעיף המחייב משמיט. שימו לב שהניסוח מגיע verbatim מ-spec 38, וש-terms:6-8 מסמן את §5 כממתין לעו"ד — אז זה שייך למעבר המשפטי, לא לעריכת קוד עצמאית.

---

## ליטוש

- הכותרת של דף העדויות חוזרת על עצמה חמש פעמים («סיפור שלא קרה» x3, «במילים שלהן» x3). כל המחרוזות מודבקות verbatim מ-COPY.md §32-34, אז התיקון מתחיל שם או שהסנכרון הבא יחזיר אותו. [testimonials/page.tsx:23](site/src/app/testimonials/page.tsx:23)
- ה-CTA הסופי של /coaching: «בואי נדבר, שיחת היכרות חינם» הוא `<p>` דומם מעל כותרת «השאירי פרטים» של הטופס עצמו, בזמן שהכפתור האמיתי אומר «שליחה». שתי כותרות serif bold text-xl גב אל גב. [coaching/page.tsx:808](site/src/app/coaching/page.tsx:808)
- כפתור השליחה ב-/contact אומר «שולח…» בזכר, בזמן שהטופס בבית אומר «שולחת…». ההערה בקוד טוענת שהם זהים, וזה לא נכון. המקור הוא COPY.md:355 מול COPY.md:93 — לתקן שם קודם. [contact/page.tsx:76](site/src/app/contact/page.tsx:76)
- Portrait/Monogram מבקש `/media/texture/blueprint.webp` שלא קיים בבילד — 404 בכל טעינה של /team/alona, ומוטיב שאול מבניין נדל"ן. שני מקומות נוספים שמפנים לאותו קובץ (StatCounters, StoryPanel) הם רכיבים מתים. [Portrait.tsx:54](site/src/components/media/Portrait.tsx:54)
- כרטיס הדיוקן ב-hero של /about מכפיל את השם ואת התפקיד שכבר עומדים לידו, ולא מסומן `aria-hidden`. שתי שורות למחיקה. [about/page.tsx:232](site/src/app/about/page.tsx:232)
- קישור «בדקי אותי במאגר משרד הבריאות» נפתח בטאב חדש בלי שום סימון, ומוביל לשורש המרשם בלי מספר הרישיון. הכי מועיל: שורת עזר מתחת לכפתור עם «חפשי: אלונה אקרלינג · מספר רישיון 204526-11». זה דפוס אתר-רחב (כל target=_blank חשוף), אז לתקן כדפוס משותף. [about/page.tsx:430](site/src/app/about/page.tsx:430)
- סקשן 19 ב-/about (התשובה לספק הגיל) הוא היחיד בלי כותרת בחלוקה. `id` על ה-span + `aria-labelledby` על ה-figure, שינוי של שתי שורות. [about/page.tsx:343](site/src/app/about/page.tsx:343)
- שלושת המסמכים המשפטיים לא עקביים: /terms ו-/privacy נפתחים בתוכן עניינים זהה (מוכפל ידנית) וסוגרים בקישורי אחים, /accessibility בלי שניהם. ה-TOC המוכפל צריך לעלות ל-LegalShell כ-prop אופציונלי. [accessibility/page.tsx:53](site/src/app/accessibility/page.tsx:53)
- מחרוזת תאריך אחת (`legalUpdated`) חותמת את שלושת המסמכים המשפטיים — עריכה משפטית באחד תתארך בשקר את השניים האחרים. גם בלי `<time dateTime>`. [LegalShell.tsx:34](site/src/components/legal/LegalShell.tsx:34)
- הצהרת הנגישות מפנה ל«כפתור ״נגישות״» בזמן שהפקד הוא גליף כיסא גלגלים בלי טקסט גלוי. הכי זול: לנסח מחדש ל«בפינה השמאלית התחתונה מופיע כפתור עגול עם סמל הנגישות». [accessibility/page.tsx:22](site/src/app/accessibility/page.tsx:22)
- צ'יפי התוכן-עניינים במסמכים המשפטיים כ-34px, וצ'יפי הסינון ב-/recipes יורדים ל-34-36px מ-md ומעלה (כלומר אייפד אנכי, מכשיר מגע). עוברים AA בנוחות; זו ארגונומיה. `min-h-11` + לגדר את הכיווץ ב-`[@media(pointer:fine)]` במקום ברוחב. [RecipesArchive.tsx:100](site/src/components/RecipesArchive.tsx:100)
- חמישה קישורי CTA משניים בעמוד הבית בגובה 26-30px. עוברים WCAG 2.5.8 דרך פטור הריווח, אבל [page.tsx:647](site/src/app/page.tsx:647) עם `text-sm` יורד ל-21px — היחיד מתחת לרצפת 24px. `inline-flex min-h-11 items-center px-1`.
- ה-CTA הרך בסגירת /testimonials הוא הקישור היחיד בעמוד בלי `min-h-11` — כל שאר הקישורים שם, וגם דפוס `pointer-coarse:-my-2.5 pointer-coarse:py-2.5` שמופיע ארבע פעמים ב-/coaching. [testimonials/page.tsx:256](site/src/app/testimonials/page.tsx:256)
- הקישור «עבדנו יחד? אשמח אם תשתפי» מוביל לטופס ההיכרות שמציע לה שיחת היכרות חינם שכבר עברה. יש שם textarea חופשי, אז היא **יכולה** לכתוב, אבל הכותרת מקבלת אותה כלידה חדשה. יעד ייעודי או לפחות כותרת מודעת-נושא. [testimonials/page.tsx:46](site/src/app/testimonials/page.tsx:46)
- `data-light-hero` מופיע על 6 סקשנים ואף אחד לא קורא אותו — ה-Header קורא רק `[data-dark-hero]`. ההערה ב-[testimonials/page.tsx:76](site/src/app/testimonials/page.tsx:76) מצהירה שהוא קריטי לניווט, וזה לא נכון. או למחוק את הששה + את ענף ה-`light` המת, או לחווט hero כהה אמיתי. חייב הכרעה כי כרגע הקוד משקר למתחזק הבא בשני כיוונים.
- ה-Footer מקודד 1120px פעמיים, PageHero מקודד 1240px, SequenceFilm מקודד 760px — כולם במקום `<Container>`. פער המרזב היחיד האמיתי הוא PageHero (px-6) ו-SequenceFilm (px-7) מול px-4 של Container בטלפון.
- הסטייל-גייד מציג `bg-gold text-navy` = 2.04:1 ככפתור מרונדר, וזה העמוד שמפתח הבא מעתיק ממנו מחלקות CTA. אותו זוג שרד גם ב-CtaBand/CinematicTeaser/FeatureRow — שלושתם קוד מת שאף route לא מגיע אליו, וכדאי פשוט למחוק.
- ה-poll של `onFirstInView` ב-[motion.ts:86](site/src/lib/motion.ts:86) רץ כל 700ms לנצח עבור כל אלמנט שהקוראת לא הגיעה אליו. ההערה עצמה טוענת שהתרחיש שהיא מגנה עליו נסגר בשנייה-שתיים — לספור טיקים ולעצור אחרי כ-10.
- 30 מתוך 30 ערכי `imageAlt` במתכונים זהים בייט-בייט ל-`title`, אז כל אריח מכריז "חומוס ביתי חומוס ביתי". או alt תוכני או `alt=""` (הכותרת סמוכה וגלויה).
- `Breadcrumbs.tsx:21` משתמש ב-`aria-label="breadcrumb"` — תווית ה-landmark האנגלית היחידה באתר `lang="he"` שכל שאר הניווטים בו בעברית.
- קוד מת שכדאי לנקות במסירה: HomeLeadSection, LeadWizard, FloatingField, CtaBand, CinematicTeaser, FeatureRow, StatCounters, StoryPanel, KeyTakeaways, ועוד כ-13 רכיבי מושן ללא שער reduced-motion (כולם ללא ייבוא). HomeLeadSection אפילו נושא קופי בזכר-רבים.
- twitter-image.png הוא כפיל בייט-בייט של opengraph-image.png (30KB מיותר), ואין `opengraph-image.alt.txt`, אז לא נשלח og:image:alt.
- ה-Footer מרנדר שלושה שירותים כשלושה קישורים נפרדים חזותית שכולם מצביעים על אותו `/coaching`.

---

## סדר עבודה מוצע

**מנה 1 — החוסמים (חצי יום עבודה)**
1. תיקון `.btn-chamfer:focus-visible` ב-globals.css. שורה אחת, מחזירה טבעת פוקוס ל-20 כפתורים.
2. `inert={!open}` על מגירת הניווט. שורה אחת.
3. הזזת באנר העוגיות מעל הכרום התחתון + הזזת כפתור הנגישות. שתי שורות className, ובאותה הזדמנות להגדיר את סולם ה-z ב-globals.css.
4. תיקון route.ts: 502 רק כשה-webhook מוגדר ונכשל, ומסלול שגיאה עם יציאת וואטסאפ ב-ContactLeadForm.
5. **משימת שיגור נפרדת (לא קוד):** להגדיר LEAD_WEBHOOK_URL בוורסל, לשלוח ליד אמיתי מקצה לקצה, לרשום ב-RECEIPTS, ולהוסיף את השורה החסרה ל-MARKETING.md §5. להקשיח את launch-verify.

**מנה 2 — טפסים ונגישות (יום)**
6. `role="alert"` על שלוש פסקאות השגיאה + הרמת `focusFirstInvalid` ל-`src/lib/form-focus.ts` וצריכה משני הטפסים + פוקוס למסך התודה.
7. `--color-bad` ל-#A34E46 (או #B3243C) + `--color-bad-soft` לקופסת ההתראה.
8. `text-base font-normal text-ink` על `fieldClass` בשני הטפסים (או כלל `@layer base` יחיד ב-globals.css לכל input/select/textarea).
9. skip-link + `id="main" tabIndex={-1}`.
10. סקריפט bootstrap להגדרות הנגישות ב-`<body>`, ו-`useMotionAllowed()` ב-EvidenceCursor + כלל `html.a11y-stop-motion .evidence-cursor { display: none }`.
11. קישור מדיניות הפרטיות בשורת ההסכמה של /contact (אחרי עדכון COPY.md:355) + `aria-label` על ה-form + פוקוס לשדה האימייל שנפתח.

**מנה 3 — תוכן ואמת (יום)**
12. קול נקבה-יחיד ב-/team/alona + תיקון תווית ה-breadcrumb + רישום ב-COPY.md.
13. תיקון ה-regex של ה-JSON-LD במתכונים + מסנן הרכיבים + פליטת `nutrition` אמיתי, עם מבחנים נעולים על protein-pancakes ועל מתכון רב-קבוצות.
14. הסרת `/testimonials` מ-sitemap, וחיווט שער העדויות (schema.json + branch ב-page.tsx + מתאם ל-TestimonialCard + פיצול הקופי מ-COPY.md §34). זה מוציא את הלקוחה מתלות במפתח.
15. ניקוי המשפטי: להסיר את שרידי החוברת/Smoove/מחירים מ-/privacy ומ-/terms, ולהעביר את הרחבת הדיסקליימר («רפואי או תזונתי אישי») למעבר עו"ד הפתוח.
16. שער הסכמה על שדות המכשיר ב-attribution.ts + ניסוח מחדש של שורת ההסכמה.
17. הכרעה על /styleguide: או למחוק, או להחליף את בלוק הדמו של עורך הדין ולתקן 6 תמונות 404.

**מנה 4 — מדיה וביצועים (חצי יום, החזר גבוה)**
18. בלוק `images: { formats: ["image/avif","image/webp"], qualities: [60,75] }` ב-next.config. שורה אחת, כל האתר.
19. החלפת שלושת ה-`<img>` הגולמיים ב-/coaching ב-next/image (ProofStill כבר כתוב), ובאותו מעבר גם /about — כדפוס אחיד, לא באחד בלבד.
20. סקריפט קידוד ל-14 פריימי הסרט → avif/webp ב-900w ו-1400w + `<picture>`, פלוס דילוג על פריים ש-`img.complete` false.
21. שמירת גובה ה-420vh לפני שהתאום הסטטי נשלף (עם הזהירות לגבי no-JS).
22. הסרת `<Reveal>` מבאנד ה-LCP של /coaching.

**מנה 5 — טוקנים ומערכת (יום, מסירה)**
23. הרחבת lint-motion (utility של Tailwind, סריקת .ts ו-.css, צמצום ה-ALLOWLIST לבלוק @theme) — ואז תיקון 14 הליטרלים שהיא תמצא.
24. סחיפת הטרקינג: `tracking-eyebrow` בכל הקיקרים + grep בשער.
25. איחוד סקאלת הכותרות על `--text-display` / `--text-section` (+ טוקן `--text-subsection` אחד לשתי כותרות-כרטיס), ורדיוסי הכרטיסים על `rounded-card`.
26. טוקני `--color-on-navy` / `--color-on-navy-muted` והחלפת 28 מופעי slate.
27. יישור שלושת כרטיסי החבילות (chip לכל השלושה + קו על כולם).
28. `manifest.background_color` ל-`brand.extra.bg`, `export const viewport` עם themeColor, וחידוש favicon.ico מ-icon.svg.
29. ניקוי קוד מת: three.js + חמש התלויות, שלושת היתומים, ~9 רכיבים לא-מיובאים, twitter-image הכפול.

**מנה 6 — ליטוש**
30. כל סעיפי "ליטוש" למעלה, בסדר שנוח. הכי משתלמים בהם: הכרעת `data-light-hero` (כי הקוד משקר), אחידות ה-alt במתכונים (30 קבצים, אבל טריוויאלי), ומילוי `prepTime` ב-24 מתכונים (זה שיפור תוכן שנראה מיד בארכיון).
---

# ✅ מה תוקן בפועל · 2026-07-25 · ענף `fix/audit-2026-07-25`

> כל התיקונים למטה בוצעו, עברו `tsc --noEmit`, 16 שערי lint, ובילד פרודקשן נקי לגמרי (אפס אזהרות).
> החוסמים אומתו חיים בדפדפן, לא רק בקוד.

## חוסמים (כולם סגורים)

| # | מה | איפה | אימות |
|---|---|---|---|
| 1 | **טבעת פוקוס חזרה ל-20 כפתורי CTA** — `clip-path` חתך כל outline/ring. נוסף `.btn-chamfer:focus-visible { clip-path: none; outline: 2px solid var(--color-navy) }` | [globals.css](site/src/app/globals.css) | נמדד חי: הכפתור הממוקד מחזיר `clip-path: none` + `2px solid rgb(23,56,44)`, ונראה בצילום |
| 2 | **הליד לא נעלם יותר בשקט** — `/api/lead` מחזיר 502 כשה-webhook מוגדר ונכשל (במקום `ok:true`), והטופס מציג מסלול שגיאה עם יציאה לוואטסאפ | [api/lead/route.ts](site/src/app/api/lead/route.ts) · [ContactLeadForm.tsx](site/src/components/ContactLeadForm.tsx) | ענף «אין webhook» נשאר 200 בכוונה (תנוחת טרום-השקה) |
| 3 | **באנר העוגיות משוחרר מהשורה הדביקה** — הועלה מעל `--chrome-bottom`, ‎+‎ `pointer-events-none` על העוטף | [CookieConsent.tsx](site/src/components/CookieConsent.tsx) | `elementFromPoint` מאשר ששני חצאי השורה («וואטסאפ» / «בואי נדבר») נלחצים, וכפתורי הבאנר עדיין עובדים |
| 4 | **`public/_examples/` נמחק** — שלושה עמודי דמו ממותגים של הלקוח הקודם שהיו מוגשים ציבורית | `site/public/` | גם 6 נכסי-סקאפולד של Next שלא היו בשימוש |

## נגישות

- **skip-link** ‎+‎ `id="main" tabIndex={-1}` — היה חסר לגמרי, ו-Lighthouse עבר על עצם קיום ה-landmark. משתמש-מקלדת עבר 9 עצירות לפני התוכן בכל עמוד. `focus:start-3` (לוגי, RTL) ו-z מעל באנר העוגיות.
- **מגירת מובייל `inert={!open}`** — 7 קישורים בלתי-נראים ישבו בסדר הטאב. אומת: `.focus()` על הראשון הוא no-op והפוקוס נופל ל-body.
- **שגיאות טופס מוכרזות ומקבלות פוקוס** — `role="alert"` על כל פסקאות השגיאה בשני הטפסים, ‎+‎ `lib/form-focus.ts` משותף. **נקודה עדינה שנתפסה באימות:** קריאה מתוך ה-handler (אפילו ב-rAF) מקדימה את ה-commit של React ולא מוצאת כלום — לכן זה `useEffect` על `errors`. אומת חי: הפוקוס עובר ל-`INPUT[name=name]`.
- **`--color-bad` תוקן** — `#d6455d` נכשל AA בכל משטח (3.84:1 על sand). עכשיו `#b3243c` (5.7:1 על sand) ‎+‎ `--color-bad-soft` ייעודי לקופסת ההתראה.
- **גדלי שדות** — כלל `@layer base` יחיד: `font-size: 1rem` על input/select/textarea (מונע auto-zoom של iOS).
- **הגדרות נגישות לפני הצביעה** — `lib/a11y-boot.ts` ‎+‎ סקריפט סינכרוני ב-`<body>`. מבקרת ששמרה טקסט 145% ראתה 17px לאורך כל חלון ה-FCP→hydration ואז קפיצה.
- **«עצירת אנימציות» עוצרת גם את טבעת הסמן** — `EvidenceCursor` עבר ל-`useMotionAllowed()` (כולל `html.a11y-stop-motion`), לא רק media query.
- **כפתור הנגישות מעל השורה הדביקה** — נמדד: 72–123px מהתחתית במקום 17–68px שחפפו.
- **`aria-current="page"`** ‎+‎ קו-תחתון ורוד בניווט (לא צבע בלבד).

## אמת-תוכן

- **JSON-LD של מתכונים** — הטרמינטור `(?=\n##\s|$)` לא עצר על `###`, אז בלוק «ערכים תזונתיים» נבלע ל-`recipeInstructions`. תוקן ל-`#{2,}`, נוסף סינון תו-רשימה לרכיבים, ונפלט `NutritionInformation` אמיתי. **נבדק על כל 34 המתכונים:** protein-pancakes ירד מ-9 שלבים מזויפים ל-5 אמיתיים, אפס זיהום.
- **`/team/alona`** — «רוצים להתייעץ? דברו איתנו» (זכר-רבים, קול משרד) ← «רוצה לשמוע עוד? בואי נדבר». גם תווית ה-breadcrumb «אודות» ← «עליי».
- **שער העדויות חוּוט** — `content/cms/settings.schema.json` מלא, העמוד מסתעף על עדויות מאושרות, ו-`robots`+`sitemap` מתהפכים יחד מאותו תנאי. אלונה יכולה לפרסם עדות בלי מפתח. שער YMYL: בלי `consentBy`+`consentAt` העדות לא עולה.
- **`/testimonials` הוסר מה-sitemap** בזמן שהוא noindex (סתירה שהייתה מייצרת שגיאת כיסוי ב-Search Console).
- **גדר הסכמה על נתוני מכשיר** — `attribution.ts` שלח referrer/user-agent/language/screen/viewport בלי קשר לבחירת העוגיות. עכשיו מאחורי `hasAnalyticsConsent()`. גם משפט ההסכמה תוקן («ולא יועברו לצד שלישי» סתר את /privacy §5).
- **`/styleguide` נמחק** — עמוד דמו פנימי בתוך מסירה ללקוחה, עם BioCard של עורך-דין ו-6 תמונות 404 שמצביעות על `boaz.webp`.

## מדיה וביצועים

- `next.config.ts`: `formats: ["image/avif","image/webp"]` ‎+‎ `qualities: [60,75]` — ברירת המחדל הייתה WebP בלבד לכל האתר.
- שלושה `<img>` גולמיים ב-`/coaching` (866KB) ושניים ב-`/about` הוחלפו ב-`next/image` עם `sizes` — דפוס אחיד בשני המסלולים, לא בעמוד אחד.
- **`<Reveal>` הוסר מבאנד ה-LCP של `/coaching`** — הוא איפס ל-`opacity-0` בדיוק את התמונה שסומנה `eager`.
- **SequenceFilm**: שמירת גובה ה-420vh כבר ב-hydration (לא ב-`window.load`) — העמוד היה קופץ ~2,700px מתחת לקוראת שכבר גללה. הכפול הסטטי הפך ל-poster דביק בתוך המסלול. ‎+‎ decode-guard שמחזיק את הפריים האחרון שפוענח במקום להבהב `bg-sand`.
- **`MScrollScene`**: ההורה של `next/image fill` היה `position: static` — אזהרת Next אמיתית, והתמונה נפתרה מול השכבה החיצונית (ובלי מושן גם בלי transform שיציל).
- Header: rAF guard ‎+‎ הוצאת ה-`querySelector` מתוך ה-scroll handler.

## מערכת ועיצוב

- **`lint-motion` באמת אוכף עכשיו** — הוא סרק `.tsx` בלבד והתאים רק תחביר-אובייקט, אז כל צורת ה-utility של Tailwind הייתה בלתי-נראית והשער דיווח «נקי». הורחב ל-`.ts`/`.css` ‎+‎ בדיקות `duration-*`/`ease-*`. **מצא 17 הפרות אמיתיות** שתוקנו. נוסף `--dur-ui` (הדרג האמצעי שחסר, calc-derived כדי שה-motion-personality ימשיך להגיע אליו).
- **טרקינג** — 9 ערכים שונים על אותו אלמנט ← `tracking-eyebrow` בכל מקום.
- **`--color-on-navy` / `--color-on-navy-muted`** — 25 מופעי `text-slate-*` (רמפה כחלחלה) על פלטה שעברה de-blue ב-07-19.
- **סולם z ו-`--chrome-bottom`** מוגדרים פעם אחת ב-globals ונצרכים בכל הצפים.
- שלושת כרטיסי החבילות מיושרים (קו ו-chip שמורים בכל השלושה).
- `manifest` קורא מ-`brand.config` (הצבע היה שריד מפלטה שפרשה) ‎+‎ `export const viewport` עם `themeColor` — לא נפלט `<meta name="theme-color">` בכלל.
- **favicon ו-apple-icon צוירו מחדש** מנתיב ה-bezier המדויק של `icon.svg` (היו עדיין בנייבי הישן).
- צ'יפ הקטגוריה במתכונים: `bg-navy/80` (היה 3.59:1 על מנות בהירות).
- `alt=""` על תמונות אריחי המתכונים — כל 30 היו `imageAlt` זהה בייט-בייט לכותרת שמעליהן.

## אזהרות בילד

- `middleware.ts` ← `proxy.ts` (‎`export function proxy`‎). `lint-admin` עודכן לקרוא את שניהם.
- **NFT over-tracing נסגר** — `content.ts` השתמש ב-`path.join(process.cwd(), "..", "content")`; ה-`..` יצא משורש הפרויקט וגרר את כל הריפו לבאנדל. הענף היה גם קוד מת (התיקייה לא קיימת).
- 4 אזהרות CSS שנוצרו מהמחרוזות של ה-linter עצמו (Tailwind ייצר מחלקות מתוך טקסט ההסבר) — נוטרלו.
- **`three.js` ‎+‎ 5 תלויות הוסרו** יחד עם 3 רכיבים יתומים שאף route לא הגיע אליהם.

---

## ⚠️ מה נשאר לך (לא ניתן לתיקון בקוד)

1. **להגדיר `LEAD_WEBHOOK_URL` ‎+‎ `LEAD_WEBHOOK_SECRET` בוורסל**, לשלוח ליד אמיתי מקצה-לקצה ולרשום ב-RECEIPTS. הקוד מוכן ואומר את האמת, אבל היעד עדיין לא קיים. **זה עדיין החוסם מספר 1 להשקה.**
2. **דיוקן אמיתי של אלונה** (חוסם-נכס מתועד, YMYL אוסר לייצר פנים).
3. **עדויות אמיתיות** — הצנרת מוכנה, צריך תוכן ‎+‎ אישור פרסום.
4. **רכז נגישות** ב-`site.ts` — התיבה `alona@alonaeck.com` עוד לא קיימת.
5. **מעבר עו״ד** על התקנון (הרחבת הדיסקליימר ל«רפואי או תזונתי אישי») ‎+‎ ניקוי שרידי החוברת/Smoove מ-/privacy ו-/terms.
6. **`prepTime` ב-24 מתכונים** מכיל «לא צוין» — שיפור תוכן שנראה מיד בארכיון.
