"use client";

import { useEffect, useRef } from "react";

// Toast — a transient brass toast at the reading-end bottom corner (the calm lead-form success / analytics ack,
// NEVER confetti). aria-live polite, auto-dismisses. House rule #1: reduced-motion / a11y = it appears by opacity
// only (no slide, globals.css @media). Controlled (open + onClose). Logical corner (inset-inline-end → RTL/LTR).
export function Toast({
  open,
  message,
  onClose,
  duration = 4000,
  className = "",
}: {
  open: boolean;
  message: React.ReactNode;
  onClose: () => void;
  duration?: number; // ms before auto-dismiss
  className?: string;
}) {
  // Ref the callback so an inline-arrow onClose doesn't reset the auto-dismiss timer on every parent re-render.
  const cbRef = useRef(onClose);
  cbRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => cbRef.current(), duration);
    return () => clearTimeout(t);
  }, [open, duration]);

  if (!open) return null;
  return (
    <div role="status" aria-live="polite" className={`toast ${className}`}>
      <span className="text-gold" aria-hidden>◆</span>
      <span>{message}</span>
    </div>
  );
}
