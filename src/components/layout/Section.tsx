import { Container } from "@/components/layout/Container";
import { SectionSeam } from "@/components/layout/SectionSeam";

// A page band: tone background + standard vertical rhythm + optional hairline /
// drawn seam, wrapping a Container. The building block of the section rhythm
// (white ↔ sand ↔ navy). Server component (SectionSeam is the only client part).
const TONES = {
  white: "bg-card",
  sand: "bg-sand",
  navy: "bg-navy text-white",
} as const;

export function Section({
  tone = "white",
  pad = "normal",
  width = "wide",
  border = false,
  seam = false,
  id,
  className = "",
  containerClassName = "",
  children,
}: {
  tone?: keyof typeof TONES;
  pad?: "normal" | "tight";
  width?: "wide" | "standard" | "prose";
  border?: boolean;
  seam?: boolean;
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  const py = pad === "tight" ? "py-10 sm:py-12 md:py-16" : "py-16 sm:py-20 md:py-32";
  return (
    <section
      id={id}
      className={`${TONES[tone]} ${border ? "border-y border-line" : ""} ${className}`}
    >
      <Container width={width} className={`${py} ${containerClassName}`}>
        {seam && <SectionSeam className="mb-12" />}
        {children}
      </Container>
    </section>
  );
}
