// Accessibility-settings bootstrap — the render-blocking half of the a11y menu.
//
// AccessibilityMenu restores saved settings in a layout effect, which is the
// earliest a React client component CAN run: after hydration. On this site that
// is ~3.7s behind first paint (LCP), so a returning visitor who saved
// `textPct: 145` because she cannot read 17px spent that entire window looking
// at 17px, and then watched the page jump. Same for contrast and grayscale.
//
// The fix is the standard no-flash pattern: a tiny synchronous script in <body>
// that reads the same localStorage key and writes the same root styles/classes
// BEFORE the browser paints. It must stay byte-compatible with `apply()` in
// AccessibilityMenu.tsx, so the key and the base font size live here and both
// sides import them.

/** localStorage key holding the saved Settings object. */
export const A11Y_KEY = "bz_a11y";

/** Root font-size the @layer base rule sets, in px — the 100% baseline. */
export const A11Y_BASE_PX = 17;

/**
 * Synchronous bootstrap, injected via dangerouslySetInnerHTML in layout.tsx.
 *
 * Wrapped in try/catch so a disabled-storage browser (Safari private mode,
 * hardened profiles) degrades to defaults instead of throwing before paint and
 * taking the page with it.
 */
export const A11Y_BOOTSTRAP = `(function(){try{
var s=JSON.parse(localStorage.getItem(${JSON.stringify(A11Y_KEY)})||"{}");
var r=document.documentElement;
if(s.textPct&&s.textPct!==100)r.style.fontSize=((${A11Y_BASE_PX}*s.textPct)/100).toFixed(1)+"px";
var f=[];if(s.contrast)f.push("contrast(1.4)");if(s.grayscale)f.push("grayscale(1)");
if(f.length)r.style.filter=f.join(" ");
if(s.links)r.classList.add("a11y-links");
if(s.readable)r.classList.add("a11y-readable");
if(s.stopMotion)r.classList.add("a11y-stop-motion");
if(s.bigCursor)r.classList.add("a11y-big-cursor");
}catch(e){}})();`;
