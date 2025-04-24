import { WebSocketStatus } from "@hocuspocus/provider";
import { keepAliveProvider } from "@/hooks/useColllaborativeNoteYDoc";

export const ONLINE_EVENT = "online";
export const OFFLINE_EVENT = "offline";

export type NetworkStatusServiceEvent =
  | typeof ONLINE_EVENT
  | typeof OFFLINE_EVENT;

let instance: NetworkStatusService | null = null;

export class NetworkStatusService extends EventTarget {
  private isOnline = false;

  constructor() {
    super();

    if (instance) {
      return instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;

    this.checkNetworkStatus();
    this.watchOnlineStatus();
  }

  private watchOnlineStatus() {
    window.addEventListener("online", () => {
      this.triggerUpdate();
    });

    window.addEventListener("offline", () => {
      this.triggerUpdate();
    });

    keepAliveProvider.on("status", () => {
      this.triggerUpdate();
    });
  }

  private async checkNetworkStatus(): Promise<void> {
    // navigator.online is reliable when it's false.
    // But true doesn't always mean the network is available.
    // So we need to check the network status by fetching a public API.

    if (navigator.onLine === false) {
      this.triggerOffline();
      return;
    }

    if (keepAliveProvider.status !== WebSocketStatus.Connected) {
      this.triggerOffline();
      return;
    }

    console.debug("NetworkStatusService: Checking network status");

    const abortController = new AbortController();

    try {
      await fetch(import.meta.env.VITE_NETWORK_CHECK_URL, {
        signal: abortController.signal,
      });

      this.triggerOnline();
    } catch (error) {
      console.error(
        "NetworkStatusService: Error checking network status",
        error
      );

      this.triggerOffline();
    } finally {
      abortController.abort("Network check aborted");
    }
  }

  private triggerOnline(): void {
    if (this.isOnline) {
      return;
    }

    console.debug("NetworkStatusService: Online");

    if (keepAliveProvider.status !== WebSocketStatus.Connected) {
      keepAliveProvider.connect();
    }

    this.isOnline = true;
    this.dispatchEvent(new Event(ONLINE_EVENT, { bubbles: true }));
  }

  private triggerOffline(): void {
    if (!this.isOnline) {
      return;
    }

    console.debug("NetworkStatusService: Offline");
    this.isOnline = false;
    this.dispatchEvent(new Event(OFFLINE_EVENT, { bubbles: true }));

    setTimeout(() => {
      this.checkNetworkStatus();
    }, 5000);
  }

  public triggerUpdate(): void {
    this.checkNetworkStatus();
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public addEventListener(
    event: NetworkStatusServiceEvent,
    callback: () => void
  ): void {
    super.addEventListener(event, callback);
  }

  public removeEventListener(
    event: NetworkStatusServiceEvent,
    callback: () => void
  ): void {
    super.removeEventListener(event, callback);
  }
}
