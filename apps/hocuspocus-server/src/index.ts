import { Server } from '@hocuspocus/server';
import * as jose from 'jose';

const DEFAULT_PORT = 3001;

// eslint-disable-next-line no-undef
const JWKS = jose.createRemoteJWKSet(new URL(process.env.JWKS_URL as string));

const server = Server.configure({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT,
  onAuthenticate: async (socket) => {
    const { payload } = await jose.jwtVerify(socket.token, JWKS);

    if (!payload || !payload.sub) {
      throw new Error('Invalid token');
    }

    // TODO: Check if user has access to the document

    console.info(`Authenticated: ${socket.documentName} - ${payload.sub}`);

    return true;
  },
});

async function startServer(): Promise<void> {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;

    // Start the server
    await server.listen();
    console.info(`Hocuspocus server started on port ${port}`);

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.info('SIGTERM received. Shutting down gracefully...');
      await server.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.info('SIGINT received. Shutting down gracefully...');
      await server.destroy();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
