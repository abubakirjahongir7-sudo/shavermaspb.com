// Admin panelga ochilgan barcha SSE ulanishlar (bir nechta qurilma bir
// vaqtda ochiq bo'lishi mumkin — har biriga alohida push yuboriladi).
const clients = new Set();

export function addSseClient(res) {
  clients.add(res);
}

export function removeSseClient(res) {
  clients.delete(res);
}

/**
 * Yangi buyurtma kelganda barcha ochiq admin panel ulanishlariga
 * "yangilan" signalini yuboradi. Panel signal olgach o'zi
 * /api/admin/orders'dan to'liq ro'yxatni qayta so'raydi — shuning
 * uchun bu yerda buyurtmaning o'zi emas, faqat signal yetarli.
 */
export function broadcastNewOrder(order) {
  const payload = `event: new-order\ndata: ${JSON.stringify({ orderId: order.id })}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      removeSseClient(res);
    }
  }
}

export function clientCount() {
  return clients.size;
}
