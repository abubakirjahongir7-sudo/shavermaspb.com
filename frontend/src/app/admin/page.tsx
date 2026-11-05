import type { Metadata } from "next";
import { AdminPage } from "@/components/features/AdminPage";

// Alohida manifest — "Bosh ekranga qo'shish" qilinganda mijozlar menyusi
// emas, aynan shu admin panel alohida ilova sifatida o'rnatilsin (iPhone'da
// Web Push faqat o'rnatilgan PWA ichida ishlaydi).
export const metadata: Metadata = {
  title: "Админ · Гражданский пр., 39Б",
  manifest: "/manifest-admin.webmanifest",
  appleWebApp: { capable: true, title: "Админ", statusBarStyle: "black-translucent" },
};

// Hozircha bitta filial — admin panel shunga qulflangan.
export default function Admin() {
  return <AdminPage lockedCafeId="grazhdanskiy-39b" />;
}
