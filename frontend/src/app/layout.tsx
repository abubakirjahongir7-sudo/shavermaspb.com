import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/layout/PwaRegister";
// Shriftlar npm paketidan olinadi va saytning o'zidan beriladi — build paytida
// Google Fonts'ga murojaat qilinmaydi (serverdan ulanish ishonchsiz edi).
// Har bir fayl harf to'plamlarini unicode-range bilan ajratadi — brauzer
// faqat sahifadagi harflar uchun kerakli qismni yuklaydi.
import "@fontsource/unbounded/600.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/unbounded/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
// "ШАВЕРМА" logotip yozuvi uchun — ultra-condensed Art Deco uslubidagi shrift.
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
// Header'dagi "ШАВЕРМА СПБ" multfilm uslubidagi logotip uchun.
import "@fontsource/rubik/900.css";
import "@/styles/globals.css";

const SITE_URL = "https://shavermaspb.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Shaverma SPB — шаверма в Санкт-Петербурге",
  description:
    "Шаверма, супы, горячие блюда и напитки. Закажите онлайн и заберите в кафе Shaverma SPB на Гражданском проспекте, 39Б.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Shaverma SPB",
    title: "Shaverma SPB — шаверма в Санкт-Петербурге",
    description: "Меню и онлайн-заказ — Shaverma SPB, Гражданский пр., 39Б.",
    locale: "ru_RU",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  // PWA: iPhone/Android'da "Bosh ekranga qo'shish" orqali ilova sifatida
  // o'rnatilishi uchun — manifest + apple-specific teglar.
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Shaverma SPB",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#A30000",
};

// iPhone Safari'dagi sahifa masshtabi (aA) kenglikni kichraytirib, kartalar va
// matnlarni buzadi. Telefonda shu masshtabni qaytarib, ilovani ekranga to'liq
// moslaymiz. Sahifa chizilishidan oldin ishlashi uchun <head> ichida turadi.
const FIT_PHONE_SCRIPT = `(function () {
  var root = document.documentElement;
  var isIphone = /iPhone|iPod/.test(navigator.userAgent);
  function fit() {
    var w = window.innerWidth;
    var small = Math.min(screen.width, screen.height);
    var base = w > window.innerHeight ? Math.max(screen.width, screen.height) : small;
    var ratio = w / base;
    // Eski Android brauzerlari screen'ni fizik pikselda beradi, bu masshtab emas.
    var physical = !isIphone && Math.abs(base / window.devicePixelRatio - w) < 2;
    var zoomed = small < 500 && !physical && ratio >= 0.4 && ratio < 0.9
      && window.matchMedia("(pointer: coarse)").matches;
    root.style.zoom = zoomed ? String(ratio) : "";
  }
  fit();
  window.addEventListener("resize", fit);
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Next.js'ning appleWebApp.capable maydoni negadir shu tegni
            chiqarmayapti — shu sabab qo'lda qo'shildi. Aynan shu teg
            bo'lmasa, iOS "Bosh ekranga qo'shish"dan keyin ham ilovani
            Safari manzil satri bilan ochadi (haqiqiy PWA rejimida emas). */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: FIT_PHONE_SCRIPT }} />
      </head>
      <body>
        <PwaRegister />
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
