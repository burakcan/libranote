export * from "@repo/db";
import { PrismaClient } from "@repo/db";

export const prisma: PrismaClient = new PrismaClient();
