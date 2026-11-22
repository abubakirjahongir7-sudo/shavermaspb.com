// Javob qaytarilgandan keyin ham davom etadigan ishlar (masalan push yuborish).
// Doimiy serverda (Docker/Selectel) ular o'zi tugaydi. Serverless'da (Netlify)
// esa funksiya javobdan keyin muzlatiladi — shuning uchun adapter javobni
// qaytarishdan oldin waitForBackgroundTasks() bilan ularni kutadi.
const pending = new Set();

export function runInBackground(promise) {
  pending.add(promise);
  promise.then(
    () => pending.delete(promise),
    () => pending.delete(promise)
  );
  return promise;
}

export async function waitForBackgroundTasks() {
  while (pending.size > 0) {
    await Promise.allSettled([...pending]);
  }
}
