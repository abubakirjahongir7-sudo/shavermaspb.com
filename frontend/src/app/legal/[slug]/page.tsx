import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findPublishedLegalDoc } from "@/data/legal";
import styles from "./page.module.css";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = findPublishedLegalDoc(slug);
  return { title: doc ? `${doc.title} — Shaverma SPB` : "Shaverma SPB" };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const doc = findPublishedLegalDoc(slug);
  if (!doc) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back} aria-label="В меню">
          ←
        </Link>
        <h1 className={styles.title}>{doc.title}</h1>
      </header>
      <div className={styles.body}>
        {doc.body
          .trim()
          .split(/\n\s*\n/)
          .map((paragraph, i) => (
            <p key={i} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
      </div>
    </div>
  );
}
