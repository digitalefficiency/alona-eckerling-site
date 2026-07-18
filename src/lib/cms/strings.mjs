// ============================================================================
// strings.mjs — the ONE i18n table of the CMS desk (zero-dep, ZERO node imports).
//
// This module is reachable from CLIENT components (via the desk-strings.ts T()
// bridge) AND from the server-side validator (validate.mjs → formatError). So it
// must stay pure data + pure functions: a single `import "node:fs"` here would
// break the Next client bundle. The node-only client-language SNIFF lives in a
// SEPARATE module (desk-locale.mjs) precisely so this file never sees node:*.
//
// Two tables, both keyed { he, en }:
//   • STRINGS — the desk UI copy (buttons, labels, hints) + the auth/email/confirm
//     surface. A value is either a plain string or a (params) => string builder.
//   • ERRORS  — the CLIENT-CONTENT validator messages, keyed by a stable CODE.
//     validate.mjs pushes { code, params } and RENDERS msg through formatError, so
//     the .msg contract (read by lint-content, content.yml, the admin, the harness)
//     never regresses while the en render is Hebrew-free.
//
// IRON RULES (gate-enforced):
//   • Object.keys(STRINGS.he) === keys(STRINGS.en); same for ERRORS (lint-admin #10,
//     lint-content ERRORS-parity).
//   • Every non-he VALUE is Hebrew-glyph-free — a Hebrew string mis-pasted into the
//     en table is the cardinal lie (an English screen showing Hebrew) and fails the
//     per-value gate that keys-only parity is blind to.
//   • No em-dashes in client copy (studio law) — the substrate validator itself bans
//     the long dash, so its own strings must not carry one.
// ============================================================================

// The he sub-table is the ONLY table where Hebrew glyphs are allowed.
const HE = {
  // ── shared ──
  "common.loading": "טוען…",
  "common.saving": "שומר…",
  "common.save": "שמירה",
  "common.intlLocale": "he-IL",

  // ── admin shell ──
  "admin.deskTitle": "ניהול תוכן",
  "admin.noCollectionsTitle": "אין עדיין אוספי תוכן",
  "admin.noCollectionsBody": "פנו לצוות שבנה את האתר כדי להפעיל בלוג, מתכונים או אוסף אחר.",
  "admin.logout": "יציאה",
  "admin.unconfigured": "הפרסום אינו מחובר עדיין. פנו לצוות שבנה את האתר.",

  // ── login ──
  "login.sent": "אם הכתובת מורשית, שלחנו אליה קישור כניסה. הקישור תקף ל-10 דקות ופועל רק מהדפדפן הזה.",
  "login.prompt": "הזינו את כתובת המייל שלכם ונשלח אליה קישור כניסה. אין צורך בסיסמה.",
  "login.emailLabel": "כתובת מייל",
  "login.sending": "שולח…",
  "login.submit": "שליחת קישור כניסה",

  // ── editor ──
  "editor.deleteConfirm": "למחוק את הפריט הזה מהאתר? הפעולה אינה הפיכה.",
  "editor.backTo": ({ label }) => `› חזרה ל${label}`,
  "editor.delete": "מחיקה",
  "editor.editVerb": "עריכת",
  "editor.createVerb": "יצירת",
  "editor.rescueTitle": "מצאנו טקסט שכתבתם ולא נשמר",
  "editor.rescueBody": ({ when }) => `הדפדפן שמר עותק מקומי מ${when}. רוצים לשחזר אותו?`,
  "editor.rescueRestore": "שחזור הטקסט",
  "editor.rescueDiscard": "התעלמו ומחקו",
  "editor.bodyLabel": "הטקסט",
  "editor.bodyHint": "כותרות משנה עם ## · הדגשה עם **מודגש** · קישור עם [טקסט](כתובת). בלי תגי HTML.",
  "editor.preview": "תצוגה מקדימה",
  "editor.slugLabel": "כתובת העמוד",
  "editor.slugHint": "אותיות באנגלית, ספרות ומקפים בלבד",
  "editor.localeLabel": "שפה",
  "editor.localeHe": "עברית",
  "editor.localeEn": "אנגלית",
  "editor.listHint": "פריט אחד בכל שורה",

  // ── chip select (fields that carry an `options` vocabulary) ──
  "chip.add": "הוספה",
  "chip.customPlaceholder": "ערך חדש...",

  // row editor controls (icon buttons — descriptive accessible names, not the glyph)
  "row.moveUp": "הזז מעלה",
  "row.moveDown": "הזז מטה",
  "row.remove": "הסרה",

  // ── recipe journey: stations + rail ──
  "journey.st.dish": "המנה",
  "journey.st.story": "הסיפור",
  "journey.st.ingredients": "רכיבים",
  "journey.st.steps": "אופן הכנה",
  "journey.st.image": "תמונה ותוספות",
  "journey.st.catalog": "קטלוג",
  "journey.st.publish": "כרטיס ביקור ופרסום",
  "journey.progress": ({ done, total }) => `הושלמו ${done} מתוך ${total} תחנות`,
  "journey.story.hint": "כמה משפטים אישיים בגובה העיניים: למה המתכון הזה, למי הוא מתאים",
  "journey.ing.add": "הוספת רכיב",
  "journey.ing.placeholder": "למשל: 2 ביצים",
  "journey.ing.hint": "רכיב בכל שורה. אפשר להדביק רשימה שלמה, היא תתפצל לבד",
  "journey.steps.add": "הוספת שלב",
  "journey.steps.placeholder": "מה עושים בשלב הזה?",
  "journey.steps.hint": "שלב בכל שורה. המספור נעשה לבד",
  "journey.tip.label": "טיפ (רשות)",
  "journey.advanced.toggle": "מתקדם: טקסט חופשי ותמונות בגוף",
  "journey.advanced.hint": "מה שנכתב כאן נשמר כמו שהוא בסוף המתכון",
  "journey.seo.preview": "כך זה ייראה בגוגל",
  "journey.seo.count": ({ n }) => `${n} תווים (היעד: 70 עד 160)`,
  "journey.missing.title": "עוד לא מוכן לפרסום. חסר:",
  "journey.preview.title": "תצוגה מקדימה",

  // ── recipe journey: station 0 (paste / from scratch) ──
  "journey.source.title": "מאיפה מתחילים?",
  "journey.source.pasteCard": "הדביקי מתכון מוכן",
  "journey.source.pasteHint": "מוואטסאפ, מוורד, מכל מקום. המערכת תסדר אותו לתחנות",
  "journey.source.scratchCard": "כתיבה מאפס",
  "journey.source.scratchHint": "בונים את המתכון תחנה אחר תחנה",
  "journey.source.pasteLabel": "כל המתכון, כמו שהוא",
  "journey.source.parse": "סדרי לי אותו",
  "journey.source.parsed": ({ found }) => `זיהיתי: ${found}`,
  "journey.source.apply": "אישור והמשך",
  "journey.source.back": "חזרה לבחירה",
  "journey.sum.title": "כותרת",
  "journey.sum.intro": "פתיח",
  "journey.sum.ingredients": ({ n }) => `${n} רכיבים`,
  "journey.sum.steps": ({ n }) => `${n} שלבים`,
  "journey.sum.tip": "טיפ",
  "journey.sum.nothing": "לא זיהיתי מבנה, הכל נכנס לפתיח לסידור ידני",
  "journey.slug.locked": "כתובת העמוד קבועה אחרי הפרסום הראשון",

  // ── publish bar ──
  "publish.publish": "פרסום לאתר",
  "publish.saveDraft": "שמירה כטיוטה",
  "publish.checkAgain": "בדקו שוב",
  "publish.fixBeforePublish": "צריך לתקן לפני פרסום:",
  "publish.pendingApproval": "נשלח לאישור. הפרסום יעלה לאוויר לאחר בדיקה.",
  "publish.savedLocal": "נשמר (סביבת פיתוח).",
  "publish.liveConfirmed": "פורסם ✓ הפוסט חי באתר.",
  "publish.savedNoVerify": "הפוסט נשמר ונשלח לאתר, אבל לא ניתן לאמת אוטומטית מתי הוא יעלה. בדקו את העמוד בעוד כמה דקות.",
  "publish.building": "הפוסט נשמר והבנייה עדיין רצה. האתר הישן ממשיך לעבוד בינתיים, והפוסט יופיע בעוד כמה דקות.",

  // ── collection list ──
  "list.newItem": ({ singular }) => `${singular} חדש`,
  "list.emptyLine1": "עדיין לא כתבתם כלום כאן.",
  "list.emptyLine2": ({ singular }) => `לחצו על הכפתור למעלה כדי לכתוב ${singular} ראשון.`,
  "list.draftBadge": "טיוטה",
  "list.noImage": "חסרה תמונה",

  // ── two-tier delete + history ──
  "delete.title": "מה לעשות עם הפריט הזה?",
  "delete.body": ({ label }) => `"${label}"`,
  "delete.hide": "הסרה מהאתר",
  "delete.hideHint": "הפריט יוסתר מהאתר אבל יישמר, ותוכלו להחזיר אותו בכל רגע.",
  "delete.forever": "מחיקה לצמיתות",
  "delete.cancel": "ביטול",
  "history.title": "גרסאות קודמות",
  "history.scopeNote": "רשימת השינויים שעלו לאתר. אפשר לצפות בכל גרסה ולשחזר אותה.",
  "history.empty": "אין עדיין גרסאות קודמות.",
  "history.current": "הגרסה הנוכחית",
  "history.view": "צפייה",
  "history.hideView": "סגירה",
  "history.restore": "שחזור הגרסה הזו",

  // ── settings form ──
  "settings.itemFallback": "פריט",
  "settings.remove": "הסרה",
  "settings.add": ({ item }) => `הוספת ${item}`,
  "settings.fixBeforeSave": "צריך לתקן לפני שמירה:",

  // ── media picker ──
  "media.uploading": "מעלה…",
  "media.replace": "החלפת תמונה",
  "media.choose": "בחירת תמונה",
  "media.altLabel": "תיאור התמונה (מה רואים בה). חובה, לנגישות ולחיפוש",
  "media.uploadFailed": "העלאה נכשלה",
  "media.readFailed": "לא הצלחנו לקרוא את הקובץ. נסו תמונה אחרת (JPG, PNG או WEBP)",

  // ── gallery field ──
  "gallery.hint": "אפשר להעלות כמה תמונות. לכל תמונה חובה לכתוב תיאור.",
  "gallery.altPlaceholder": "תיאור התמונה (מה רואים בה)",
  "gallery.add": "הוספת תמונות לגלריה",
  "gallery.remove": "הסרה",
  "gallery.moveUp": "הזזה למעלה",
  "gallery.moveDown": "הזזה למטה",

  // ── inline image + media library ──
  "inline.addImage": "העלאת תמונה חדשה",
  "inline.fromLibrary": "בחירה מהספרייה",
  "inline.altLabel": "תיאור התמונה (חובה)",
  "inline.insert": "הוספה לטקסט",
  "inline.cancel": "ביטול",
  "library.title": "ספריית התמונות",
  "library.close": "סגירה",
  "library.empty": "עדיין לא העליתם תמונות. העלו תמונה חדשה ותוכלו לבחור בה שוב בעתיד.",

  // ── server action results (rendered via T(brand.lang)) ──
  "action.sessionExpired": "פג תוקף החיבור. התחברו מחדש",
  "action.badSlug": "כתובת העמוד לא חוקית. מותרות אותיות לטיניות קטנות, ספרות ומקפים בלבד. לדוגמה: my-first-post",
  "action.pendingApprovalResult": "נשלח לאישור. הפרסום יעלה לאוויר לאחר בדיקה",
  "action.prBody": ({ email }) => `פורסם דרך מסך הניהול על ידי ${email}. ממתין לאישור לפני עלייה לאוויר.`,
  "action.draftSaved": "הטיוטה נשמרה. היא לא מוצגת באתר עד שתפרסמו אותה",
  "action.published": "פורסם. האתר יתעדכן תוך כ-2 דקות",
  "action.conflict": "מישהו אחר עדכן את הפריט הזה בינתיים. העתיקו את הטקסט שכתבתם, רעננו את הדף, והדביקו מחדש",
  "action.publishFailed": "הפרסום נכשל מול שרת הקוד. נסו שוב בעוד רגע. אם זה חוזר, פנו לתמיכה",
  "action.badPath": "כתובת לא חוקית",
  "action.deleted": "נמחק לצמיתות. האתר יתעדכן תוך כ-2 דקות",
  "action.deleteFailed": "המחיקה נכשלה. נסו שוב בעוד רגע",
  "action.hidden": "הוסר מהאתר. הפריט נשמר וניתן להחזיר אותו בכל רגע",
  "action.restoredDraft": "הגרסה שוחזרה כטיוטה. היא לא מוצגת באתר עד שתפרסמו אותה",
  "action.restoreFailed": "השחזור נכשל. נסו שוב בעוד רגע",
  "action.imageTooBig": ({ kb, max }) => `התמונה גדולה מדי (${kb}KB). הגודל המרבי הוא ${max}KB`,
  "action.imageBadType": "סוג הקובץ אינו נתמך. העלו תמונה בפורמט JPG, PNG או WEBP. קובצי SVG אינם מותרים",
  "action.imageAltRequired": "חובה לכתוב תיאור קצר לתמונה: משפט שמתאר מה רואים בה",
  "action.imageUploaded": "התמונה הועלתה",
  "action.imageBadTypeShort": "סוג הקובץ אינו נתמך",
  "action.uploadFailed": "העלאת התמונה נכשלה. נסו שוב",
  "action.badSettingsName": "שם הגדרות לא חוקי",
  "action.settingsSaved": "נשמר. האתר יתעדכן תוך כ-2 דקות",
  "action.settingsConflict": "הפרטים עודכנו במקביל. רעננו את הדף ונסו שוב",
  "action.settingsSaveFailed": "השמירה נכשלה. נסו שוב בעוד רגע",

  // ── auth (magic-link confirm page + email) ──
  "auth.confirmTitle": ({ name }) => `כניסה לניהול · ${name}`,
  "auth.invalidTitle": "קישור לא תקין",
  "auth.invalidBody": "חסר קוד כניסה. בקשו קישור חדש ממסך הניהול.",
  "auth.confirmHeading": "כניסה לניהול התוכן",
  "auth.confirmBody": ({ name }) => `לחצו על הכפתור כדי להשלים את הכניסה ל<strong>${name}</strong>.`,
  "auth.enterButton": "כניסה",
  "auth.expiredTitle": "הקישור פג או אינו תקף",
  "auth.expiredBody": `קישור הכניסה תקף ל-10 דקות, ורק מהדפדפן שממנו ביקשתם אותו.<br><a href="/admin">בקשו קישור חדש</a>`,
  "auth.emailSubject": ({ name }) => `כניסה לניהול התוכן של ${name}`,
  "auth.emailIntro": ({ name }) => `קישור הכניסה שלכם לניהול התוכן של <strong>${name}</strong>:`,
  "auth.emailButton": "כניסה לניהול",
  "auth.emailFootnote": "הקישור תקף ל-10 דקות ופועל רק מהדפדפן שממנו ביקשתם אותו. אם לא ביקשתם כניסה, אפשר להתעלם מההודעה.",
};

// The en sub-table. EVERY value here MUST be Hebrew-glyph-free (gate-enforced).
// Plain, warm, business-explaining English; no em-dashes (studio copy law).
const EN = {
  "common.loading": "Loading…",
  "common.saving": "Saving…",
  "common.save": "Save",
  "common.intlLocale": "en-US",

  "admin.deskTitle": "Content",
  "admin.noCollectionsTitle": "No content collections yet",
  "admin.noCollectionsBody": "Ask the team that built the site to turn on a blog, recipes, or another collection.",
  "admin.logout": "Sign out",
  "admin.unconfigured": "Publishing is not connected yet. Contact the team that built the site.",

  "login.sent": "If the address is authorized, we sent it a sign-in link. The link is valid for 10 minutes and works only from this browser.",
  "login.prompt": "Enter your email address and we will send you a sign-in link. No password needed.",
  "login.emailLabel": "Email address",
  "login.sending": "Sending…",
  "login.submit": "Send sign-in link",

  "editor.deleteConfirm": "Remove this item from the site? This cannot be undone.",
  // LTR back affordance points LEFT (‹); the he value keeps › because back = rightward in RTL.
  "editor.backTo": ({ label }) => `‹ Back to ${label}`,
  "editor.delete": "Delete",
  "editor.editVerb": "Edit",
  "editor.createVerb": "New",
  "editor.rescueTitle": "We found text you wrote that was not saved",
  "editor.rescueBody": ({ when }) => `Your browser kept a local copy from ${when}. Restore it?`,
  "editor.rescueRestore": "Restore the text",
  "editor.rescueDiscard": "Ignore and delete",
  "editor.bodyLabel": "The text",
  "editor.bodyHint": "Subheadings with ## · bold with **bold** · link with [text](url). No HTML tags.",
  "editor.preview": "Preview",
  "editor.slugLabel": "Page address",
  "editor.slugHint": "Latin letters, digits and hyphens only",
  "editor.localeLabel": "Language",
  "editor.localeHe": "Hebrew",
  "editor.localeEn": "English",
  "editor.listHint": "One item per line",

  "chip.add": "Add",
  "chip.customPlaceholder": "New value...",

  "row.moveUp": "Move up",
  "row.moveDown": "Move down",
  "row.remove": "Remove",

  "journey.st.dish": "The dish",
  "journey.st.story": "The story",
  "journey.st.ingredients": "Ingredients",
  "journey.st.steps": "Method",
  "journey.st.image": "Photo & extras",
  "journey.st.catalog": "Catalog",
  "journey.st.publish": "Search card & publish",
  "journey.progress": ({ done, total }) => `${done} of ${total} stations done`,
  "journey.story.hint": "A few personal lines: why this recipe, who it fits",
  "journey.ing.add": "Add ingredient",
  "journey.ing.placeholder": "e.g. 2 eggs",
  "journey.ing.hint": "One ingredient per line. Paste a whole list and it splits itself",
  "journey.steps.add": "Add step",
  "journey.steps.placeholder": "What happens in this step?",
  "journey.steps.hint": "One step per line. Numbering is automatic",
  "journey.tip.label": "Tip (optional)",
  "journey.advanced.toggle": "Advanced: free text & inline images",
  "journey.advanced.hint": "Saved verbatim at the end of the recipe",
  "journey.seo.preview": "How it looks on Google",
  "journey.seo.count": ({ n }) => `${n} characters (target: 70 to 160)`,
  "journey.missing.title": "Not ready to publish yet. Missing:",
  "journey.preview.title": "Preview",

  "journey.source.title": "Where do we start?",
  "journey.source.pasteCard": "Paste a ready recipe",
  "journey.source.pasteHint": "From WhatsApp or a doc. It will be sorted into the stations",
  "journey.source.scratchCard": "Start from scratch",
  "journey.source.scratchHint": "Build the recipe station by station",
  "journey.source.pasteLabel": "The whole recipe, as is",
  "journey.source.parse": "Sort it for me",
  "journey.source.parsed": ({ found }) => `Recognized: ${found}`,
  "journey.source.apply": "Apply and continue",
  "journey.source.back": "Back to choice",
  "journey.sum.title": "title",
  "journey.sum.intro": "intro",
  "journey.sum.ingredients": ({ n }) => `${n} ingredients`,
  "journey.sum.steps": ({ n }) => `${n} steps`,
  "journey.sum.tip": "tip",
  "journey.sum.nothing": "No structure recognized, everything went into the intro",
  "journey.slug.locked": "The page address is fixed after first publish",

  "publish.publish": "Publish to the site",
  "publish.saveDraft": "Save as draft",
  "publish.checkAgain": "Check again",
  "publish.fixBeforePublish": "Fix before publishing:",
  "publish.pendingApproval": "Sent for review. It will go live after it is checked.",
  "publish.savedLocal": "Saved (development environment).",
  "publish.liveConfirmed": "Published ✓ the post is live on the site.",
  "publish.savedNoVerify": "The post was saved and sent to the site, but we cannot verify automatically when it goes live. Check the page again in a few minutes.",
  "publish.building": "The post was saved and the build is still running. The old site keeps working in the meantime, and the post will appear in a few minutes.",

  "list.newItem": ({ singular }) => `New ${singular}`,
  "list.emptyLine1": "You have not written anything here yet.",
  "list.emptyLine2": ({ singular }) => `Use the button above to write your first ${singular}.`,
  "list.draftBadge": "Draft",
  "list.noImage": "No photo",

  "delete.title": "What should happen to this item?",
  "delete.body": ({ label }) => `"${label}"`,
  "delete.hide": "Remove from the site",
  "delete.hideHint": "The item will be hidden from the site but kept, and you can restore it any time.",
  "delete.forever": "Delete permanently",
  "delete.cancel": "Cancel",
  "history.title": "Earlier versions",
  "history.scopeNote": "The list of changes that went live on the site. You can view any version and restore it.",
  "history.empty": "No earlier versions yet.",
  "history.current": "Current version",
  "history.view": "View",
  "history.hideView": "Close",
  "history.restore": "Restore this version",

  "settings.itemFallback": "Item",
  "settings.remove": "Remove",
  "settings.add": ({ item }) => `Add ${item}`,
  "settings.fixBeforeSave": "Fix before saving:",

  "media.uploading": "Uploading…",
  "media.replace": "Replace image",
  "media.choose": "Choose image",
  "media.altLabel": "Image description (what is shown in it). Required, for accessibility and search",
  "media.uploadFailed": "Upload failed",
  "media.readFailed": "We could not read the file. Try another image (JPG, PNG or WEBP)",

  "gallery.hint": "You can upload several images. Every image needs a description.",
  "gallery.altPlaceholder": "Image description (what is shown in it)",
  "gallery.add": "Add images to the gallery",
  "gallery.remove": "Remove",
  "gallery.moveUp": "Move up",
  "gallery.moveDown": "Move down",

  "inline.addImage": "Upload a new image",
  "inline.fromLibrary": "Choose from the library",
  "inline.altLabel": "Image description (required)",
  "inline.insert": "Add to the text",
  "inline.cancel": "Cancel",
  "library.title": "Image library",
  "library.close": "Close",
  "library.empty": "You have not uploaded any images yet. Upload a new one and you will be able to reuse it later.",

  "action.sessionExpired": "Your session expired. Sign in again",
  "action.badSlug": "The page address is invalid. Latin lowercase letters, digits and hyphens only. For example: my-first-post",
  "action.pendingApprovalResult": "Sent for review. It will go live after it is checked",
  "action.prBody": ({ email }) => `Published through the admin by ${email}. Awaiting review before going live.`,
  "action.draftSaved": "The draft was saved. It is not shown on the site until you publish it",
  "action.published": "Published. The site will update in about 2 minutes",
  "action.conflict": "Someone else updated this item in the meantime. Copy the text you wrote, refresh the page, and paste it again",
  "action.publishFailed": "Publishing to the code server failed. Try again in a moment. If it keeps happening, contact support",
  "action.badPath": "Invalid address",
  "action.deleted": "Permanently deleted. The site will update in about 2 minutes",
  "action.deleteFailed": "The delete failed. Try again in a moment",
  "action.hidden": "Removed from the site. The item is saved and you can restore it any time",
  "action.restoredDraft": "The version was restored as a draft. It is not shown on the site until you publish it",
  "action.restoreFailed": "The restore failed. Try again in a moment",
  "action.imageTooBig": ({ kb, max }) => `The image is too large (${kb}KB). The maximum size is ${max}KB`,
  "action.imageBadType": "The file type is not supported. Upload an image in JPG, PNG or WEBP format. SVG files are not allowed",
  "action.imageAltRequired": "You must write a short description for the image: a sentence describing what is shown in it",
  "action.imageUploaded": "The image was uploaded",
  "action.imageBadTypeShort": "The file type is not supported",
  "action.uploadFailed": "The image upload failed. Try again",
  "action.badSettingsName": "Invalid settings name",
  "action.settingsSaved": "Saved. The site will update in about 2 minutes",
  "action.settingsConflict": "The details were updated at the same time. Refresh the page and try again",
  "action.settingsSaveFailed": "The save failed. Try again in a moment",

  "auth.confirmTitle": ({ name }) => `Content sign-in · ${name}`,
  "auth.invalidTitle": "Invalid link",
  "auth.invalidBody": "The sign-in code is missing. Request a new link from the admin screen.",
  "auth.confirmHeading": "Sign in to content management",
  "auth.confirmBody": ({ name }) => `Press the button to complete sign-in to <strong>${name}</strong>.`,
  "auth.enterButton": "Sign in",
  "auth.expiredTitle": "The link expired or is not valid",
  "auth.expiredBody": `The sign-in link is valid for 10 minutes, and only from the browser you requested it from.<br><a href="/admin">Request a new link</a>`,
  "auth.emailSubject": ({ name }) => `Sign in to the content management of ${name}`,
  "auth.emailIntro": ({ name }) => `Your sign-in link to the content management of <strong>${name}</strong>:`,
  "auth.emailButton": "Sign in to admin",
  "auth.emailFootnote": "The link is valid for 10 minutes and works only from the browser you requested it from. If you did not request a sign-in, you can ignore this message.",
};

export const STRINGS = { he: HE, en: EN };

// ── ERRORS — validator messages keyed by CODE. Every entry is a (params)=>string
// builder so formatError renders uniformly and the Hebrew-free-value gate can call
// each en builder with a params proxy. The he table reproduces today's exact copy
// (including the LRM ‎ isolators around /media/ that keep the ascii path from
// flipping inside the RTL sentence). ──────────────────────────────────────────
const ERR_HE = {
  "frontmatter.orphanListItem": () => 'שורת רשימה ("- ") ללא שם שדה מעליה',
  "frontmatter.unrecognizedLine": ({ line }) => `שורה לא מזוהה בכותרת הקובץ: "${line}"`,
  "frontmatter.nestedStructure": ({ key }) => `השדה "${key}" מכיל מבנה מקונן. השתמשו בשדות פשוטים בלבד`,

  "field.required": ({ label }) => `השדה "${label}" הוא חובה. מלאו אותו לפני הפרסום`,
  "field.badDate": ({ label }) => `תאריך לא תקין בשדה "${label}". הפורמט הנדרש: YYYY-MM-DD (למשל 2026-07-10)`,
  "field.notBoolean": ({ label }) => `השדה "${label}" חייב להיות true או false`,
  "field.notList": ({ label }) => `השדה "${label}" חייב להיות רשימה (שורות שמתחילות ב"- ")`,
  "field.listTooFew": ({ label, min }) => `בשדה "${label}" נדרשים לפחות ${min} פריטים`,
  "field.listTooMany": ({ label, max }) => `בשדה "${label}" מותרים עד ${max} פריטים`,
  "field.imageNotMedia": ({ label }) => `"${label}" חייב להצביע על קובץ תחת ‎/media/‎. העלו את התמונה דרך מסך הניהול`,
  "field.imageAltMissing": ({ label }) => `לתמונה "${label}" חסר תיאור (alt): משפט קצר שמתאר מה רואים בתמונה. חשוב לנגישות ולחיפוש`,
  "field.galleryTooFew": ({ label, min }) => `בגלריה "${label}" נדרשות לפחות ${min} תמונות`,
  "field.galleryTooMany": ({ label, max }) => `בגלריה "${label}" מותרות עד ${max} תמונות`,
  "field.galleryAltCount": ({ label }) => `לכל תמונה בגלריה "${label}" חייב להיות תיאור. חלק מהתמונות ללא תיאור`,
  "field.galleryAltEmpty": ({ label }) => `אחת התמונות בגלריה "${label}" ללא תיאור (alt). מלאו תיאור קצר לכל תמונה`,
  "field.textTooShort": ({ label, min, len }) => `"${label}" קצר מדי. נדרשים לפחות ${min} תווים, כרגע ${len}`,
  "field.textTooLong": ({ label, max, len }) => `"${label}" ארוך מדי. מותרים עד ${max} תווים, כרגע ${len}`,

  "text.emDash": () => "נמצא קו מפריד ארוך, סימן היכר של טקסט מכונה. המירו אותו לפסיק, לנקודה או לנקודתיים",
  "phrase.placeholder": ({ p }) => `סימון תבנית: "${p}". נסחו במילים שלכם, ספציפית לעסק`,
  "phrase.banned": ({ p }) => `ביטוי שיווקי גנרי: "${p}". נסחו במילים שלכם, ספציפית לעסק`,
  "phrase.ymyl": ({ p }) => `סימון תוכן לא מאומת: "${p}". נסחו במילים שלכם, ספציפית לעסק`,
  "scalar.angleBrackets": () => "אסור להשתמש בתווים < או > בשדה זה. כתבו טקסט רגיל",

  "doc.badSlug": () => "כתובת העמוד (slug) לא חוקית. מותרות אותיות לטיניות קטנות, ספרות ומקפים בלבד, עד 80 תווים. לדוגמה: my-first-post",
  "doc.draftNotBoolean": () => "השדה draft חייב להיות true או false",
  "body.rawHtml": ({ found }) => `אסור להשתמש בתגי HTML בגוף הטקסט. נמצא: ${found}. כתבו טקסט רגיל: כותרות עם ##, הדגשה עם **`,
  "body.inlineImageNoAlt": () => "לתמונה בתוך הטקסט חסר תיאור. הוסיפו תיאור בתוך הסוגריים המרובעים: ![תיאור התמונה](כתובת)",
  "body.tooFewWords": ({ min, words }) => `הטקסט קצר מדי. נדרשות לפחות ${min} מילים, כרגע ${words}`,
  "body.tooManyWords": ({ max, words }) => `הטקסט ארוך מדי. מותרות עד ${max} מילים, כרגע ${words}. שקלו לפצל לשני פרסומים`,

  "settings.mustBeList": ({ name }) => `הקובץ ${name}.json חייב להכיל רשימה`,
  "settings.itemNotObject": () => "כל פריט חייב להיות אובייקט של שדות",

  "tree.collectionsNotJson": ({ message }) => "קובץ ההגדרות אינו JSON תקין: " + message,
  "tree.badCollectionId": ({ id }) => `מזהה אוסף לא חוקי: "${id}". מותרות אותיות לטיניות קטנות, ספרות ומקפים`,
  "tree.dupCollectionId": ({ id }) => `מזהה אוסף כפול: "${id}"`,
  "tree.i18nFilename": () => "באוסף דו-לשוני שם הקובץ חייב לכלול סיומת שפה: <slug>.he.md או <slug>.en.md",
  "tree.badFilename": () => "שם קובץ לא חוקי. מותרות אותיות לטיניות קטנות, ספרות ומקפים בלבד, כי שם הקובץ הופך לכתובת העמוד",
  "tree.settingsNotJson": ({ message }) => "הקובץ אינו JSON תקין: " + message,
  "tree.schemaNotJson": ({ message }) => "קובץ הסכימה אינו JSON תקין: " + message,
};

const ERR_EN = {
  "frontmatter.orphanListItem": () => 'A list line ("- ") with no field name above it',
  "frontmatter.unrecognizedLine": ({ line }) => `Unrecognized line in the file header: "${line}"`,
  "frontmatter.nestedStructure": ({ key }) => `The field "${key}" contains a nested structure. Use simple fields only`,

  "field.required": ({ label }) => `The field "${label}" is required. Fill it in before publishing`,
  "field.badDate": ({ label }) => `Invalid date in the field "${label}". Required format: YYYY-MM-DD (for example 2026-07-10)`,
  "field.notBoolean": ({ label }) => `The field "${label}" must be true or false`,
  "field.notList": ({ label }) => `The field "${label}" must be a list (lines starting with "- ")`,
  "field.listTooFew": ({ label, min }) => `The field "${label}" needs at least ${min} items`,
  "field.listTooMany": ({ label, max }) => `The field "${label}" allows up to ${max} items`,
  "field.imageNotMedia": ({ label }) => `"${label}" must point to a file under ‎/media/‎. Upload the image through the admin screen`,
  "field.imageAltMissing": ({ label }) => `The image "${label}" has no description (alt): a short sentence describing what is shown in it. Important for accessibility and search`,
  "field.galleryTooFew": ({ label, min }) => `The gallery "${label}" needs at least ${min} images`,
  "field.galleryTooMany": ({ label, max }) => `The gallery "${label}" allows up to ${max} images`,
  "field.galleryAltCount": ({ label }) => `Every image in the gallery "${label}" must have a description. Some images have none`,
  "field.galleryAltEmpty": ({ label }) => `One of the images in the gallery "${label}" has no description (alt). Add a short description for each image`,
  "field.textTooShort": ({ label, min, len }) => `"${label}" is too short. At least ${min} characters are needed, currently ${len}`,
  "field.textTooLong": ({ label, max, len }) => `"${label}" is too long. Up to ${max} characters are allowed, currently ${len}`,

  "text.emDash": () => "A long dash was found, a hallmark of machine text. Replace it with a comma, a period, or a colon",
  "phrase.placeholder": ({ p }) => `Template marker: "${p}". Write it in your own words, specific to the business`,
  "phrase.banned": ({ p }) => `Generic marketing phrase: "${p}". Write it in your own words, specific to the business`,
  "phrase.ymyl": ({ p }) => `Unverified-content marker: "${p}". Write it in your own words, specific to the business`,
  "scalar.angleBrackets": () => "The characters < and > are not allowed in this field. Write plain text",

  "doc.badSlug": () => "The page address (slug) is invalid. Latin lowercase letters, digits and hyphens only, up to 80 characters. For example: my-first-post",
  "doc.draftNotBoolean": () => "The draft field must be true or false",
  "body.rawHtml": ({ found }) => `HTML tags are not allowed in the body text. Found: ${found}. Write plain text: headings with ##, bold with **`,
  "body.inlineImageNoAlt": () => "An image inside the text has no description. Add one inside the square brackets: ![image description](url)",
  "body.tooFewWords": ({ min, words }) => `The text is too short. At least ${min} words are needed, currently ${words}`,
  "body.tooManyWords": ({ max, words }) => `The text is too long. Up to ${max} words are allowed, currently ${words}. Consider splitting into two posts`,

  "settings.mustBeList": ({ name }) => `The file ${name}.json must contain a list`,
  "settings.itemNotObject": () => "Each item must be an object of fields",

  "tree.collectionsNotJson": ({ message }) => "The settings file is not valid JSON: " + message,
  "tree.badCollectionId": ({ id }) => `Invalid collection id: "${id}". Latin lowercase letters, digits and hyphens only`,
  "tree.dupCollectionId": ({ id }) => `Duplicate collection id: "${id}"`,
  "tree.i18nFilename": () => "In a bilingual collection the file name must include a language suffix: <slug>.he.md or <slug>.en.md",
  "tree.badFilename": () => "Invalid file name. Latin lowercase letters, digits and hyphens only, because the file name becomes the page address",
  "tree.settingsNotJson": ({ message }) => "The file is not valid JSON: " + message,
  "tree.schemaNotJson": ({ message }) => "The schema file is not valid JSON: " + message,
};

export const ERRORS = { he: ERR_HE, en: ERR_EN };

// The locales the desk actually ships a table for. An UNSUPPORTED site language
// (e.g. 'ar') must FAIL a gate loudly rather than silently fall back to Hebrew with
// a mismatched direction — see lint-content. Runtime t()/formatError still fall back
// to he, but the gates make that path unreachable in a shipped site.
export const SUPPORTED_LOCALES = Object.keys(STRINGS);

// t(locale,key,params) — the UI-string resolver. Runtime fallback is he.
export function t(locale, key, params) {
  const v = STRINGS[locale]?.[key] ?? STRINGS.he[key];
  if (typeof v === "function") return v(params || {});
  return v ?? "";
}

// formatError(err,locale) — render a coded validator error. err = {code,params,msg?}.
// A code-less error (a legacy string problem) falls back to its own msg, never empty.
export function formatError(err, locale) {
  const fn = ERRORS[locale]?.[err.code] ?? ERRORS.he[err.code];
  if (!fn) return err.msg ?? "";
  return fn(err.params || {});
}

// formatErrors(errs,locale) — the whole list, rendered in one locale.
export function formatErrors(errs, locale) {
  return errs.map((e) => formatError(e, locale));
}
