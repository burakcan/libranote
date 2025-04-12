export type WebhookEventType = "NOTE_UPDATED";

export interface NoteUpdatedWebhookEvent {
  type: "NOTE_UPDATED";
  noteId: string;
}

export type WebhookEvent = NoteUpdatedWebhookEvent;
