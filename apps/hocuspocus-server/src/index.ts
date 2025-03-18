import { Server } from '@hocuspocus/server';
import jwt from 'jsonwebtoken';

const DEFAULT_PORT = 3001;

const server = Server.configure({
  port: DEFAULT_PORT,
  onAuthenticate: async (socket) => {
    const decoded = jwt.verify(socket.token, process.env.HOCUSPOCUS_WEBSOCKET_SECRET!) as {
      userId: string;
    };

    if (!decoded || !decoded.userId) {
      throw new Error('Invalid token');
    }

    // const user = await prisma.user.findUnique({
    //   where: {
    //     id: decoded.userId,
    //   },
    // });

    // if (!user) {
    //   throw new Error('User not found');
    // }

    // console.log('User authenticated:', user);

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
