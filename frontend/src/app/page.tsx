import { Header } from "@/components/layout/Header";
import { CategoryTabs } from "@/components/layout/CategoryTabs";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { CartList } from "@/components/features/CartList";
import { LocationBar } from "@/components/features/LocationBar";
import { PromoCards } from "@/components/features/PromoCards";
import { InstallPwaBanner } from "@/components/features/InstallPwaBanner";
import { ActiveOrderBanner } from "@/components/features/ActiveOrderBanner";
import { LegalLinks } from "@/components/features/LegalLinks";

export default function HomePage() {
  return (
    <>
      <Header />
      <ActiveOrderBanner />
      <InstallPwaBanner />
      <LocationBar />
      <PromoCards />
      <CategoryTabs />
      <CartList />
      <LegalLinks withBottomNav />
      <BottomNavigation />
    </>
  );
}
