# דוח מיגרציית מתכונים

נוצר על ידי `scripts/migrate/01-recipes.mjs`. 55 מתכונים, 55 תמונות.

## מה נבדק

| בדיקה | תוצאה |
| --- | --- |
| מתכונים שנקראו | 55 |
| שדות חובה בכל הקבצים | תקין |
| כל התמונות קיימות בדיסק | תקין |
| רשימת הרכיבים מרונדרת זהה | 55/55 |
| מתוכן זהות גם בבייטים | 55/55 (השאר: שורה ריקה שהרנדרר מתעלם ממנה) |
| הגוף עובר את בדיקת התוכן | 55/55 |
| שורות שדורשות עין אנושית | 0 |

## למה לא בודקים זהות בייטים, ולמה גם לא נרמול רווחים

זהות בייטים כבר לא מתקיימת היום, לפני שנגענו בכלום: `serializeRecipeBody(parseRecipeBody(md))`
שונה מהמקור ב־24 מתוך 34 הקבצים. בדקנו כל אחד מהם, וההפרש היחיד הוא שורה ריקה
לפני תת־כותרת מודגשת בתוך רשימת הרכיבים, שהסריאלייזר מוריד. אפס הבדלי תוכן.
גייט של זהות בייטים היה נכשל על 70 אחוז מהקורפוס וממילא היה מכובה תוך יום.

אבל גם ההפך פסול. לנרמל את כל השורות הריקות עד שהבדיקה עוברת היה מסתיר מיזוג
פסקאות אמיתי בפתיח, שבו שורה ריקה היא גבול פסקה ומחיקתה משנה את ה־HTML המרונדר.

לכן הבדיקה כאן צרה יותר וחזקה יותר: **שורות התוכן חייבות להיות זהות בכל מקום**,
**ומבנה השורות הריקות חייב להיות זהה גם הוא, למעט בתוך רשימת הרכיבים** שבה שורה ריקה
בין פריטים אינה נושאת שום משמעות בעת רינדור. הפרש בכל מקום אחר נספר כבעיה.

## מה משתנה בכוונה

אין הפרשים בין מה שהאתר פולט היום לבין מה שייפלט מהמסד.

## מה שדורש הכרעה אנושית

אף שורה. כל 54 השורות שאינן בולטים נפלו לאחת מהצורות המוכרות.

## בעיות

אין.

## הערות

אין.

## פירוט לפי מתכון

| קובץ | רכיבים | תת־כותרות | הערות | שלבים | extra (bytes) | זמן הכנה |
| --- | --- | --- | --- | --- | --- | --- |
| asian-glazed-salmon-bites.md | 10 | 1 | 0 | 7 | 0 | לא צוין |
| autumn-quinoa-pumpkin-salad.md | 15 | 1 | 0 | 4 | 0 | לא צוין |
| baked-bulgur-lentil-mujadara.md | 8 | 0 | 0 | 6 | 0 | לא צוין |
| baked-quinoa-patties.md | 10 | 0 | 0 | 5 | 0 | לא צוין |
| baked-tofu-schnitzel.md | 8 | 4 | 0 | 7 | 0 | לא צוין |
| baked-tofu-vegetable-patties.md | 11 | 0 | 0 | 7 | 0 | לא צוין |
| baked-tuna-patties.md | 9 | 0 | 0 | 4 | 0 | לא צוין |
| baked-vegetable-latkes.md | 12 | 0 | 0 | 10 | 0 | לא צוין |
| banana-oat-cookies.md | 10 | 0 | 0 | 6 | 0 | לא צוין |
| bean-noodle-tofu-stir-fry.md | 18 | 1 | 0 | 6 | 0 | לא צוין |
| braised-cabbage-tomato-sauce.md | 11 | 0 | 0 | 6 | 0 | לא צוין |
| bulgur-jar-salad.md | 16 | 2 | 0 | 4 | 0 | 5 |
| cabbage-carrot-rice.md | 8 | 0 | 0 | 6 | 0 | לא צוין |
| caesar-salad-crispy-chickpeas.md | 15 | 2 | 0 | 6 | 0 | לא צוין |
| cauliflower-asian-tahini.md | 13 | 2 | 0 | 6 | 0 | לא צוין |
| cinnamon-maple-hazelnut-muffins.md | 12 | 1 | 0 | 6 | 0 | לא צוין |
| colorful-chia-pudding.md | 10 | 1 | 0 | 3 | 0 | 5 |
| corn-ribs.md | 11 | 1 | 0 | 4 | 0 | לא צוין |
| crispy-rice-tuna-salad.md | 18 | 3 | 0 | 7 | 0 | לא צוין |
| crispy-tofu-peanut-salad.md | 19 | 3 | 0 | 5 | 0 | לא צוין |
| crunchy-rainbow-quinoa-salad.md | 17 | 1 | 0 | 5 | 0 | לא צוין |
| date-brownies.md | 11 | 0 | 0 | 8 | 0 | לא צוין |
| eggplant-carpaccio.md | 11 | 0 | 0 | 6 | 0 | לא צוין |
| flourless-brownies.md | 6 | 0 | 0 | 7 | 0 | לא צוין |
| green-goddess-salad.md | 14 | 2 | 0 | 4 | 0 | 10 |
| hearty-lentil-soup.md | 16 | 0 | 0 | 6 | 0 | לא צוין |
| homemade-granola.md | 5 | 0 | 0 | 5 | 0 | 10 |
| kale-crispy-chickpea-salad.md | 15 | 2 | 0 | 4 | 0 | לא צוין |
| lemon-garlic-greens.md | 9 | 0 | 0 | 5 | 0 | לא צוין |
| light-cheese-lasagna.md | 13 | 3 | 0 | 6 | 0 | לא צוין |
| maple-mustard-tofu-skewers.md | 10 | 1 | 0 | 8 | 0 | לא צוין |
| maple-pecan-spelt-cake.md | 11 | 1 | 0 | 7 | 0 | לא צוין |
| mini-broccoli-cheese-quiches.md | 8 | 1 | 0 | 7 | 0 | לא צוין |
| oven-fried-rice-tofu.md | 13 | 1 | 0 | 6 | 0 | לא צוין |
| oven-noodle-stir-fry.md | 14 | 1 | 0 | 7 | 0 | לא צוין |
| peanut-butter-date-bark.md | 5 | 0 | 0 | 6 | 0 | לא צוין |
| protein-pancakes.md | 6 | 0 | 0 | 4 | 0 | 5 |
| quinoa-lentil-labneh-salad.md | 16 | 2 | 0 | 5 | 0 | לא צוין |
| quinoa-lentil-vegetable-bake.md | 13 | 0 | 0 | 8 | 0 | לא צוין |
| rice-paper-malawach.md | 6 | 2 | 0 | 5 | 0 | לא צוין |
| rice-paper-omelette.md | 5 | 0 | 0 | 6 | 0 | לא צוין |
| rice-paper-pizza.md | 10 | 3 | 0 | 9 | 0 | לא צוין |
| roasted-vegetable-antipasti.md | 12 | 0 | 0 | 9 | 0 | לא צוין |
| soba-noodle-salad.md | 14 | 1 | 0 | 6 | 0 | לא צוין |
| spelt-carrot-cake.md | 10 | 0 | 0 | 7 | 0 | לא צוין |
| sweet-and-sour-tofu.md | 16 | 1 | 0 | 8 | 0 | לא צוין |
| sweet-potato-pumpkin-soup.md | 10 | 0 | 0 | 6 | 0 | לא צוין |
| thai-pomelo-salad.md | 15 | 1 | 0 | 4 | 61 | לא צוין |
| three-ingredient-date-balls.md | 6 | 1 | 0 | 5 | 114 | 5 |
| tofu-satay-skewers.md | 13 | 2 | 0 | 6 | 0 | לא צוין |
| tofu-shawarma.md | 12 | 2 | 0 | 5 | 0 | לא צוין |
| tuna-arayes.md | 8 | 0 | 0 | 7 | 0 | לא צוין |
| tuna-bolognese.md | 12 | 0 | 0 | 6 | 0 | לא צוין |
| tuna-melt-sandwich.md | 10 | 2 | 0 | 5 | 0 | לא צוין |
| upside-down-pear-cake.md | 12 | 2 | 0 | 8 | 0 | לא צוין |
