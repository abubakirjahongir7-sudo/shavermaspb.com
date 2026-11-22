// Yandex Доставка kuryer holatlarini har daqiqada yangilaydi (doimiy
// serverdagi 10 soniyalik setInterval o'rniga). Kuryer sozlanmagan bo'lsa
// hech narsa qilmaydi.
import { syncCouriersOnce } from "../../src/serverless.js";

export default async () => {
  await syncCouriersOnce();
};

export const config = {
  schedule: "* * * * *",
};
