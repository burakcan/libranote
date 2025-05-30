import { JWTService } from '@/services/jwt-service.js';
import { AuthService } from '@/services/auth-service.js';

export async function onAuthenticate(socket: {
  token: string;
  documentName: string;
  context: Record<string, unknown>;
}): Promise<boolean | { userId: string; user: unknown }> {
  // Handle keep-alive connections
  if (JWTService.isKeepAliveToken(socket.token)) {
    return true;
  }

  console.info(`Authenticating: ${socket.documentName} - ${socket.token}`);

  try {
    // Verify the JWT token
    const payload = await JWTService.verifyToken(socket.token);

    // Store token and user context
    socket.context.token = socket.token;
    socket.context.userId = payload.sub;

    // Check if user has access to the note
    const note = await AuthService.getEditableNote(socket.documentName, payload.sub);

    if (!note) {
      throw new Error('User does not have access to this note');
    }

    console.info(`Authenticated: ${socket.documentName} - User: ${payload.sub}`);

    return {
      userId: payload.sub,
      user: payload,
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
