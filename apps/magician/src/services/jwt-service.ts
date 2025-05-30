import * as jose from 'jose';
import { URL } from 'url';
import { env } from '@/env.js';
import type { JWTPayload } from '@/types/index.js';

export class JWTService {
  private static jwks: ReturnType<typeof jose.createRemoteJWKSet>;

  static {
    this.jwks = jose.createRemoteJWKSet(new URL(env.JWKS_URL));
  }

  /**
   * Verify a JWT token and return the payload
   */
  static async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jose.jwtVerify(token, this.jwks);

      if (!payload || !payload.sub) {
        throw new Error('Invalid token payload');
      }

      return payload as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Check if a token is the keep-alive token
   */
  static isKeepAliveToken(token: string): boolean {
    return token === 'keep-alive';
  }
}
