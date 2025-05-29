import { UseBoundStore, StoreApi } from "zustand";
import { ApiService } from "@/services/ApiService";
import { ErrorService, SyncError } from "@/lib/errors";
import { Store } from "@/lib/store";
import { ActionQueueItem } from "@/types/ActionQueue";
import { ISettingRepository } from "@/types/Repositories";
import { ClientUserSetting, ServerUserSetting } from "@/types/Settings";
import { SSEEvent } from "@/types/SSE";

export class SettingsSyncService extends EventTarget {
  constructor(
    private settingRepository: ISettingRepository,
    private store: UseBoundStore<StoreApi<Store>>
  ) {
    super();
  }

  async loadLocalSettingsToStore(): Promise<void> {
    const localSettings = await this.settingRepository.getAll();
    this.store.getState().settings.setSettingsData(localSettings);
    this.store.getState().settings.setInitialDataLoaded(true);

    console.debug(
      "SettingsSyncService: Loaded local settings to store",
      localSettings
    );
  }

  isSyncSettingsEnabled(): boolean {
    const syncSettingsEnabled =
      this.store
        .getState()
        .settings.data.find((s) => s.key === "sync.syncSettingsEnabled")
        ?.value ?? true;

    return syncSettingsEnabled;
  }

  async syncAllSettingsToLocal(): Promise<ServerUserSetting[]> {
    if (!this.isSyncSettingsEnabled()) {
      return [];
    }

    try {
      const remoteSettings = await ApiService.fetchAllSettings();

      // Sync remote settings to local DB and store
      await this.store
        .getState()
        .settings.syncRemoteSettingsToLocal(remoteSettings);

      return remoteSettings;
    } catch (error) {
      const appError = ErrorService.handle(error);
      throw new SyncError("Failed to sync all settings to local", appError);
    }
  }

  async processQueueItem(item: ActionQueueItem): Promise<void> {
    // Set status to processing
    this.store
      .getState()
      .actionQueue.setActionQueueItemStatus(item.id, "processing");

    switch (item.type) {
      case "UPDATE_SETTING":
        if (!this.isSyncSettingsEnabled()) {
          break;
        }
        await this.processUpdateSetting(item.relatedEntityId);
        break;
      case "SYNC_SETTINGS":
        await this.processSyncSettings();
        break;
    }

    // Remove from queue
    await this.store.getState().actionQueue.removeActionFromQueue(item.id);
  }

  private async syncUpdateSetting(
    key: string
  ): Promise<ServerUserSetting | undefined> {
    const localSetting = await this.settingRepository.getByKey(key);

    if (!localSetting) {
      console.error(`SettingsSyncService: Setting ${key} not found`);
      return;
    }

    const remoteSetting = await ApiService.updateSetting(localSetting);

    // Use store to swap local setting with remote setting
    await this.store
      .getState()
      .settings.swapSetting(localSetting.key, remoteSetting);

    return remoteSetting;
  }

  // Handle remote events
  async handleRemoteSettingUpdated(setting: ServerUserSetting): Promise<void> {
    if (!this.isSyncSettingsEnabled()) {
      return;
    }

    await this.store
      .getState()
      .settings.swapSetting(setting.key as ClientUserSetting["key"], setting);
  }

  // Handle SSE events (Redux-style dispatch to all services)
  async handleSSEEvent(event: SSEEvent): Promise<void> {
    switch (event.type) {
      case "SETTING_UPDATED":
        await this.handleRemoteSettingUpdated(event.payload);
        break;
      // Ignore all other events
    }
  }

  // Public methods for individual queue item processing
  async processUpdateSetting(
    key: string
  ): Promise<ServerUserSetting | undefined> {
    if (!this.isSyncSettingsEnabled()) {
      return undefined;
    }
    return this.syncUpdateSetting(key);
  }

  async processSyncSettings(): Promise<ServerUserSetting[]> {
    return this.syncAllSettingsToLocal();
  }
}
