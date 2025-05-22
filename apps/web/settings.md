## 1. Account Settings

- **Profile Information:**
  - Name (Editable)
  - Email (Display only, link to change email process if applicable)
  - Profile Picture/Avatar (Upload/Change)
- **Password Management:**
  - Change Password
- **Connected Accounts:** (If OAuth providers like Google/GitHub are used)
  - List connected accounts
  - Option to disconnect accounts
- **Account Deletion:**
  - Option to permanently delete the account and all associated data (with appropriate warnings and confirmation steps).
- **Export Data:**
  - Option to export all user data (notes, collections) in a standard format (e.g., JSON, Markdown archive).

## 2. Appearance & Theme

- **Theme:**
  - Light Mode
  - Dark Mode
  - System Default
  - Theme for both light and dark modes (available themes are under `apps/web/src/styles/themes`)
  - User can select a dark and a light theme from the available themes
  - If user chose only dark or only light, then there should be only a single theme selector
  - If user chooses system default, then there should be 2 theme selectors, one for light and one for dark
- **Font Family:**
  - Select a font family for notes
  - Choose fonts for headings, content, and code
  - Line height for notes
- **Font Size:**
  - Small, Medium, Large for note content

## 3. Sync & Network

- **Sync Status:**
  - Display current sync status (Syncing, Synced, Offline).
  - Last synced time.
- **Force Sync:**
  - Button to manually trigger a sync cycle.
- **Offline Data Management:**
  - Display storage used by offline data.
  - Option to clear local cache (with warnings about unsynced data).

## 4. Security & Privacy

- **Active Sessions:**
  - List active sessions (device, location, last active).
  - Option to log out other sessions.
- **Privacy Policy / Terms of Service:**
  - Links to relevant documents.

## 5. UI/UX Design for Settings Interface

This section outlines the proposed design and user experience for the application's settings interface.

### 5.1. Overall Structure: Settings Modal

- **Container:** A modal dialog will be used to display settings. This allows users to quickly access settings without navigating away from their current context (e.g., editing a note).
  - The modal should be dismissible by clicking an "X" icon, pressing the Escape key, or clicking outside the modal (if appropriate for the design system).
  - It should have a clear title, e.g., "Settings".
- **Navigation:**
  - A vertical navigation panel (sidebar) on the left side of the modal will list the main setting categories:
    - Account
    - Appearance
    - Sync & Network
    - Security
  - Selecting a category in the sidebar will display the relevant settings in the main content area of the modal to the right.
  - The currently active category should be clearly indicated in the sidebar.

### 5.2. Layout and Components per Section

#### 5.2.1. Account Settings

- **Layout:** Single-column layout for clarity.
- **Profile Information:**
  - `Name`: Text input field, pre-filled with current name.
  - `Email`: Non-editable text display. A small info icon or link could direct users to a separate process for email changes if it's complex.
  - `Profile Picture/Avatar`:
    - Display current avatar.
    - "Change" button or click-to-upload area.
    - "Remove" button if an avatar is set.
- **Password Management:**
  - `Change Password`: Button that could either expand inline fields (Current Password, New Password, Confirm New Password) or open another small modal/step for focused password change.
- **Connected Accounts:**
  - List of connected accounts (e.g., Google, GitHub) with their icons and names/emails.
  - "Disconnect" button next to each connected account.
- **Account Deletion:**
  - `Delete Account`: Prominently displayed button, perhaps with a warning color (e.g., red).
    - Clicking this should open a confirmation dialog requiring a specific action (e.g., typing "DELETE" or password) to prevent accidental deletion.
- **Export Data:**
  - `Export My Data`: Button to initiate the data export process.
    - May show a brief explanation of what will be exported and in what format.

#### 5.2.2. Appearance & Theme

- **Layout:** Group related settings with subheadings if needed.
- **Theme Selection:**
  - **Primary Theme Choice**: Radio buttons or a segmented control for "Light", "Dark", "System".
  - **Conditional Theme Pickers (based on `apps/web/src/styles/themes`):**
    - If "Light" is selected:
      - A single dropdown labeled "Theme" or "Light Theme" to pick from available light themes.
    - If "Dark" is selected:
      - A single dropdown labeled "Theme" or "Dark Theme" to pick from available dark themes.
    - If "System" is selected:
      - Two dropdowns:
        - "Light Theme": To pick from available light themes.
        - "Dark Theme": To pick from available dark themes.
  - Theme previews could be a nice addition (small visual swatches next to theme names).
- **Font Family (for notes):**
  - `Headings Font`: Dropdown with a curated list of web-safe and aesthetically pleasing fonts.
  - `Content Font`: Dropdown, similar to headings.
  - `Code Font`: Dropdown, focusing on monospace fonts.
  - `Line Height`: Dropdown or slider (e.g., 1.2, 1.4, 1.6, 1.8, 2.0 or Small, Normal, Large, Extra Large).
- **Font Size (for note content):**
  - Radio buttons or segmented control for "Small", "Medium", "Large".
  - A live preview of the selected font size on a sample text snippet would be beneficial.

#### 5.2.3. Sync & Network

- **Layout:** Clear, informational display.
- **Sync Status:**
  - Text display: "Status: Synced", "Status: Syncing...", "Status: Offline".
  - Text display: "Last synced: [Date and Time]".
- **Force Sync:**
  - Button: "Sync Now". Should provide visual feedback during the sync process (e.g., spinner on the button).
- **Offline Data Management:**
  - Text display: "Local storage used: [Size] MB".
  - Button: "Clear Local Cache".
    - This should trigger a confirmation dialog explaining the implications (potential loss of unsynced data).

#### 5.2.4. Security & Privacy

- **Layout:** Straightforward list of actions/information.
- **Active Sessions:**
  - A list/table displaying active sessions:
    - `Device/Browser` (e.g., Chrome on macOS)
    - `Location` (Approximate, if available)
    - `Last Active` (e.g., 2 hours ago)
    - "Log Out" button next to each session (except the current one).
  - "Log Out All Other Sessions" button.
- **Privacy Policy / Terms of Service:**
  - Links that open the respective documents in a new browser tab.

### 5.3. General UI Considerations

- **Responsiveness:** The modal and its contents should be responsive and usable on various screen sizes, including mobile. The sidebar navigation might switch to a top tab bar or a dropdown on smaller screens.
- **Accessibility:**
  - Ensure proper ARIA attributes are used.
  - Keyboard navigable.
  - Sufficient color contrast.
- **Feedback:** Provide immediate visual feedback for actions (e.g., saving a setting, initiating a sync). Use toasts for success/error messages if an action is not immediately visible.
- **Saving Changes:**
  - Settings should ideally be saved automatically as they are changed (e.g., when a toggle is switched or a dropdown selection is made).
  - If auto-save is not feasible for all settings, a "Save Changes" button (and a "Cancel" button) should be present at the bottom of the modal, active only when changes are pending. Auto-save is generally preferred for a smoother experience.
- **Consistency:** Maintain consistency with the overall application's design language (colors, typography, component styles).

## 6. Settings System Architecture

This section outlines the proposed architecture for managing user settings in the application. Settings will be stored both locally (IndexedDB) and on the server (PostgreSQL via Prisma). Users will have the option to sync settings across their devices.

### 6.1. Core Requirements & Considerations

- **Local First:** Settings should be available immediately from local storage for a fast UX.
- **Server Sync:** Settings should be backed up to the server.
- **Selective Sync:** Users should be able to choose if their settings are synced across devices or kept local to the current device/browser.
- **Data Model:** A new table/model will be needed in the database for settings.
- **API Endpoints:** New API endpoints will be required to fetch and update settings on the server.
- **Conflict Resolution:** While less critical for settings than for notes, a simple "last write wins" strategy should suffice for now.
- **Extensibility:** The system should be designed to easily add new settings in the future.

### 6.2. Data Models

#### 6.2.1. Prisma Schema (Backend)

A new `UserSetting` model will be added to `packages/database/prisma/schema.prisma`:

```prisma
model UserSetting {
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  key       String // e.g., "theme.dark", "font.contentFamily", "sync.settingsEnabled"
  value     Json   // Allows storing various types of setting values (string, boolean, number, object)
  updatedAt DateTime @updatedAt

  @@unique([userId, key])
  @@map("user_setting")
}
```

- `userId` and `key` will form a unique constraint.
- `value` will be `Json` to accommodate different setting types.

#### 6.2.2. Local Storage (IndexedDB)

A similar structure will be used in IndexedDB, likely within a dedicated object store for settings. Each setting will be an object:

```typescript
interface LocalUserSetting {
  id?: string; // Optional, might not be needed if using key as IndexedDB key
  key: string;
  value: any; // string, boolean, number, object
  updatedAt: Date;
  // A flag to indicate if this setting has been synced to the server
  // This is particularly important if implementing a more robust sync queue later
  // For now, it helps in deciding whether to POST (new) or PUT (update)
  syncedToServer?: boolean;
}
```

A special setting `sync.settingsEnabled` (boolean) will control whether other settings are synced or kept local.

### 6.3. Option 1: Centralized Settings Service with Explicit Sync Control

**Description:**

This approach involves a dedicated `SettingsService` on the client-side that manages all interactions with settings, both local and remote. It would abstract the storage details (IndexedDB, API calls) from the UI components. A global Zustand slice would hold the current state of all settings.

**Client-Side:**

1.  **`SettingsService`:**

    - `getSetting(key: string): Promise<any>`: Retrieves a setting. Checks local cache (Zustand), then IndexedDB, then optionally fetches from the server if `sync.settingsEnabled` is true and the setting isn't local.
    - `setSetting(key: string, value: any): Promise<void>`: Updates a setting. Writes to Zustand and IndexedDB. If `sync.settingsEnabled` is true, it queues an API call to update the server.
    - `loadSettings(): Promise<void>`: Loads all settings from IndexedDB into Zustand on app startup. If `sync.settingsEnabled` is true, it can also fetch from the server and merge/update local settings.
    - Manages the `sync.settingsEnabled` flag itself. When this flag changes:
      - If changed to `true`: It could trigger a sync of all existing local settings to the server.
      - If changed to `false`: It stops syncing future changes. (Decision: Do we delete server settings or just stop updating them?)

2.  **Zustand Store (`settingsSlice`):**

    - Holds the current values of all settings for quick access by UI components.
    - `settings: Record<string, any>`
    - `syncEnabled: boolean`
    - Actions to update settings in the slice, which would then call the `SettingsService`.

3.  **UI Components:**
    - Read settings from the `settingsSlice`.
    - Use actions from the `settingsSlice` (or directly call `SettingsService`) to update settings.

**Server-Side (API):**

- `GET /api/settings`: Fetches all settings for the authenticated user.
- `PUT /api/settings`: Bulk updates settings for the user (accepts an array of key-value pairs).
- `PUT /api/settings/{key}`: Updates a single setting (alternative to bulk).

**Sync Flow:**

1.  User changes a setting in the UI.
2.  UI calls an action in `settingsSlice`.
3.  Action updates the Zustand state and calls `SettingsService.setSetting()`.
4.  `SettingsService` writes to IndexedDB.
5.  If `sync.settingsEnabled` is true, `SettingsService` makes an API call to update the server.
6.  On app load, `SettingsService.loadSettings()` populates Zustand from IndexedDB. If sync is enabled, it fetches from the server and merges (e.g., server values take precedence if newer, or local takes precedence if newer and not yet synced).

**Pros:**

- Clear separation of concerns (`SettingsService` handles all logic).
- Centralized control over sync behavior.
- UI components are decoupled from storage and sync details.

**Cons:**

- `SettingsService` can become complex.
- Requires careful management of the `sync.settingsEnabled` state and its implications (e.g., what happens when it's toggled).

### 6.4. Option 2: Integrated Sync via Existing SyncService

**Description:**

This approach leverages the existing `SyncService` (if suitable) or a similar pattern, treating settings as another type of data to be synced, similar to notes or collections. Settings changes would be written to an "action queue" in IndexedDB and processed by the `SyncService`.

**Client-Side:**

1.  **Zustand Store (`settingsSlice`):**

    - Holds the current values of all settings.
    - `settings: Record<string, any>`
    - `syncEnabled: boolean` (this setting itself is also stored and synced like any other setting).
    - Actions to update settings:
      - Update the setting in the Zustand slice.
      - Write the change to IndexedDB (settings store).
      - If `syncEnabled` is true for settings: Add an action to the `ActionQueueRepository` (e.g., `{ type: 'setting_update', payload: { key, value, updatedAt } }`).

2.  **`SyncService` (or a new dedicated part of it):**

    - Monitors the action queue for `setting_update` actions.
    - Processes these actions by making API calls to the backend.
    - Handles fetching settings from the server on initial load or when sync is (re-)enabled.
    - Handles incoming changes from the server (e.g., via SSE or periodic fetching) and updates IndexedDB and Zustand.

3.  **IndexedDB:**
    - A dedicated object store for `user_settings` (key-value pairs).
    - Uses the existing `ActionQueueRepository` to queue sync operations for settings.

**Server-Side (API):**

- Same as Option 1 (`GET /api/settings`, `PUT /api/settings`). The backend API can be largely the same.

**Sync Flow:**

1.  User changes a setting in the UI.
2.  UI calls an action in `settingsSlice`.
3.  Action updates Zustand and writes the setting to IndexedDB.
4.  If the global "sync settings" flag (`settings['sync.settingsEnabled']`) is true, an action is added to the `ActionQueueRepository`.
5.  `SyncService` picks up the action and calls the API.
6.  When the app loads, `SyncService` (or an initialization step) fetches settings from the server (if sync is enabled) and updates local stores. It also loads local settings into Zustand.

**Pros:**

- Reuses existing sync infrastructure patterns, potentially reducing new code for the sync mechanism itself.
- Treats settings data consistently with other application data (notes, collections).
- The `sync.settingsEnabled` flag is just another setting, managed uniformly.

**Cons:**

- May tightly couple settings management with the general `SyncService`, which could add complexity to `SyncService` if settings have very different sync requirements.
- Requires the `SyncService` to be aware of settings as a new data type.

### 6.5. Decision: Hybrid Approach (Leaning Towards Option 1 with elements of Option 2 for Sync)

**Chosen Approach Rationale:**

A hybrid approach seems best:

1.  **Dedicated `SettingsService` (from Option 1):** This service will be the primary interface for managing settings (get, set, load). It will handle direct interaction with a new `SettingsRepository` (for IndexedDB) and the `settingsSlice` in Zustand. This provides a clean abstraction.
2.  **`settingsSlice` in Zustand (from Option 1):** For reactive UI updates and a centralized client-side cache of settings.
3.  **Server API (from Option 1 & 2):** Standard REST endpoints for fetching and updating settings.
4.  **Sync Mechanism (Inspired by Option 2, but managed by `SettingsService` with SSE integration):**
    - The `SettingsService` will be responsible for initiating server communication for settings changes made by the current client.
    - When a setting is changed locally and `sync.settingsEnabled` is true, the `SettingsService` will directly call the API to update the server.
    - The backend, upon updating a setting, will broadcast an SSE event (e.g., `setting_updated`) with the setting details (`userId`, `key`, `value`, `updatedAt`).
    - The existing client-side `SyncService` will listen for these `setting_updated` SSE events.
    - Upon receiving such an event for the current user, `SyncService` will delegate to `SettingsService` to update the local IndexedDB and Zustand store. This ensures other clients receive updates in real-time.
    - The `sync.settingsEnabled` setting itself will be managed like any other setting.
    - On load, `SettingsService` will load from IndexedDB, then fetch from the server if sync is enabled, merging appropriately (server last write wins based on `updatedAt` timestamps).

**Why this Hybrid?**

- **Simplicity for Settings Sync Initiation:** Direct API calls for local changes are straightforward.
- **Real-time Updates:** Leverages the existing SSE mechanism in `SyncService` for cross-client synchronization.
- **Clear Responsibility:** `SettingsService` owns all settings data logic and local state management. `SyncService` handles the SSE transport for incoming changes.
- **Flexibility:** If, in the future, settings sync needs to be more robust for _outgoing_ messages (e.g., handling offline changes better before sending to server), the `SettingsService` internals can be updated, potentially to use an action queue for outgoing requests, without changing its public API for local management or how it receives SSE updates.

**Next Steps:**

1.  Define the `UserSetting` model in `schema.prisma`.
2.  Modify the backend API (`apps/api`):
    - Create endpoints for fetching and updating settings.
    - Ensure the update endpoint emits an SSE event (`setting_updated`) after successful persistence.
3.  Update client-side `SyncService` (`apps/web`) to listen for `setting_updated` SSE events and delegate to `SettingsService`.
4.  Implement `SettingsRepository` for IndexedDB interaction within `apps/web`.
5.  Implement `SettingsService` on the client-side (`apps/web`), including methods to handle local changes and updates triggered by SSE events.
6.  Create `settingsSlice` for Zustand in `apps/web`.
7.  Integrate with the UI components in `apps/web/src/components/settings`.

This plan focuses on creating a solid foundation. Initially, we will implement a small, essential set of settings (e.g., theme selection and the `sync.settingsEnabled` flag itself).
