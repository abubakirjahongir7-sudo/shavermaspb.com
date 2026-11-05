import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom HTMLMediaElement.play()/pause() ni implementatsiya qilmaydi
// ("Not implemented" xatosi tashlaydi) — <audio>/<video> ishlatadigan
// komponentlarni sinash uchun soxta (stub) qilib qo'yamiz.
if (typeof window !== "undefined") {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
}
