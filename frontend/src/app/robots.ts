import type { MetadataRoute } from "next";

// Admin panel, savat va buyurtma sahifalari qidiruvga chiqmasin — /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/cart", "/order/"] },
    sitemap: "https://shavermaspb.com/sitemap.xml",
    host: "https://shavermaspb.com",
  };
}
