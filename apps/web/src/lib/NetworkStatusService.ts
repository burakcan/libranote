export const ONLINE_EVENT = "networkStatusChange:online";
export const OFFLINE_EVENT = "networkStatusChange:offline";

let instance: NetworkStatusService | null = null;

export class NetworkStatusService extends EventTarget {
  private static isOnline = false;

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
  }

  private async checkNetworkStatus(): Promise<void> {
    // navigator.online is reliable when it's false.
    // But true doesn't always mean the network is available.
    // So we need to check the network status by fetching a public API.

    if (navigator.onLine === false) {
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
    if (NetworkStatusService.isOnline) {
      return;
    }

    console.debug("NetworkStatusService: Online");
    NetworkStatusService.isOnline = true;
    this.dispatchEvent(new Event(ONLINE_EVENT, { bubbles: true }));
  }

  private triggerOffline(): void {
    if (!NetworkStatusService.isOnline) {
      return;
    }

    console.debug("NetworkStatusService: Offline");
    NetworkStatusService.isOnline = false;
    this.dispatchEvent(new Event(OFFLINE_EVENT, { bubbles: true }));
  }

  public triggerUpdate(): void {
    this.checkNetworkStatus();
  }

  public getIsOnline(): boolean {
    return NetworkStatusService.isOnline;
  }

  public addEventListener(event: string, callback: () => void): void {
    super.addEventListener(event, callback);
  }

  public removeEventListener(event: string, callback: () => void): void {
    super.removeEventListener(event, callback);
  }
}
