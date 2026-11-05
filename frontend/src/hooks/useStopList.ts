"use client";

import { useEffect, useState } from "react";
import { fetchStopList } from "@/lib/api";

const POLL_INTERVAL_MS = 20_000;

/**
 * Berilgan filialda hozir "stop"da (tugagan) turgan mahsulot id'lari
 * to'plamini qaytaradi. Har bir filial alohida stop-listga ega — mijoz
 * filialni almashtirsa, ro'yxat ham shu zahoti o'sha filialnikiga
 * yangilanadi. Sahifa ochilganda yuklanadi va har 20 soniyada yangilanib
 * turadi — kafe egasi biror narsani stopga qo'ysa, mijoz ekraniga tez
 * orada (qayta yuklashsiz) aks etadi.
 */
export function useStopList(cafeId: string): Set<string> {
  const [stoppedIds, setStoppedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!cafeId) {
      setStoppedIds(new Set());
      return;
    }

    let cancelled = false;

    const load = async () => {
      const ids = await fetchStopList(cafeId);
      if (!cancelled) setStoppedIds(new Set(ids));
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cafeId]);

  return stoppedIds;
}
