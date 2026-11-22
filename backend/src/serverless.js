// Netlify Functions uchun adapter. Express ilovasining o'zi o'zgarmaydi:
// funksiya ichida u lokal portda ishga tushadi va kelgan so'rov shunga
// uzatiladi. Selectel/Docker'da esa avvalgidek src/index.js ishlatiladi.
process.env.SERVERLESS = "1";

let serverPromise;

async function getServerUrl() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const { createServer } = await import("./core/server.js");
      const app = createServer();
      return new Promise((resolve, reject) => {
        const server = app.listen(0, "127.0.0.1", () => {
          resolve(`http://127.0.0.1:${server.address().port}`);
        });
        server.on("error", reject);
      });
    })().catch((error) => {
      serverPromise = undefined;
      throw error;
    });
  }
  return serverPromise;
}

const HOP_BY_HOP = ["connection", "keep-alive", "transfer-encoding", "upgrade", "host", "content-length"];

/** Web standart Request -> Express -> Response. */
export async function handleRequest(request) {
  const base = await getServerUrl();
  const url = new URL(request.url);

  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  // Sayt va API bitta domenda — o'z saytidan kelgan so'rov CORS emas.
  // Shunda sayt shavermaspb.com'da ham, *.netlify.app'da ham ishlaydi.
  if (headers.get("origin") === url.origin) headers.delete("origin");

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(base + url.pathname + url.search, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const body = await upstream.arrayBuffer();

  // Push kabi javobdan keyingi ishlar tugashini kutamiz — aks holda
  // funksiya muzlatilib, bildirishnoma yuborilmay qoladi.
  const { waitForBackgroundTasks } = await import("./utils/backgroundTasks.js");
  await waitForBackgroundTasks();

  const responseHeaders = new Headers(upstream.headers);
  for (const name of HOP_BY_HOP) responseHeaders.delete(name);
  responseHeaders.delete("content-encoding");

  return new Response(upstream.status === 204 || request.method === "HEAD" ? null : body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

/** Yandex kuryer holatlarini yangilash (rejalashtirilgan funksiya chaqiradi). */
export async function syncCouriersOnce() {
  const { isCourierEnabled } = await import("./utils/yandexDelivery.js");
  if (!isCourierEnabled()) return { skipped: true };
  const { syncAllCouriers } = await import("./controllers/courierController.js");
  await syncAllCouriers();
  return { ok: true };
}
