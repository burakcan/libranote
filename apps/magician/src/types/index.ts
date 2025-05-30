import type { Document } from '@hocuspocus/server';

export interface AuthenticatedSocket {
  documentName: string;
  token: string;
  context: {
    token: string;
    userId?: string;
  };
}

export interface DocumentData {
  documentName: string;
  document: Document;
  context: {
    token: string;
    userId?: string;
  };
}

export interface SSEWebhookPayload {
  event: {
    type: 'NOTE_YDOC_STATE_UPDATED';
    noteId: string;
  };
}

export interface JWTPayload {
  sub: string;
  userId?: string;
  iat?: number;
  exp?: number;
}
