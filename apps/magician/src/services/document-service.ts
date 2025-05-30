import * as Y from 'yjs';
import { prisma } from '@/services/prisma.js';
import { env } from '@/env.js';
import type { SSEWebhookPayload } from '@/types/index.js';

export class DocumentService {
  /**
   * Save a Y.js document to the database
   */
  static async saveDocument(documentName: string, document: Y.Doc): Promise<void> {
    try {
      const update = Y.encodeStateAsUpdateV2(document);

      console.info(`Storing document: ${documentName}`);

      await prisma.noteYDocState.upsert({
        where: {
          id: documentName,
        },
        update: { encodedDoc: update },
        create: {
          id: documentName,
          noteId: documentName,
          encodedDoc: update,
        },
      });

      // Notify SSE webhook about the document update
      await this.notifySSEWebhook(documentName);
    } catch (error) {
      console.error('Failed to store document:', error);
      throw error;
    }
  }

  /**
   * Load a Y.js document from the database
   */
  static async loadDocument(documentName: string, document: Y.Doc): Promise<Y.Doc> {
    try {
      const yDocState = await prisma.noteYDocState.findUnique({
        where: {
          id: documentName,
        },
        select: {
          encodedDoc: true,
        },
      });

      const update = yDocState?.encodedDoc;

      if (update?.length) {
        Y.applyUpdateV2(document, update);
      }

      return document;
    } catch (error) {
      console.error('Failed to load document:', error);
      throw error;
    }
  }

  /**
   * Notify the SSE webhook about document updates
   */
  private static async notifySSEWebhook(documentName: string): Promise<void> {
    try {
      console.log('Notifying the SSE webhook:', documentName);

      const payload: SSEWebhookPayload = {
        event: {
          type: 'NOTE_YDOC_STATE_UPDATED',
          noteId: documentName,
        },
      };

      await fetch(env.SSE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to notify SSE webhook:', error);
      // Don't throw here as this is not critical for document saving
    }
  }

  /**
   * Check if a document name is the keep-alive document
   */
  static isKeepAliveDocument(documentName: string): boolean {
    return documentName === 'keep-alive';
  }
}
