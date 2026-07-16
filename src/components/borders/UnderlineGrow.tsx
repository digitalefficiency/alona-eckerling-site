import type { CSSProperties } from "react";

// UnderlineGrow — a link/heading underline that grows from the READING START on hover (RTL: right→left,
// LTR: left→right). Pure CSS transition on the house micro token; reduced-motion → the underline simply
// appears (no grow). Direction-aware (transform-origin follows dir → directionSensitive). Server component.
// The scaleX transition + transform-origin live in globals.css (.underline-grow); this sets the reading side.
export function UnderlineGrow({
  children,
  as = "span",
  className = "",
  dir,
  ...rest
}: {
  children: React.ReactNode;
  as?: "span" | "a" | "h2" | "h3";
  className?: string;
  dir?: "rtl" | "ltr"; // override; default follows the document direction via CSS :dir()
} & React.HTMLAttributes<HTMLElement> & { href?: string; target?: string; rel?: string }) {
  const Tag = as;
  // Default origin follows the document direction (CSS :dir()); an explicit `dir` prop overrides via --ug-origin.
  const style: CSSProperties | undefined = dir ? ({ ["--ug-origin"]: dir === "rtl" ? "right" : "left" } as CSSProperties) : undefined;
  return (
    <Tag className={`underline-grow ${className}`} style={style} {...rest}>
      {children}
    </Tag>
  );
}
