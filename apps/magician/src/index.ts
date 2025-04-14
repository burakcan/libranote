import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
// import * as jose from 'jose';

export * from '@repo/db';
import { PrismaClient } from '@repo/db';

export const prisma: PrismaClient = new PrismaClient();

const DEFAULT_PORT = 3001;

// const JWKS = jose.createRemoteJWKSet(new URL(process.env.JWKS_URL as string));

const server = Server.configure({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT,
  onAuthenticate: async (socket) => {
    console.info(`Authenticated: ${socket.documentName} - ${socket.token}`);

    console.log('Documents size: ', server.documents.size);
    console.log('Total connections: ', server.getConnectionsCount());
    // const { payload } = await jose.jwtVerify(socket.token, JWKS);
    // if (!payload || !payload.sub) {
    //   throw new Error('Invalid token');
    // }
    // // TODO: Check if user has access to the document
    // console.info(`Authenticated: ${socket.documentName} - ${payload.sub}`);
    // return true;
    return true;
  },

  async onStoreDocument(data) {
    if (data.documentName === 'keep-alive') {
      return;
    }

    const update = Y.encodeStateAsUpdateV2(data.document);

    console.info(`Storing document: ${data.documentName}`);

    await prisma.noteYDocState.upsert({
      where: {
        id: data.documentName,
      },
      update: { encodedDoc: update },
      create: {
        id: data.documentName,
        noteId: data.documentName,
        encodedDoc: update,
      },
    });

    console.log('Notifying the sse webhook', data.documentName);

    await fetch(process.env.SSE_WEBHOOK_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          type: 'NOTE_YDOC_STATE_UPDATED',
          noteId: data.documentName,
        },
      }),
    });
  },

  async onLoadDocument(data) {
    const yDocState = await prisma.noteYDocState.findUnique({
      where: {
        id: data.documentName,
      },
      select: {
        encodedDoc: true,
      },
    });

    const update = yDocState?.encodedDoc;

    if (update?.length) {
      Y.applyUpdateV2(data.document, update);
    }

    return data.document;
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
