import { env } from '@/env.js';

export class Logger {
  private static isDevelopment = env.NODE_ENV === 'development';

  static info(message: string, ...args: unknown[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  static error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error);
  }

  static warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  static debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  static server(message: string, ...args: unknown[]): void {
    console.log(`[SERVER] ${message}`, ...args);
  }

  static auth(message: string, ...args: unknown[]): void {
    console.log(`[AUTH] ${message}`, ...args);
  }

  static document(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(`[DOC] ${message}`, ...args);
    }
  }
}
