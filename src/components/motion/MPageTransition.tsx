"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMotionAllowed } from "@/lib/motion";
import {
  pageCurtain,
  pageCurtainStatic,
  pageShell,
  pageShellStatic,
} from "@/lib/motion-variants";

// Route transition wrapper — a quiet content fade plus a SUBTLE brand curtain
// (navy panel, transform-origin top) that draws down over the exiting page and
// lifts off the entering one. All timing lives in lib/motion-variants
// (pageShell on DUR.micro, pageCurtain on EASE.inOut — the curtain curve).
//
// PER-SITE OPT-IN — NOT mounted by default. To enable, wrap the page slot in
// src/app/layout.tsx (inside <MotionConfig>):
//
//   <main className="flex-1">
//     <MPageTransition>{children}</MPageTransition>
//   </main>
//
// Mount it around {children} ONLY — never around Header/Footer chrome.
//
// House rule #1: the first (SSR) render is the FINAL visible page —
// `initial={false}` on AnimatePresence means nothing animates on load and the
// server HTML carries final-state styles. Transitions run only on CLIENT
// navigations. Reduced-motion / html.a11y-stop-motion swap in the SNAP
// (instant) variant twins, so route changes stay immediate and the curtain
// never covers the page.
export function MPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const allowed = useMotionAllowed();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* Keyed orchestrator: carries the out/in labels only — the curtain must
          NOT sit inside the fading layer or it would fade with the page. */}
      <motion.div key={pathname} initial="out" animate="in" exit="out">
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[90] origin-top bg-navy"
          variants={allowed ? pageCurtain : pageCurtainStatic}
        />
        <motion.div variants={allowed ? pageShell : pageShellStatic}>{children}</motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
