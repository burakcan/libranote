export type SyncOperationType =
  | "initial-sync"
  | "queue-processing"
  | "realtime-event"
  | "manual-sync"
  | "note-sync"
  | "collection-sync"
  | "settings-sync";

export type SyncOperationStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "timeout";

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  status: SyncOperationStatus;
  startTime: number;
  endTime?: number;
  error?: Error;
  description?: string;
}

export interface SyncStatus {
  isIdle: boolean;
  isSyncing: boolean;
  hasError: boolean;
  lastSyncTime?: number;
  operations: Map<string, SyncOperation>;
  errors: Error[];
}

export type SyncStatusListener = (status: SyncStatus) => void;

const OPERATION_TIMEOUT = 30000; // 30 seconds
const MAX_ERRORS_TO_KEEP = 10;

export class SyncStatusManager extends EventTarget {
  private operations = new Map<string, SyncOperation>();
  private listeners = new Set<SyncStatusListener>();
  private errors: Error[] = [];
  private timeouts = new Map<string, NodeJS.Timeout>();
  private lastSyncTime?: number;

  constructor() {
    super();
  }

  /**
   * Start tracking a sync operation
   */
  startOperation(type: SyncOperationType, description?: string): string {
    const id = crypto.randomUUID();
    const operation: SyncOperation = {
      id,
      type,
      status: "running",
      startTime: Date.now(),
      description,
    };

    this.operations.set(id, operation);
    this.setOperationTimeout(id);
    this.notifyListeners();

    console.debug(`SyncStatusManager: Started operation ${type} (${id})`);
    return id;
  }

  /**
   * Complete a sync operation successfully
   */
  completeOperation(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`SyncStatusManager: Operation ${operationId} not found`);
      return;
    }

    operation.status = "completed";
    operation.endTime = Date.now();
    this.lastSyncTime = operation.endTime;

    this.clearOperationTimeout(operationId);

    // Remove completed operations after a short delay to allow UI updates
    setTimeout(() => {
      this.operations.delete(operationId);
      this.notifyListeners();
    }, 1000);

    this.notifyListeners();
    console.debug(
      `SyncStatusManager: Completed operation ${operation.type} (${operationId})`
    );
  }

  /**
   * Mark a sync operation as failed
   */
  failOperation(operationId: string, error: Error): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`SyncStatusManager: Operation ${operationId} not found`);
      return;
    }

    operation.status = "error";
    operation.endTime = Date.now();
    operation.error = error;

    this.addError(error);
    this.clearOperationTimeout(operationId);

    // Keep failed operations longer for debugging
    setTimeout(() => {
      this.operations.delete(operationId);
      this.notifyListeners();
    }, 5000);

    this.notifyListeners();
    console.error(
      `SyncStatusManager: Failed operation ${operation.type} (${operationId}):`,
      error
    );
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    const runningOperations = Array.from(this.operations.values()).filter(
      (op) => op.status === "running"
    );

    return {
      isIdle: runningOperations.length === 0,
      isSyncing: runningOperations.length > 0,
      hasError: this.errors.length > 0,
      lastSyncTime: this.lastSyncTime,
      operations: new Map(this.operations),
      errors: [...this.errors],
    };
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);

    // Immediately call with current status
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    this.notifyListeners();
  }

  /**
   * Get operations by type
   */
  getOperationsByType(type: SyncOperationType): SyncOperation[] {
    return Array.from(this.operations.values()).filter(
      (op) => op.type === type
    );
  }

  /**
   * Check if a specific operation type is running
   */
  isOperationTypeRunning(type: SyncOperationType): boolean {
    return this.getOperationsByType(type).some((op) => op.status === "running");
  }

  /**
   * Clean up all operations and timeouts
   */
  destroy(): void {
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();

    // Clear all operations
    this.operations.clear();

    // Clear listeners
    this.listeners.clear();

    // Clear errors
    this.errors = [];
  }

  private setOperationTimeout(operationId: string): void {
    const timeout = setTimeout(() => {
      const operation = this.operations.get(operationId);
      if (operation && operation.status === "running") {
        operation.status = "timeout";
        operation.endTime = Date.now();
        operation.error = new Error(
          `Operation ${operation.type} timed out after ${OPERATION_TIMEOUT}ms`
        );

        this.addError(operation.error);
        this.notifyListeners();

        console.error(
          `SyncStatusManager: Operation ${operation.type} (${operationId}) timed out`
        );
      }
      this.timeouts.delete(operationId);
    }, OPERATION_TIMEOUT);

    this.timeouts.set(operationId, timeout);
  }

  private clearOperationTimeout(operationId: string): void {
    const timeout = this.timeouts.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(operationId);
    }
  }

  private addError(error: Error): void {
    this.errors.unshift(error);

    // Keep only the latest errors
    if (this.errors.length > MAX_ERRORS_TO_KEEP) {
      this.errors = this.errors.slice(0, MAX_ERRORS_TO_KEEP);
    }
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (error) {
        console.error("SyncStatusManager: Error in status listener:", error);
      }
    }

    // Also dispatch events for backward compatibility
    this.dispatchEvent(
      new CustomEvent("status-change", {
        detail: status,
      })
    );
  }
}
