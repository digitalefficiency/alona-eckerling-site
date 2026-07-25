// Shared form focus management — the half of validation that is invisible in
// code review and decisive in use.
//
// Both site forms are `noValidate` (they render their own Hebrew errors instead
// of the browser's English bubbles), which means NOTHING moves focus when a
// submit is rejected. Without that move, a screen-reader user hears silence
// after pressing «שליחה», and a phone user whose invalid field scrolled off the
// top of a tall form sees no change at all and concludes the site is broken.
//
// WCAG 3.3.1 (Error Identification) is satisfied by the visible text + the
// role="alert" on each message; this file covers the focus half.

/** Focus (and scroll to) the first control the form marked aria-invalid. */
export function focusFirstInvalid(form: HTMLFormElement | null): void {
  if (!form) return;
  // aria-invalid is already wired on every validated control in both forms, so
  // it is the single source of truth — no second list of field names to drift.
  const el = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!el) return;
  el.focus({ preventScroll: true });
  // Centre it: `preventScroll` above stops the browser's abrupt jump, then we
  // scroll deliberately so the field lands clear of the fixed header AND the
  // mobile StickyContactBar rather than under either.
  el.scrollIntoView({ block: "center", behavior: "smooth" });
}

/**
 * Move focus to a success/status panel that REPLACED the form.
 *
 * A live region that enters the DOM together with its content is not announced
 * reliably by NVDA or VoiceOver, and the submit button that had focus has just
 * been unmounted — so focus falls to <body> and the user loses their place
 * entirely. Focusing the panel solves both: it announces, and it keeps the
 * reading position at the outcome.
 *
 * The panel must carry tabIndex={-1} for this to work.
 */
export function focusStatusPanel(el: HTMLElement | null): void {
  if (!el) return;
  el.focus({ preventScroll: true });
}
