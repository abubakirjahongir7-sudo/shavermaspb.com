import { describe, it, expect } from "vitest";
import { menuItems as frontendItems } from "./menuItems";

/**
 * `backend/src/data/menuItems.js` narx/nom validatsiyasi uchun frontend
 * menyusining qisqartirilgan nusxasini o'zida saqlaydi (backend'ga
 * description/image kerak emas). Ikkalasi qo'lda sinxronlanadi — shu test
 * ularning id/category/price bo'yicha farq qilib qolishini (masalan
 * biriga yangi mahsulot qo'shilib, ikkinchisiga qo'shilishi unutilganda
 * yoki narx faqat bittasida o'zgartirilganda) darhol aniqlaydi.
 *
 * `name` uchun qat'iy tenglik talab qilinmaydi: frontend'da alohida
 * `weight` maydoni bo'lgan mahsulotlarda (masalan morslar) backend nomi
 * hajmni o'ziga qo'shib oladi ("Морс клюква 0,2 л") — chunki bot/admin
 * xabarlarida alohida vazn maydoni yo'q va aks holda ikki xil hajmdagi
 * bir xil nomli mahsulotlar buyurtmada farqlanmay qolardi.
 */
describe("menuItems <-> backend sync", () => {
  it("frontend va backend menyu ro'yxatlari bir xil mahsulotlarni o'z ichiga oladi", async () => {
    // @ts-expect-error - backend/ oddiy JS paket, frontend tsconfig'iga kirmaydi va tip e'lonlariga ega emas
    const backendModule = await import("../../../backend/src/data/menuItems.js");
    const backendItems = backendModule.menuItems as Array<{
      id: string;
      category: string;
      name: string;
      price: number;
    }>;

    const backendById = new Map(backendItems.map((item) => [item.id, item]));

    const frontendIds = frontendItems.map((item) => item.id).sort();
    const backendIds = backendItems.map((item) => item.id).sort();
    expect(backendIds).toEqual(frontendIds);

    for (const frontendItem of frontendItems) {
      const backendItem = backendById.get(frontendItem.id)!;

      expect(backendItem.category, `${frontendItem.id}: category`).toBe(frontendItem.category);
      expect(backendItem.price, `${frontendItem.id}: price`).toBe(frontendItem.price);

      if (frontendItem.weight) {
        // Vazn/hajm frontend'da alohida ko'rsatiladi — backend nomi shu
        // hajmni o'ziga qo'shib olishi mumkin, lekin asosiy nom bilan
        // boshlanishi shart (butunlay boshqa nom bo'lib qolmasligi uchun).
        expect(backendItem.name.startsWith(frontendItem.name), `${frontendItem.id}: name`).toBe(true);
      } else {
        expect(backendItem.name, `${frontendItem.id}: name`).toBe(frontendItem.name);
      }
    }
  });
});
