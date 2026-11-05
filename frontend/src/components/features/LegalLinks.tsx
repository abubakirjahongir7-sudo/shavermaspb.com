import Link from "next/link";
import { publishedLegalDocs } from "@/data/legal";
import styles from "./LegalLinks.module.css";

/** Hujjatlarga havolalar. Birorta hujjat chop etilmagan bo'lsa, hech narsa ko'rsatilmaydi. */
export function LegalLinks({ withBottomNav = false }: { withBottomNav?: boolean }) {
  const docs = publishedLegalDocs();
  if (!docs.length) return null;

  return (
    <nav className={`${styles.links} ${withBottomNav ? styles.withBottomNav : ""}`} aria-label="Документы">
      {docs.map((doc) => (
        <Link key={doc.slug} href={`/legal/${doc.slug}`} className={styles.link}>
          {doc.title}
        </Link>
      ))}
    </nav>
  );
}
