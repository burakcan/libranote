import { Server } from '@hocuspocus/server';
import { env } from '@/env.js';
import { Logger } from '@/utils/logger.js';
import { onAuthenticate } from '@/hooks/authentication.js';
import { onStoreDocument, onLoadDocument } from '@/hooks/document.js';

export function createServer(): ReturnType<typeof Server.configure> {
  Logger.info(`Creating Hocuspocus server for ${env.NODE_ENV} environment`);

  const server = Server.configure({
    port: env.PORT,

    // Authentication hook
    onAuthenticate,

    // Document hooks
    onStoreDocument,
    onLoadDocument,

    // Connection hooks
    async onConnect(data) {
      Logger.server(`New connection to document: ${data.documentName}`);
      Logger.debug(`Socket ID: ${data.socketId}`);
    },

    async onDisconnect(data) {
      Logger.server(`Disconnected from document: ${data.documentName}`);
      Logger.debug(`Remaining connections: ${data.clientsCount}`);
    },

    // Server lifecycle hooks
    async onListen(data) {
      Logger.server(`Hocuspocus server started on port ${data.port}`);
      Logger.debug(`Documents: ${server.documents.size}`);
      Logger.debug(`Total connections: ${server.getConnectionsCount()}`);
    },

    async onDestroy() {
      Logger.server('Hocuspocus server destroyed');
    },
  });

  return server;
}
