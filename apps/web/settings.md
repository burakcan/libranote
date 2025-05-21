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
