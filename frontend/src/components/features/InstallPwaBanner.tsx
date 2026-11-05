"use client";

import { useEffect, useState } from "react";
import styles from "./InstallPwaBanner.module.css";

const DISMISS_KEY = "install_banner_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Saytni Bank/Sber ilovalari kabi "ilova sifatida o'rnatish" bannerini
 * ko'rsatadi — brauzerning o'zi (ayniqsa iOS'da) buni hech qachon o'zi
 * taklif qilmaydi, shuning uchun bu tugma orqali qadam-baqadam yo'l
 * ko'rsatiladi (Android'da esa haqiqiy native o'rnatish oynasi chaqiriladi).
 * Ilova allaqachon o'rnatilgan (standalone) bo'lsa umuman ko'rinmaydi.
 */
export function InstallPwaBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") dismiss();
      return;
    }
    // Android'da hali "beforeinstallprompt" kelmagan bo'lsa ham, iOS'da
    // esa u umuman bo'lmaydi — ikkalasida ham qadamlarni ko'rsatamiz.
    setShowIosSteps(true);
  };

  return (
    <>
      <button type="button" className={styles.banner} onClick={handleInstallClick}>
        <span className={styles.icon} aria-hidden="true">
          📲
        </span>
        <span className={styles.text}>
          <span className={styles.title}>Установить приложение</span>
          <span className={styles.subtitle}>Быстрый доступ с главного экрана</span>
        </span>
        <span
          className={styles.close}
          role="button"
          aria-label="Закрыть"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
        >
          ✕
        </span>
      </button>

      {showIosSteps && (
        <div className={styles.overlay} onClick={() => setShowIosSteps(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.sheetTitle}>Как установить</h2>
            {isIos() ? (
              <ol className={styles.steps}>
                <li>
                  Нажмите <strong>«Поделиться»</strong>{" "}
                  <span className={styles.shareIcon} aria-hidden="true">
                    ⬆️
                  </span>{" "}
                  внизу экрана Safari
                </li>
                <li>
                  Выберите <strong>«На экран «Домой»»</strong>
                </li>
                <li>
                  Нажмите <strong>«Добавить»</strong> в правом верхнем углу
                </li>
              </ol>
            ) : (
              <ol className={styles.steps}>
                <li>
                  Откройте меню браузера <strong>(⋮)</strong> в правом верхнем углу
                </li>
                <li>
                  Выберите <strong>«Установить приложение»</strong> или{" "}
                  <strong>«Добавить на главный экран»</strong>
                </li>
              </ol>
            )}
            <button
              type="button"
              className={styles.sheetClose}
              onClick={() => setShowIosSteps(false)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}
