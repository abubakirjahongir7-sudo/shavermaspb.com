// Juda oddiy service worker — hech narsani keshlamaydi (menyu/narxlar
// tez-tez o'zgarishi mumkin, eski keshni ko'rsatib qo'yish xavfi bo'lmasin).
// "fetch" hodisasini ushlab turadi — ba'zi brauzerlar (Chrome/Android)
// PWA'ni "o'rnatish mumkin" deb hisoblashi uchun shu yetarli.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Hech narsa qilmaymiz — so'rov brauzerning o'zi tomonidan, tarmoqdan
  // odatdagidek bajariladi.
});

// Web Push: adminga — yangi buyurtma, mijozga — buyurtmasi holati
// ("Принят", "Готов"). Ilova yopiq yoki telefon uyquda bo'lsa ham tizim
// bildirishnomasi ko'rsatiladi.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "🆕 Новый заказ";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag,
      // Bir nechta buyurtma ketma-ket kelsa ham har biri qayta ovoz/tebranish bersin.
      renotify: Boolean(data.tag),
      // Admin "Принять" qilmaguncha bildirishnoma o'z-o'zidan yo'qolmasin.
      requireInteraction: true,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [300, 150, 300, 150, 300],
      data: { url: data.url || "/" },
    })
  );
});

// Bildirishnoma bosilganda — tegishli sahifani (admin panel yoki mijozning
// buyurtma sahifasi) ochamiz; ochiq bo'lsa, o'sha oynaga o'tamiz.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const target = new URL(url, self.location.origin).href;
      for (const client of windows) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
