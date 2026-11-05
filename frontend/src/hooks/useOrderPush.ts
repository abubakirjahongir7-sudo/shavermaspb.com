"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeOrderPush } from "@/lib/api";
import {
  detectInitialPushStatus,
  getExistingSubscription,
  requestPushSubscription,
  type PushStatus,
} from "@/lib/push";

/**
 * Mijoz qurilmasini bitta buyurtma holati bildirishnomalariga obuna
 * qiladi ("Принят", "Готов"...). Ruxsat avvalroq berilgan bo'lsa —
 * yangi buyurtmaga avtomatik obuna bo'ladi, qayta so'ralmaydi.
 */
export function useOrderPush(orderId: number, token: string) {
  const [status, setStatus] = useState<PushStatus>("loading");

  useEffect(() => {
    const initial = detectInitialPushStatus();
    if (initial !== "loading") {
      setStatus(initial);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const existing = await getExistingSubscription();
        if (existing) {
          await subscribeOrderPush(orderId, token, existing.toJSON());
          if (!cancelled) setStatus("on");
        } else if (!cancelled) {
          setStatus("off");
        }
      } catch {
        if (!cancelled) setStatus("off");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  const enable = useCallback(async () => {
    setStatus("loading");
    try {
      const subscription = await requestPushSubscription();
      if (subscription === "denied" || subscription === "off") {
        setStatus(subscription);
        return;
      }
      await subscribeOrderPush(orderId, token, subscription.toJSON());
      setStatus("on");
    } catch {
      setStatus("error");
    }
  }, [orderId, token]);

  return { status, enable };
}
