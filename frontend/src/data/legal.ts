export interface LegalDoc {
  slug: string;
  title: string;
  // Xatboshilar bo'sh qator bilan ajratiladi. Bo'sh matnli hujjat saytda ko'rinmaydi.
  body: string;
}

// Matnlarni kafe egasi beradi — hujjat shu yerga yozilgach, sahifa va havolalar o'zi chiqadi.
export const LEGAL_DOCS: LegalDoc[] = [
  { slug: "oferta", title: "Публичная оферта", body: "" },
  { slug: "refund", title: "Условия возврата денег", body: "" },
  { slug: "privacy", title: "Политика конфиденциальности", body: "" },
  { slug: "requisites", title: "Реквизиты", body: "" },
];

export function publishedLegalDocs(docs: LegalDoc[] = LEGAL_DOCS): LegalDoc[] {
  return docs.filter((doc) => doc.body.trim().length > 0);
}

export function findPublishedLegalDoc(slug: string, docs: LegalDoc[] = LEGAL_DOCS): LegalDoc | undefined {
  return publishedLegalDocs(docs).find((doc) => doc.slug === slug);
}
