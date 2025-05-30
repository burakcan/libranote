import { DocumentService } from '@/services/document-service.js';
import { JWTService } from '@/services/jwt-service.js';
import { AuthService } from '@/services/auth-service.js';
import type { DocumentData } from '@/types/index.js';

export async function onStoreDocument(data: DocumentData): Promise<void> {
  // Skip keep-alive documents
  if (DocumentService.isKeepAliveDocument(data.documentName)) {
    return;
  }

  try {
    // Verify the token from context
    const payload = await JWTService.verifyToken(data.context.token);

    // Check if user still has access to the note
    const note = await AuthService.getEditableNote(data.documentName, payload.sub);

    if (!note) {
      throw new Error('User does not have access to this note');
    }

    // Save the document
    await DocumentService.saveDocument(data.documentName, data.document);
  } catch (error) {
    console.error('Failed to store document:', error);
    // We don't throw here to avoid crashing the server
  }
}

export async function onLoadDocument(data: DocumentData): Promise<import('yjs').Doc> {
  // Skip keep-alive documents
  if (DocumentService.isKeepAliveDocument(data.documentName)) {
    return data.document;
  }

  try {
    // Load the document from storage
    // Authentication has already been verified in onAuthenticate
    return await DocumentService.loadDocument(data.documentName, data.document);
  } catch (error) {
    console.error('Failed to load document:', error);
    // Return the empty document if loading fails
    return data.document;
  }
}
