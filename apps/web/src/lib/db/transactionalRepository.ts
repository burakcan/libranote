import { prisma } from "@/lib/prisma";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * A utility for executing database operations within transactions
 * with consistent error handling and response patterns.
 */
export class TransactionalRepository {
  /**
   * Executes a callback within a transaction and handles errors consistently
   */
  static async executeTransaction<T>(
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

  /**
   * Creates a UUID for database entities
   */
  static createId(): string {
    return crypto.randomUUID();
  }
}
