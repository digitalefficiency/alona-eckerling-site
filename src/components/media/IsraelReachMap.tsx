// ============================================================================
// IsraelReachMap — the contact page's "where" panel (plan section 37):
// a STYLIZED, fully SSR-drawn map of Israel in palette tones. Ivory landmass
// on the blush band, warm-hairline coastline, a garden-sage area-pin over the
// Ra'anana region and a sage-wash radiance blooming from that anchor across
// the whole country — the visual sentence "rooted in one real place, reaching
// everywhere". Deliberately NOT a Google-Maps/satellite embed (YMYL pixel
// rules: no third-party chrome, no readable branding, no exact street
// address). Decorative by contract: the adjacent copy carries the meaning, so
// the whole drawing is aria-hidden. Zero JS, zero raster — static twin by
// construction.
// ============================================================================

export function IsraelReachMap({ className = "" }: { className?: string }) {
  // Ra'anana sits on the central coastal plain — the pin's userSpace anchor.
  const pin = { x: 72, y: 150 };
  return (
    <svg
      viewBox="0 0 240 460"
      aria-hidden
      // מרוסן במובייל (240px → ~460px גובה) — איור דקורטיבי לא גוזל מסך שלם בטור-יחיד
      className={`mx-auto h-auto w-full max-w-[240px] md:max-w-[400px] ${className}`}
      fill="none"
    >
      <defs>
        <radialGradient
          id="contact-reach"
          gradientUnits="userSpaceOnUse"
          cx={pin.x}
          cy={pin.y}
          r={300}
        >
          <stop offset="0" style={{ stopColor: "var(--color-gold)", stopOpacity: 0.28 }} />
          <stop offset="0.55" style={{ stopColor: "var(--color-gold)", stopOpacity: 0.12 }} />
          <stop offset="1" style={{ stopColor: "var(--color-gold)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* היבשת — שנהב מורם עם קו-חוף hairline חם */}
      <path
        d="M118 8
           C132 14 142 26 144 42
           C146 60 138 74 140 92
           C142 112 150 132 152 156
           C154 182 148 204 142 224
           C138 240 132 262 128 286
           C124 314 120 348 114 386
           C111 412 109 430 106 448
           C104 430 98 404 92 378
           C84 340 76 300 72 262
           C68 232 62 204 58 178
           C56 158 58 138 62 118
           C66 98 74 78 84 60
           C90 46 100 30 108 18
           C111 13 114 10 118 8 Z"
        className="fill-card stroke-gold/45"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* הזוהר — "אונליין בכל הארץ" פורח מהעוגן אל כל המפה (סטטי, tone-on-tone) */}
      <path
        d="M118 8
           C132 14 142 26 144 42
           C146 60 138 74 140 92
           C142 112 150 132 152 156
           C154 182 148 204 142 224
           C138 240 132 262 128 286
           C124 314 120 348 114 386
           C111 412 109 430 106 448
           C104 430 98 404 92 378
           C84 340 76 300 72 262
           C68 232 62 204 58 178
           C56 158 58 138 62 118
           C66 98 74 78 84 60
           C90 46 100 30 108 18
           C111 13 114 10 118 8 Z"
        fill="url(#contact-reach)"
      />
      {/* טבעות-הישג שקטות סביב אזור רעננה */}
      <circle cx={pin.x} cy={pin.y} r="26" className="stroke-gold" strokeWidth="1.5" opacity="0.55" />
      <circle cx={pin.x} cy={pin.y} r="48" className="stroke-gold" strokeWidth="1.2" opacity="0.38" />
      <circle cx={pin.x} cy={pin.y} r="74" className="stroke-gold" strokeWidth="1" opacity="0.24" />
      {/* עוגן-האזור — כתם רך, לא נעץ-כתובת (רמת-עיר בלבד) */}
      <circle cx={pin.x} cy={pin.y} r="13" className="fill-gold" opacity="0.3" />
      <circle cx={pin.x} cy={pin.y} r="5.5" className="fill-gold" />
      <circle cx={pin.x} cy={pin.y} r="2" className="fill-card" />
    </svg>
  );
}
