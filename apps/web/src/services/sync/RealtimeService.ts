import { ErrorService, NetworkError } from "@/lib/errors";
import { SSEEvent } from "@/types/SSE";

export const REALTIME_CONNECTED_EVENT = "realtime:connected";
export const REALTIME_DISCONNECTED_EVENT = "realtime:disconnected";
export const REALTIME_MESSAGE_EVENT = "realtime:message";
export const REALTIME_ERROR_EVENT = "realtime:error";

export class RealtimeService extends EventTarget {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(private clientId: string) {
    super();
  }

  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      return; // Already connected
    }

    this.disconnect(); // Clean up any existing connection

    try {
      this.eventSource = new EventSource(
        `${import.meta.env.VITE_API_URL}/api/sse?clientId=${this.clientId}`,
        { withCredentials: true }
      );

      this.setupEventListeners();
    } catch (error) {
      this.handleError(error);
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.dispatchEvent(new CustomEvent(REALTIME_DISCONNECTED_EVENT));
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  private setupEventListeners(): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      console.log("RealtimeService: Connected to SSE");
      this.reconnectAttempts = 0;
      this.dispatchEvent(new CustomEvent(REALTIME_CONNECTED_EVENT));
    };

    this.eventSource.onmessage = (event) => {
      try {
        const sseEvent = JSON.parse(event.data) as SSEEvent;
        this.dispatchEvent(
          new CustomEvent(REALTIME_MESSAGE_EVENT, { detail: sseEvent })
        );
      } catch (error) {
        this.handleError(error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("RealtimeService: SSE error", error);
      this.handleError(error);
      this.handleReconnection();
    };
  }

  private handleError(error: unknown): void {
    const appError = ErrorService.handle(error);
    const networkError = new NetworkError(
      `Real-time connection error: ${appError.message}`,
      appError
    );

    this.dispatchEvent(
      new CustomEvent(REALTIME_ERROR_EVENT, { detail: networkError })
    );
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("RealtimeService: Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `RealtimeService: Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
  }

  private removeAllListeners(): void {
    // Since EventTarget doesn't have a built-in way to get all listeners,
    // we'll rely on the caller to properly remove their listeners
    // This method is here for future enhancement if needed
  }
}
