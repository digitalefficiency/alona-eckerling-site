"use client";

import Image from "next/image";
import { useReveal } from "@/lib/motion";

// Wraps a next/image (fill) and uncovers it on first view with the signature
// RTL clip-wipe + a subtle counter-scale settle. SSR shows the final image
// (no clip); the animation is opt-in via "is-animating" on view.
export function ClipReveal({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const ref = useReveal<HTMLDivElement>({ className: "is-animating" });
  // Fills its (positioned) parent. NOTE: keep `absolute inset-0` here — passing
  // a competing `relative` via className would lose to Tailwind's source order.
  return (
    <div ref={ref} className={`clip-frame absolute inset-0 overflow-hidden ${className}`}>
      <div className="clip-scale absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${imgClassName}`}
        />
      </div>
    </div>
  );
}
