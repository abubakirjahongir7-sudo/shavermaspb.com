"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeAdminPush } from "@/lib/api";
import {
  detectInitialPushStatus,
  getExistingSubscription,
  requestPushSubscription,
  type PushStatus,
} from "@/lib/push";

export type AdminPushStatus = PushStatus;

/**
 * Admin qurilmasini (telefon/planshet) shu filialning yangi buyurtma
 * push-bildirishnomalariga obuna qiladi — PWA yopiq yoki telefon uyquda
 * bo'lsa ham bildirishnoma keladi.
 */
export function useAdminPush(password: string | null, cafeId: string) {
  const [status, setStatus] = useState<PushStatus>("loading");

  // Ruxsat avvalroq berilgan bo'lsa — mavjud obunani serverga qayta
  // yuboramiz (filial bog'lanishi yangilansin, baza tozalangan bo'lsa ham tiklansin).
  useEffect(() => {
    const initial = detectInitialPushStatus();
    if (initial !== "loading") {
      setStatus(initial);
      return;
    }
    if (!password) return;

    let cancelled = false;
    (async () => {
      try {
        const existing = await getExistingSubscription();
        if (existing) {
          await subscribeAdminPush(password, existing.toJSON(), cafeId);
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
  }, [password, cafeId]);

  const enable = useCallback(async () => {
    if (!password) return;
    setStatus("loading");
    try {
      const subscription = await requestPushSubscription();
      if (subscription === "denied" || subscription === "off") {
        setStatus(subscription);
        return;
      }
      await subscribeAdminPush(password, subscription.toJSON(), cafeId);
      setStatus("on");
    } catch {
      setStatus("error");
    }
  }, [password, cafeId]);

  return { status, enable };
}
