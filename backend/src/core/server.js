import express from "express";
import cors from "cors";
import { getCheckoutConfigHandler, quoteDeliveryHandler } from "../controllers/deliveryController.js";
import { yookassaWebhookHandler } from "../controllers/paymentController.js";
import { requestCourierHandler, cancelCourierHandler } from "../controllers/courierController.js";
import { adminAuth, safeEqual } from "../middlewares/adminAuth.middleware.js";
import { config } from "../config/default.js";
import {
  createOrderHandler,
  getTrackedOrderHandler,
  subscribeOrderPushHandler,
  listOrdersHandler,
  updateOrderStatusHandler,
} from "../controllers/orderApiController.js";
import {
  getStopListHandler,
  addStopHandler,
  removeStopHandler,
} from "../controllers/stopListController.js";
import {
  getPushPublicKeyHandler,
  subscribePushHandler,
  unsubscribePushHandler,
} from "../controllers/pushController.js";
import { logger } from "../utils/logger.js";
import { addSseClient, removeSseClient } from "./sseClients.js";

// Faqat frontend (PWA) domenidan kelgan so'rovlarga ruxsat beriladi.
// Lokal development uchun localhost'lar ham qo'shib qo'yilgan.
const ALLOWED_ORIGINS = [config.frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"].filter(
  Boolean
);

const corsOptions = {
  origin(origin, callback) {
    // origin bo'lmasa (masalan curl, server-to-server so'rov) — ruxsat beriladi.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    logger.error(`CORS: ruxsat etilmagan origin bloklandi: ${origin}`);
    return callback(new Error("CORS: ruxsat etilmagan origin"));
  },
};

/** PWA'dan buyurtma qabul qilish va admin panel uchun HTTP server. */
export function createServer() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.get("/api/checkout/config", getCheckoutConfigHandler);
  app.post("/api/delivery/quote", quoteDeliveryHandler);
  app.post("/api/payments/yookassa", yookassaWebhookHandler);

  app.post("/api/orders", createOrderHandler);
  // Mijoz o'z buyurtmasi holatini kuzatishi va holat o'zgarganda push
  // olishi uchun — buyurtmada berilgan maxfiy token bilan himoyalangan.
  app.get("/api/orders/:id", getTrackedOrderHandler);
  app.post("/api/orders/:id/push", subscribeOrderPushHandler);

  // VAPID ochiq kaliti — nomidan ko'rinib turibdiki maxfiy emas; admin
  // ham, mijoz ham push'ga obuna bo'lishda shundan foydalanadi.
  app.get("/api/push/public-key", getPushPublicKeyHandler);

  // Qaysi mahsulotlar hozir "stop"da (tugab qolgan) — PWA menyusi shuni
  // o'qib, ranssiz va bloklangan qilib ko'rsatadi. Ochiq (auth'siz)
  // endpoint, chunki buni har bir mijoz ko'rishi kerak.
  app.get("/api/stop-list", getStopListHandler);
  app.post("/api/admin/stop-list/:cafeId/:itemId", adminAuth, addStopHandler);
  app.delete("/api/admin/stop-list/:cafeId/:itemId", adminAuth, removeStopHandler);

  app.get("/api/admin/orders", adminAuth, listOrdersHandler);
  app.patch("/api/admin/orders/:id", adminAuth, updateOrderStatusHandler);
  app.post("/api/admin/orders/:id/courier", adminAuth, requestCourierHandler);
  app.post("/api/admin/orders/:id/courier/cancel", adminAuth, cancelCourierHandler);

  // Web Push: admin PWA telefon uyquda bo'lsa ham yangi buyurtma haqida
  // bildirishnoma olishi uchun qurilma obunasi.
  app.post("/api/admin/push/subscribe", adminAuth, subscribePushHandler);
  app.post("/api/admin/push/unsubscribe", adminAuth, unsubscribePushHandler);

  // Admin panelga real-vaqtda "yangi buyurtma bor" signali yuborish uchun.
  // EventSource maxsus header qo'sholmaydi, shuning uchun parol query
  // parametri sifatida keladi (Authorization header o'rniga).
  app.get("/api/admin/orders/stream", (req, res) => {
    if (!config.adminPassword || !safeEqual(String(req.query.token ?? ""), config.adminPassword)) {
      return res.status(401).end();
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write("\n");

    addSseClient(res);

    // Ba'zi proksi/CDN'lar uzoq davom etadigan ulanishni o'zi yopib
    // qo'yishi mumkin — buni oldini olish uchun davriy "ping" yuboriladi.
    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeSseClient(res);
    });
  });

  return app;
}
