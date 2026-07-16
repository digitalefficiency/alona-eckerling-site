// Conceptual infographic for היטל השבחה: the levy is 50% of the betterment
// (the rise in value created by approving a plan). Real statutory concept — NO
// fabricated shekel figures. RTL: "before" on the right, "after" on the left.
export function LevyDiagram() {
  return (
    <figure className="my-10">
      <div className="rounded-[10px] border border-line bg-sand/50 p-6 md:p-9">
        <svg viewBox="0 0 520 300" className="w-full" role="img" aria-label="היטל ההשבחה הוא מחצית מעליית השווי שנוצרה בעקבות אישור התכנית">
          {/* baseline */}
          <line x1="40" y1="232" x2="480" y2="232" stroke="var(--color-line)" strokeWidth="1.5" />

          {/* AFTER bar (left) — taller; top delta in gold */}
          <rect x="110" y="120" width="110" height="112" fill="var(--color-navy)" />
          <rect x="110" y="70" width="110" height="50" fill="var(--color-gold)" />
          <text x="165" y="255" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-navy)">שווי אחרי</text>
          <text x="165" y="274" textAnchor="middle" fontSize="12" fill="var(--color-muted)">(לפי התכנית)</text>

          {/* BEFORE bar (right) — shorter */}
          <rect x="300" y="120" width="110" height="112" fill="var(--color-navy-700)" opacity="0.55" />
          <text x="355" y="255" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-navy)">שווי לפני</text>

          {/* betterment bracket on the gold delta */}
          <line x1="232" y1="70" x2="252" y2="70" stroke="var(--color-gold-dark)" strokeWidth="1.5" />
          <line x1="232" y1="120" x2="252" y2="120" stroke="var(--color-gold-dark)" strokeWidth="1.5" />
          <line x1="248" y1="70" x2="248" y2="120" stroke="var(--color-gold-dark)" strokeWidth="1.5" />
          <text x="258" y="92" textAnchor="start" fontSize="14" fontWeight="700" fill="var(--color-gold-ink)">ההשבחה</text>
          <text x="258" y="110" textAnchor="start" fontSize="11" fill="var(--color-muted)">עליית השווי</text>

          {/* result line */}
          <text x="260" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--color-navy)">
            ההיטל = 50% מההשבחה
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted">
        <span className="text-[0.55rem] leading-none text-gold-ink" aria-hidden>◆</span>
        המחשה מושגית — היטל ההשבחה הוא מחצית מעליית השווי שנוצרה עקב אישור התכנית. אינו ייעוץ או חישוב למקרה ספציפי.
      </figcaption>
    </figure>
  );
}
