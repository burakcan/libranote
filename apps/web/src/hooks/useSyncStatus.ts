import { useEffect, useState, useCallback } from "react";
import {
  SyncStatus,
  SyncOperation,
  SyncOperationType,
} from "@/services/sync/SyncStatusManager";
import { useSyncContext } from "./useSyncContext";

/**
 * Hook to access sync status with automatic subscription management
 */
export function useSyncStatus() {
  const { syncService } = useSyncContext();
  const [status, setStatus] = useState<SyncStatus>({
    isSynced: false,
    isIdle: true,
    isSyncing: false,
    hasError: false,
    operations: new Map(),
    errors: [],
  });

  useEffect(() => {
    if (!syncService) {
      return;
    }

    // Subscribe to status changes
    const unsubscribe = syncService.subscribeToStatus(setStatus);

    return unsubscribe;
  }, [syncService]);

  const clearErrors = useCallback(() => {
    if (syncService) {
      syncService.getStatusManager().clearErrors();
    }
  }, [syncService]);

  const getOperationsByType = useCallback(
    (type: SyncOperationType): SyncOperation[] => {
      return Array.from(status.operations.values()).filter(
        (op) => op.type === type
      );
    },
    [status.operations]
  );

  const isOperationTypeRunning = useCallback(
    (type: SyncOperationType): boolean => {
      return getOperationsByType(type).some((op) => op.status === "running");
    },
    [getOperationsByType]
  );

  return {
    // Status information
    isIdle: status.isIdle,
    isSyncing: status.isSyncing,
    hasError: status.hasError,
    lastSyncTime: status.lastSyncTime,
    errors: status.errors,

    // Operations
    operations: status.operations,
    getOperationsByType,
    isOperationTypeRunning,

    // Actions
    clearErrors,

    // Specific operation types for convenience
    isInitialSyncing: isOperationTypeRunning("initial-sync"),
    isQueueProcessing: isOperationTypeRunning("queue-processing"),
    isNoteSyncing: isOperationTypeRunning("note-sync"),
    isCollectionSyncing: isOperationTypeRunning("collection-sync"),
    isSettingsSyncing: isOperationTypeRunning("settings-sync"),
    isProcessingRealtimeEvent: isOperationTypeRunning("realtime-event"),
  };
}

/**
 * Hook to get just the basic sync status (lighter version)
 */
export function useSyncBasicStatus() {
  const { syncService } = useSyncContext();
  const [basicStatus, setBasicStatus] = useState({
    isSyncing: false,
    hasError: false,
    lastSyncTime: undefined as number | undefined,
  });

  useEffect(() => {
    if (!syncService) {
      return;
    }

    const unsubscribe = syncService.subscribeToStatus((status) => {
      setBasicStatus({
        isSyncing: status.isSyncing,
        hasError: status.hasError,
        lastSyncTime: status.lastSyncTime,
      });
    });

    return unsubscribe;
  }, [syncService]);

  return basicStatus;
}

/**
 * Hook to track specific operation types
 */
export function useSyncOperationType(type: SyncOperationType) {
  const { syncService } = useSyncContext();
  const [operationStatus, setOperationStatus] = useState({
    isRunning: false,
    operations: [] as SyncOperation[],
    hasError: false,
    lastError: undefined as Error | undefined,
  });

  useEffect(() => {
    if (!syncService) {
      return;
    }

    const unsubscribe = syncService.subscribeToStatus((status) => {
      const operations = Array.from(status.operations.values()).filter(
        (op) => op.type === type
      );
      const isRunning = operations.some((op) => op.status === "running");
      const hasError = operations.some((op) => op.status === "error");
      const lastError = operations
        .filter((op) => op.error)
        .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0]?.error;

      setOperationStatus({
        isRunning,
        operations,
        hasError,
        lastError,
      });
    });

    return unsubscribe;
  }, [syncService, type]);

  return operationStatus;
}
