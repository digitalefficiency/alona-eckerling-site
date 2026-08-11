# דוח מדיה

נוצר על ידי `scripts/migrate/02-media.mjs`. 64 קבצים על הדיסק.

## החלוקה

| סוג | כמה | מה זה אומר |
| --- | --- | --- |
| נכסי קוד | 26 | מופנים ממחרוזת בתוך `src/**`. נעולים. אלונה לא רואה כפתור מחיקה או החלפה |
| שלה | 30 | מופנים רק מתוכן. ניתנים להחלפה ולמחיקה כשאין הפניות |
| כפולים | 0 | מופנים משניהם. **הסכנה האמיתית**, ראו למטה |
| יתומים | 8 | על הדיסק, אף אחד לא מפנה אליהם. לא נכנסים למסד |

## הכפולים, והסיבה שהם נעולים

אין.

## יתומים

קבצים על הדיסק שאף אחד לא מפנה אליהם. הם נשארו מסבבי עיצוב וביצועים קודמים,
והם קיימים בהיסטוריית ה־git, כך שמחיקה שלהם הפיכה. הם לא נכנסים למסד: שורה
לקובץ שאף אחד לא משתמש בו היא רעש במסך שחייב להישאר אמין.

ההחלטה אם למחוק אותם היא של רום, לא של המיגרציה.

- `/media/generated/01-hero-kitchen.jpg` (93KB)
- `/media/generated/01b-bridge-s01.jpg` (139KB)
- `/media/generated/01b-bridge-s02.jpg` (174KB)
- `/media/generated/01b-bridge-s03.jpg` (109KB)
- `/media/generated/07-success-evening.jpg` (59KB)
- `/media/generated/11-method-science.jpg` (79KB)
- `/media/generated/11-method-two-cups.jpg` (171KB)
- `/media/generated/11-method-week-bowls.jpg` (195KB)

## בדיקת רישוי

30 מתוך 30 צילומי הלקוחה תואמים ב־sha256 את השורה שלהם ב־`assets-manifest.json`, וכולם מסומנים `client-confirmed`. תמונה שהבייטים שלה לא תואמים היא תמונה שאיש לא אישר, ובאתר שכל סיפור האמון שלו הוא שכלום לא מומצא זו לא הערת שוליים.


## הפניות שבורות

אין. כל מחרוזת `/media/` בקוד שנטען מעמוד (155 קבצים) ובתוכן מצביעה על קובץ קיים.

## מידות שלא נקראו

אין. לכל התמונות יש רוחב וגובה.

## תוכנית ההעלאה לשלב 5

| יעד | כמה |
| --- | --- |
| עולים ל־Storage | 30 |
| נשארים בריפו | 26 |
| חסומים עד חילוץ הסקשנים | 0 |

## הגייט

```bash
node scripts/migrate/02-media.mjs --check
```

נכשל אם מחרוזת `/media/` כלשהי ב־`src/**` לא מצביעה על קובץ קיים, או אם צילום לקוחה
לא תואם את המניפסט. זו הבדיקה שבאמת תופסת מחיקה מסוכנת. מונה הפניות תופס אותה רק אם
מישהו קורא את המספר.

## פירוט מלא

| קובץ | סוג | מידות | KB | הפניות |
| --- | --- | --- | --- | --- |
| `/media/client/recipes/baked-tofu-schnitzel.jpg` | cms | 750×1000 | 164 | 1 |
| `/media/client/recipes/baked-tuna-patties.jpg` | cms | 1536×1707 | 150 | 1 |
| `/media/client/recipes/bean-noodle-fish-salad.jpg` | cms | 750×1000 | 229 | 1 |
| `/media/client/recipes/broccoli-onion-quiche.jpg` | cms | 792×1000 | 146 | 1 |
| `/media/client/recipes/bulgur-broccoli-salad.jpg` | cms | 562×1000 | 156 | 1 |
| `/media/client/recipes/cauliflower-fried-rice.jpg` | cms | 1536×1702 | 283 | 1 |
| `/media/client/recipes/cauliflower-tabbouleh.jpg` | cms | 750×1000 | 222 | 1 |
| `/media/client/recipes/date-energy-bars.jpg` | cms | 1000×857 | 180 | 1 |
| `/media/client/recipes/fish-patties-sweet-sauce.jpg` | cms | 1536×2048 | 422 | 1 |
| `/media/client/recipes/flourless-brownies.jpg` | cms | 562×1000 | 104 | 1 |
| `/media/client/recipes/green-curry-stir-fry.jpg` | cms | 856×1000 | 211 | 1 |
| `/media/client/recipes/green-shakshuka.jpg` | cms | 1536×2048 | 483 | 1 |
| `/media/client/recipes/homemade-granola.jpg` | cms | 1330×1922 | 176 | 1 |
| `/media/client/recipes/homemade-hummus.jpg` | cms | 1477×1724 | 278 | 1 |
| `/media/client/recipes/moroccan-fish.jpg` | cms | 1330×2110 | 173 | 1 |
| `/media/client/recipes/oatmeal-chocolate-chip-cookies.jpg` | cms | 1536×2048 | 389 | 1 |
| `/media/client/recipes/one-pot-bulgur-stew.jpg` | cms | 750×1000 | 189 | 1 |
| `/media/client/recipes/protein-cheesecake.jpg` | cms | 885×1000 | 208 | 1 |
| `/media/client/recipes/quinoa-citrus-salad.jpg` | cms | 562×1000 | 149 | 1 |
| `/media/client/recipes/quinoa-in-red-sauce.jpg` | cms | 750×1000 | 234 | 1 |
| `/media/client/recipes/roasted-tomato-soup.jpg` | cms | 1324×1953 | 195 | 1 |
| `/media/client/recipes/soba-noodle-salad.jpg` | cms | 1406×1839 | 194 | 1 |
| `/media/client/recipes/spelt-banana-cake.jpg` | cms | 1536×2048 | 245 | 1 |
| `/media/client/recipes/spinach-cheese-bourekas.jpg` | cms | 1525×1857 | 363 | 1 |
| `/media/client/recipes/spinach-cheese-pie.jpg` | cms | 926×1000 | 200 | 1 |
| `/media/client/recipes/sweet-and-sour-tofu.jpg` | cms | 644×1000 | 141 | 1 |
| `/media/client/recipes/three-ingredient-date-balls.jpg` | cms | 750×1000 | 130 | 1 |
| `/media/client/recipes/tofu-shawarma.jpg` | cms | 784×1000 | 156 | 1 |
| `/media/client/recipes/tuna-shawarma.jpg` | cms | 292×390 | 45 | 1 |
| `/media/client/recipes/zucchini-feta-salad.jpg` | cms | 1330×1914 | 222 | 1 |
| `/media/generated/01-hero-film-poster.jpg` | code | 2000×1116 | 201 | 1 |
| `/media/generated/01-hero-film.mp4` | code | — | 480 | 1 |
| `/media/generated/01-hero-film.webm` | code | — | 397 | 1 |
| `/media/generated/02-problem-s01.jpg` | code | 1400×781 | 174 | 1 |
| `/media/generated/02-problem-s02.jpg` | code | 1400×781 | 190 | 1 |
| `/media/generated/02-problem-s03.jpg` | code | 1400×781 | 64 | 1 |
| `/media/generated/02-problem-s04.jpg` | code | 1400×781 | 67 | 1 |
| `/media/generated/02-problem-s05.jpg` | code | 1400×781 | 66 | 1 |
| `/media/generated/02-problem-s06.jpg` | code | 1400×781 | 69 | 1 |
| `/media/generated/02-problem-s07.jpg` | code | 1400×781 | 68 | 1 |
| `/media/generated/02-problem-s08.jpg` | code | 1400×781 | 70 | 1 |
| `/media/generated/02-problem-s09.jpg` | code | 1400×781 | 71 | 1 |
| `/media/generated/02-problem-s10.jpg` | code | 1400×781 | 70 | 1 |
| `/media/generated/02-problem-s11.jpg` | code | 1400×781 | 72 | 1 |
| `/media/generated/02-problem-s12.jpg` | code | 1400×781 | 73 | 1 |
| `/media/generated/02-problem-s13.jpg` | code | 1400×781 | 192 | 1 |
| `/media/generated/02-problem-s14.jpg` | code | 1400×781 | 71 | 1 |
| `/media/generated/03-guide-desk.jpg` | code | 2000×1116 | 209 | 1 |
| `/media/generated/04-plan-week.jpg` | code | 900×1117 | 79 | 1 |
| `/media/generated/04-rung-01-first-call.jpg` | code | 1600×1073 | 94 | 1 |
| `/media/generated/04-rung-02-plan-page.jpg` | code | 1600×1073 | 131 | 1 |
| `/media/generated/04-rung-03-message-away.jpg` | code | 1600×1073 | 86 | 1 |
| `/media/generated/06-fork-noisy.jpg` | code | 1600×1073 | 79 | 1 |
| `/media/generated/06-fork-quiet.jpg` | code | 1600×1073 | 76 | 1 |
| `/media/generated/07-success-evening-wide.jpg` | code | 2000×1116 | 129 | 1 |
| `/media/generated/09-coaching-table.jpg` | code | 896×1200 | 67 | 2 |
