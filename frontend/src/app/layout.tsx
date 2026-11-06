import type { Metadata, Viewport } from "next";
import { Unbounded, Inter, Oswald, Rubik } from "next/font/google";
import { PwaRegister } from "@/components/layout/PwaRegister";
import "@/styles/globals.css";

// Shriftlarni o'zimizning saytimizdan (self-hosted) yuklaymiz — bu Google
// Fonts'ga tashqi so'rovga qaraganda ancha tezroq va ishonchli. Sekin
// internetda shrift hali yuklanmagan
// paytda brauzerning fallback kursiv shrifti bilan qalin kontur/soya
// birga chalkash ko'rinishga sabab bo'lardi — shuning uchun bu muhim.
const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
// "ШАВЕРМА" logotip yozuvi uchun — ultra-condensed, baland, tekis
// chiziqli Art Deco uslubidagi shrift (Oswald — 1920-30-yillardagi
// "Alternate Gothic" condensed harflaridan ilhomlangan, to'liq kirill
// qo'llab-quvvatlaydi).
const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-oswald",
  display: "swap",
});
// Header'dagi "ШАВЕРМА СПБ" multfilm uslubidagi logotip uchun —
// qalin, yumaloq burchakli, kirillni to'liq qo'llaydi.
const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["900"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shaverma SPB",
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
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${unbounded.variable} ${inter.variable} ${oswald.variable} ${rubik.variable}`}
    >
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
