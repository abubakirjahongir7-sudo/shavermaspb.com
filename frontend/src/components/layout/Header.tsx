import styles from "./Header.module.css";

const SUPPORT_URL = "https://t.me/slujbapoderjkabot";

/**
 * Multfilm uslubidagi so'z: bir xil matnning ustma-ust qo'yilgan qatlamlari —
 * tashqi sariq kontur, qora kontur (+ pastga "3D" soya), sariq-to'q sariq
 * gradient bilan to'ldirish va tepadagi oq yaltirash.
 */
function LogoWord({ text }: { text: string }) {
  return (
    <span className={styles.word} aria-hidden="true">
      <span className={styles.layerOuter}>{text}</span>
      <span className={styles.layerStroke}>{text}</span>
      <span className={styles.layerFill}>{text}</span>
      <span className={styles.layerShine}>{text}</span>
    </span>
  );
}

const SWOOSH_PATH = "M6 15 C 50 4, 120 2, 174 6 C 122 10, 60 14, 10 20 Z";

/** So'z ostidagi egilgan, uchi ingichkalashgan chiziq. */
function Swoosh({ className }: { className: string }) {
  return (
    <svg
      className={`${styles.swoosh} ${className}`}
      viewBox="0 0 180 26"
      aria-hidden="true"
    >
      {/* Tashqi sariq kontur, qora kontur, keyin asosiy rang — harflar bilan bir xil */}
      <path d={SWOOSH_PATH} fill="#FFC21A" stroke="#FFC21A" strokeWidth="9" strokeLinejoin="round" />
      <path d={SWOOSH_PATH} fill="#1A0E00" stroke="#1A0E00" strokeWidth="4.5" strokeLinejoin="round" />
      <path d={SWOOSH_PATH} fill="#FFB21E" />
    </svg>
  );
}

export function Header({ showSupport = true }: { showSupport?: boolean }) {
  return (
    <header className={styles.header}>
      {showSupport && (
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.supportBtn}
          aria-label="Служба поддержки"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            <path d="M19 21a4 4 0 0 1-4 3" />
          </svg>
        </a>
      )}

      <h1 className={styles.logo} aria-label="Шаверма СПБ">
        <LogoWord text="ШАВЕРМА" />
        <Swoosh className={styles.swooshTop} />
        <span className={styles.logoSecondLine}>
          <LogoWord text="СПБ" />
        </span>
        <Swoosh className={styles.swooshBottom} />
      </h1>
    </header>
  );
}
