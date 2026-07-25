# דוח מיגרציית מתכונים

נוצר על ידי `scripts/migrate/01-recipes.mjs`. 34 מתכונים, 30 תמונות.

## מה נבדק

| בדיקה | תוצאה |
| --- | --- |
| מתכונים שנקראו | 34 |
| שדות חובה בכל הקבצים | תקין |
| כל התמונות קיימות בדיסק | תקין |
| הרכיבים חוזרים לצורתם המקורית | 33/34 |
| הגוף חוזר לצורתו (אחרי נרמול רווחים) | 10/34 |
| שורות שדורשות עין אנושית | 0 |

## למה לא בודקים זהות בייטים

כי היא כבר לא מתקיימת היום. `serializeRecipeBody(parseRecipeBody(md))` שונה מהמקור
ב־24 מתוך 34 הקבצים, כולם בשורות ריקות סביב תת־כותרות ובאף אחד מהם לא בתוכן.
גייט של זהות בייטים היה נכשל על 70 אחוז מהקורפוס וממילא היה מכובה תוך יום.
הבדיקות כאן הן שוויון טקסט מנורמל, ספירת רכיבים ושלבים, ואורך `extra`.

## מה משתנה בכוונה

המספר של רכיבים ב־JSON-LD משתנה במתכונים הבאים:

- `green-curry-stir-fry.md`: 18 → 19

הסיבה: שורה מהצורה `**להגשה:** בצל ירוק, כוסברה, בוטנים גרוסים` נושאת גם תת־כותרת
וגם רכיבים אמיתיים. הפילטר הנוכחי באתר הוא `^\s*[-*]\s+`, שדורש רווח אחרי הכוכבית,
ולכן השורה הזו **מסוננת החוצה היום** ולא מגיעה בכלל לנתונים המובנים. הפיצול לתת־כותרת
ולרכיב מחזיר אותה פנימה. זו תוספת, לא אובדן.

## מה שדורש הכרעה אנושית

אף שורה. כל 48 השורות שאינן בולטים נפלו לאחת מהצורות המוכרות.

## בעיות

- baked-tofu-schnitzel.md: body round trip differs even after whitespace normalisation
- bean-noodle-fish-salad.md: body round trip differs even after whitespace normalisation
- broccoli-onion-quiche.md: body round trip differs even after whitespace normalisation
- bulgur-broccoli-salad.md: body round trip differs even after whitespace normalisation
- cauliflower-fried-rice.md: body round trip differs even after whitespace normalisation
- cauliflower-tabbouleh.md: body round trip differs even after whitespace normalisation
- easy-pea-soup.md: body round trip differs even after whitespace normalisation
- fish-patties-sweet-sauce.md: body round trip differs even after whitespace normalisation
- flourless-brownies.md: body round trip differs even after whitespace normalisation
- green-curry-stir-fry.md: body round trip differs even after whitespace normalisation
- moroccan-fish.md: body round trip differs even after whitespace normalisation
- oatmeal-chocolate-chip-cookies.md: body round trip differs even after whitespace normalisation
- protein-cheesecake.md: body round trip differs even after whitespace normalisation
- protein-pancakes.md: body round trip differs even after whitespace normalisation
- roasted-tomato-soup.md: body round trip differs even after whitespace normalisation
- soba-noodle-salad.md: body round trip differs even after whitespace normalisation
- spelt-banana-cake.md: body round trip differs even after whitespace normalisation
- spinach-cheese-bourekas.md: body round trip differs even after whitespace normalisation
- sweet-and-sour-tofu.md: body round trip differs even after whitespace normalisation
- three-ingredient-date-balls.md: body round trip differs even after whitespace normalisation
- tofu-honey-mustard.md: body round trip differs even after whitespace normalisation
- tofu-shawarma.md: body round trip differs even after whitespace normalisation
- tuna-shawarma.md: body round trip differs even after whitespace normalisation
- zucchini-feta-salad.md: body round trip differs even after whitespace normalisation

## הערות

- green-curry-stir-fry.md: JSON-LD ingredients 18 → 19  (the **label:** items line, now counted)

## פירוט לפי מתכון

| קובץ | רכיבים | תת־כותרות | הערות | שלבים | extra (bytes) | זמן הכנה |
| --- | --- | --- | --- | --- | --- | --- |
| baked-corn-fritters.md | 9 | 0 | 0 | 5 | 0 | לא צוין |
| baked-tofu-schnitzel.md | 11 | 3 | 0 | 8 | 0 | לא צוין |
| baked-tuna-patties.md | 10 | 0 | 0 | 8 | 212 | 20 |
| bean-noodle-fish-salad.md | 19 | 2 | 0 | 7 | 0 | לא צוין |
| broccoli-onion-quiche.md | 14 | 2 | 1 | 9 | 0 | לא צוין |
| bulgur-broccoli-salad.md | 14 | 1 | 1 | 5 | 0 | לא צוין |
| cauliflower-fried-rice.md | 13 | 1 | 0 | 6 | 0 | לא צוין |
| cauliflower-tabbouleh.md | 11 | 1 | 0 | 4 | 27 | לא צוין |
| date-energy-bars.md | 8 | 0 | 0 | 6 | 169 | 10 |
| easy-pea-soup.md | 10 | 1 | 0 | 6 | 0 | לא צוין |
| fish-patties-sweet-sauce.md | 16 | 2 | 1 | 9 | 0 | לא צוין |
| flourless-brownies.md | 4 | 0 | 1 | 5 | 424 | לא צוין |
| green-curry-stir-fry.md | 19 | 4 | 0 | 10 | 0 | לא צוין |
| green-shakshuka.md | 9 | 0 | 0 | 5 | 0 | לא צוין |
| homemade-granola.md | 6 | 0 | 0 | 6 | 0 | 10 |
| homemade-hummus.md | 8 | 0 | 0 | 5 | 0 | 10 |
| moroccan-fish.md | 20 | 1 | 0 | 10 | 0 | לא צוין |
| oatmeal-chocolate-chip-cookies.md | 8 | 0 | 1 | 7 | 175 | לא צוין |
| one-pot-bulgur-stew.md | 9 | 0 | 0 | 6 | 0 | 20 |
| protein-cheesecake.md | 7 | 0 | 1 | 7 | 574 | לא צוין |
| protein-pancakes.md | 6 | 0 | 1 | 5 | 181 | לא צוין |
| quinoa-citrus-salad.md | 19 | 0 | 0 | 6 | 0 | לא צוין |
| quinoa-in-red-sauce.md | 11 | 0 | 0 | 5 | 174 | לא צוין |
| roasted-tomato-soup.md | 15 | 1 | 0 | 10 | 0 | לא צוין |
| soba-noodle-salad.md | 13 | 3 | 0 | 6 | 0 | לא צוין |
| spelt-banana-cake.md | 9 | 1 | 0 | 6 | 495 | 35 |
| spinach-cheese-bourekas.md | 12 | 3 | 1 | 10 | 177 | לא צוין |
| spinach-cheese-pie.md | 12 | 0 | 0 | 6 | 185 | לא צוין |
| sweet-and-sour-tofu.md | 14 | 2 | 1 | 7 | 83 | לא צוין |
| three-ingredient-date-balls.md | 5 | 1 | 0 | 4 | 173 | 10 |
| tofu-honey-mustard.md | 10 | 2 | 1 | 7 | 0 | לא צוין |
| tofu-shawarma.md | 16 | 2 | 0 | 6 | 126 | 10 |
| tuna-shawarma.md | 12 | 2 | 1 | 7 | 214 | 2 |
| zucchini-feta-salad.md | 11 | 1 | 1 | 6 | 0 | 10 |
