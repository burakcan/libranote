import { createServer } from '@/server.js';
import { Logger } from '@/utils/logger.js';
import { env } from '@/env.js';

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(
  signal: string,
  server: ReturnType<typeof createServer>,
): Promise<void> {
  Logger.server(`${signal} received. Shutting down gracefully...`);

  try {
    await server.destroy();
    Logger.server('Server destroyed successfully');
    process.exit(0);
  } catch (error) {
    Logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Main server startup function
 */
async function startServer(): Promise<void> {
  try {
    // Create and configure the server
    const server = createServer();

    // Setup graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION', server);
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled rejection:', { reason, promise });
      gracefulShutdown('UNHANDLED_REJECTION', server);
    });

    // Start the server
    await server.listen();

    Logger.server(`Magician collaboration server is ready!`);
    Logger.server(`Environment: ${env.NODE_ENV}`);
    Logger.server(`Port: ${env.PORT}`);
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  Logger.error('Unhandled error during startup:', error);
  process.exit(1);
});
