"use client";

import { useEffect, useRef, useState } from "react";

// Central gate for all motion. Reduced-motion always yields the final static
// state; coarse-pointer disables pointer-driven flourishes (magnetism, cursor).
export function useMotionPrefs() {
  const [prefs, setPrefs] = useState({ reduced: false, coarse: false });
  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)");
    const c = window.matchMedia("(pointer: coarse)");
    const update = () => setPrefs({ reduced: r.matches, coarse: c.matches });
    update();
    r.addEventListener("change", update);
    c.addEventListener("change", update);
    return () => {
      r.removeEventListener("change", update);
      c.removeEventListener("change", update);
    };
  }, []);
  return prefs;
}

// Synchronous check for BOTH motion gates: the OS preference AND the site's
// accessibility-menu toggle (html.a11y-stop-motion). Safe to call inside a
// layout effect (the M-primitives arm their hidden state pre-paint only when
// this returns true). Returns false on the server.
export function motionAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !document.documentElement.classList.contains("a11y-stop-motion")
  );
}

// Reactive version of motionAllowed() for CONTINUOUS effects (parallax,
// magnetism, page transitions) that must also release mid-flight when the
// user flips either gate. Starts false (SSR = final static design) and
// tracks the media query + the a11y class.
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowed(motionAllowed());
    update();
    mq.addEventListener("change", update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mq.removeEventListener("change", update);
      mo.disconnect();
    };
  }, []);
  return allowed;
}

type RevealOpts = {
  className?: string; // class added on first view (animation trigger)
  attr?: string; // attribute set on first view (e.g. "data-shown")
  rootMargin?: string;
  threshold?: number;
};

// One-shot IntersectionObserver reveal. Adds a class and/or attribute the first
// time the element scrolls into view. Under reduced-motion it skips the
// class-based animation but still sets attr-based reveals (whose CSS forces the
// final visible state), so content never stays hidden.
export function useReveal<T extends HTMLElement>(opts: RevealOpts = {}) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { className, attr, rootMargin = "0px 0px -12% 0px", threshold = 0 } = opts;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      if (attr) el.setAttribute(attr, "");
      return; // no class-driven animation under reduced-motion
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (className) el.classList.add(className);
          if (attr) el.setAttribute(attr, "");
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}
