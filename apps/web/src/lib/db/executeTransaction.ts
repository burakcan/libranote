import { prisma } from "./prisma";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function executeTransaction<T>(
  callback: (tx: Tx) => Promise<T>,
  errorMessage: string = "Transaction failed"
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      return await callback(tx);
    });
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function createId() {
  return crypto.randomUUID();
}
