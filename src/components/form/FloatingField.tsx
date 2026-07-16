import type { InputHTMLAttributes } from "react";

// FloatingField — a floating-label input: the label rests inside and floats up on focus OR when filled, via the
// pure-CSS :placeholder-shown trick (NO JS). Optional `valid` shows a brass check (the FieldValid affordance,
// folded in). House rule #1: reduced-motion = the label snaps (no float transition). Logical-property anchored
// (RTL/LTR both). Server component. Styles live in globals.css (.floating-field). The label needs a matching id.
export function FloatingField({
  id,
  label,
  valid,
  className = "",
  ...input
}: {
  id: string;
  label: string;
  valid?: boolean;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`floating-field${valid ? " is-valid" : ""} ${className}`}>
      {/* placeholder=" " AFTER the spread so the :placeholder-shown trick always works */}
      <input {...input} id={id} placeholder=" " className="ff-input" />
      <label htmlFor={id} className="ff-label">{label}</label>
      {valid ? <span className="ff-check text-gold" aria-hidden>✓</span> : null}
    </div>
  );
}
