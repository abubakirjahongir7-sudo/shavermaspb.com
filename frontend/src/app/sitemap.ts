import type { MetadataRoute } from "next";
import { publishedLegalDocs } from "@/data/legal";

const SITE_URL = "https://shavermaspb.com";

// Qidiruv tizimlari (Yandex, Google) uchun sayt xaritasi — /sitemap.xml
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...publishedLegalDocs().map((doc) => ({
      url: `${SITE_URL}/legal/${doc.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
