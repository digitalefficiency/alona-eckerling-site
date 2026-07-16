import Image from "next/image";

// Emerald-signature image frame: a chamfered "elongated hexagon" clip with an
// offset gold outline tracing the same shape, plus a ◆ corner accent. The image
// fills the frame (object-cover). chamfer is a % of the box cut from the
// top-start and bottom-end corners.
export function AngularFrame({
  src,
  alt,
  sizes = "(max-width:768px) 100vw, 620px",
  priority = false,
  aspectRatio = "4 / 5",
  chamfer = 7,
  className = "",
  breakout = false,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  aspectRatio?: string;
  chamfer?: number;
  className?: string;
  // When true, the gold frame is OFFSET so the photo overlaps it on two sides and
  // the frame "breaks out" on the others — the editorial broken-grid look.
  breakout?: boolean;
}) {
  const c = chamfer;
  const clip = `polygon(${c}% 0, 100% 0, 100% ${100 - c}%, ${100 - c}% 100%, 0 100%, 0 ${c}%)`;
  const pts = `${c},0 100,0 100,${100 - c} ${100 - c},100 0,100 0,${c}`;
  return (
    <div className={`group relative ${className}`} style={{ aspectRatio }}>
      {/* offset gold outline tracing the same polygon — behind the photo on breakout
          so the image overlaps it (the "breaks out of the frame" effect). */}
      <svg
        className={`pointer-events-none absolute ${breakout ? "z-0" : "-inset-2.5 z-10"}`}
        style={breakout ? { inset: 0, transform: "translate(22px, 22px)" } : undefined}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon points={pts} fill="none" stroke="var(--color-gold)" strokeWidth={breakout ? "0.7" : "0.5"} vectorEffect="non-scaling-stroke" opacity={breakout ? "0.7" : "0.55"} />
      </svg>
      {/* image, clipped to the angular shape */}
      <div className={`absolute inset-0 overflow-hidden ${breakout ? "z-[1]" : ""}`} style={{ clipPath: clip }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,30,63,.32), transparent 50%)" }} />
      </div>
      {/* ◆ accent on the chamfered top-start corner */}
      <span
        aria-hidden
        className="absolute -top-1 right-[3%] text-gold"
        style={{ fontSize: "0.7rem" }}
      >
        ◆
      </span>
    </div>
  );
}
