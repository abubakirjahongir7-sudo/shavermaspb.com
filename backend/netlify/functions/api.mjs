// Backend (backend/src) shu funksiya orqali Netlify'da ishlaydi:
// saytning /api/* so'rovlari to'g'ridan-to'g'ri Express ilovasiga boradi.
import { handleRequest } from "../../src/serverless.js";

export default async (request) => handleRequest(request);

export const config = {
  path: "/api/*",
};
