import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

// Ilova bo'ylab bitta PrismaClient instansiyasi (connection pooling uchun).
export const prisma = new PrismaClient();

export async function connectDatabase() {
  await prisma.$connect();
  logger.info("Ma'lumotlar bazasiga ulandi (PostgreSQL / Prisma)");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
