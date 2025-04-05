# Yjs Integration Plan for Collaborative Note Editing

## 1. Project Analysis Summary

### Current Architecture

The application follows a client-server architecture with the following key components:

- **Frontend**: React application with TanStack Router for routing and TanStack Query for data fetching
- **State Management**: Zustand for global state management with slices for collections, notes, and action queue
- **Data Persistence**:
  - IndexedDB (via Dexie.js) for local storage
  - RESTful API for server communication
  - Action Queue for offline operations
- **Synchronization**:
  - SyncService handles bidirectional sync between local and remote state
  - SSE (Server-Sent Events) for real-time updates from server

### Data Flow

1. Notes metadata is stored in both IndexedDB and remote database
2. Changes are tracked via an action queue to support offline operations
3. When online, changes are synchronized with the server
4. Remote changes are received via SSE and applied to local state

### Database Schema

The database schema already includes a `YDocState` table designed to store Yjs documents:

```prisma
enum YDocType {
  COLLECTION
  NOTE
}

model YDocState {
  id         String   @id // same as the collection or note ID
  docType    YDocType // "collection" or "note"
  encodedDoc Bytes    // yjs doc as a binary blob
  updatedAt  DateTime @updatedAt

  @@map("y_doc_state")
}
```

There's also a Hocuspocus server setup in the `apps/magician` directory that handles Yjs document collaboration.

## 2. Yjs Integration Plan

### 2.1 Core Components

1. **YjsDocumentProvider**: A service to manage Yjs documents
2. **YjsSync**: A service to synchronize Yjs documents with the server
3. **NoteEditor**: A component integrating with a rich text editor (Tiptap, based on ProseMirror) with Yjs support

### 2.2 Implementation Steps

#### Step 1: Setup Dependencies

1. Add required dependencies:
   ```bash
   pnpm add yjs y-websocket @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
   ```

#### Step 2: Create Yjs Document Provider

Create a YjsDocumentProvider to manage Yjs documents:

1. Create `apps/web/src/lib/yjs/YjsDocumentProvider.ts`:

   - Implement document creation/loading
   - Handle document updates
   - Manage document lifecycle (connection/disconnection)

2. Create Yjs store slice in `apps/web/src/lib/store/yjsSlice.ts`:
   - Track active documents
   - Handle document state transitions

#### Step 3: Update Database Schema

1. Add YjsDocRepository in `apps/web/src/lib/db/YjsDocRepository.ts`:
   - Implement CRUD operations for Yjs documents in IndexedDB
   - Methods to fetch, update, and persist Yjs documents

#### Step 4: Create YjsSync Service

1. Create `apps/web/src/lib/yjs/YjsSync.ts`:
   - Implement incremental sync mechanism
   - Handle conflict resolution
   - Provide efficient update strategies

#### Step 5: Integrate with SyncService

1. Update `apps/web/src/lib/SyncService.ts` to handle Yjs document sync:
   - Add methods to sync Yjs documents
   - Implement smart loading strategy to avoid downloading all documents at once

#### Step 6: Create Editor Component

1. Create `apps/web/src/components/note/NoteEditor.tsx`:
   - Implement Tiptap editor with Yjs integration
   - Connect to Yjs document provider
   - Handle real-time collaboration

#### Step 7: Update Note Component

1. Update `apps/web/src/components/note/NotePanel.tsx` to use the new editor:
   - Integrate NoteEditor component
   - Handle document loading/unloading

### 2.3 Detailed Implementation

#### YjsDocumentProvider Implementation

```typescript
// apps/web/src/lib/yjs/YjsDocumentProvider.ts
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export class YjsDocumentProvider {
  private docs: Map<string, Y.Doc> = new Map();
  private providers: Map<string, WebsocketProvider> = new Map();
  private persistences: Map<string, IndexeddbPersistence> = new Map();

  async getDocument(noteId: string, userId: string): Promise<Y.Doc> {
    if (this.docs.has(noteId)) {
      return this.docs.get(noteId)!;
    }

    // Create new document
    const doc = new Y.Doc();

    // Setup IndexedDB persistence
    const persistence = new IndexeddbPersistence(`libra-ydoc-${noteId}`, doc);

    // Setup WebSocket provider for real-time collaboration
    const provider = new WebsocketProvider(
      `${import.meta.env.VITE_HOCUSPOCUS_URL}`,
      noteId,
      doc,
      {
        params: { token: await this.getAuthToken() },
      }
    );

    // Set awareness information
    provider.awareness.setLocalStateField("user", {
      name: userId,
      color: this.getRandomColor(),
    });

    this.docs.set(noteId, doc);
    this.providers.set(noteId, provider);
    this.persistences.set(noteId, persistence);

    return doc;
  }

  disconnectDocument(noteId: string): void {
    const provider = this.providers.get(noteId);
    const persistence = this.persistences.get(noteId);

    if (provider) {
      provider.disconnect();
      this.providers.delete(noteId);
    }

    if (persistence) {
      persistence.destroy();
      this.persistences.delete(noteId);
    }

    this.docs.delete(noteId);
  }

  private async getAuthToken(): Promise<string> {
    // Get auth token from the app state or storage
    return localStorage.getItem("authToken") || "";
  }

  private getRandomColor(): string {
    // Generate a random color for cursor
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
}

export const yjsDocumentProvider = new YjsDocumentProvider();
```

#### YjsSync Service Implementation

```typescript
// apps/web/src/lib/yjs/YjsSync.ts
import * as Y from "yjs";
import { ApiService } from "@/lib/ApiService";
import { YjsDocRepository } from "@/lib/db/YjsDocRepository";

export class YjsSync {
  constructor(private apiService: ApiService) {}

  async syncDocumentToServer(noteId: string, ydoc: Y.Doc): Promise<void> {
    // Get the document state as an Uint8Array
    const update = Y.encodeStateAsUpdate(ydoc);

    // Send to server
    await this.apiService.updateYjsDocument(noteId, update);
  }

  async syncDocumentFromServer(noteId: string, ydoc: Y.Doc): Promise<void> {
    // Get the document state from the server
    const serverUpdate = await this.apiService.getYjsDocument(noteId);

    // Apply the update to the document
    if (serverUpdate) {
      Y.applyUpdate(ydoc, serverUpdate);
    }
  }

  async syncIncremental(noteId: string, ydoc: Y.Doc): Promise<void> {
    // Get local version vector
    const localState = Y.encodeStateVector(ydoc);

    // Get incremental update from server based on local state vector
    const diff = await this.apiService.getYjsDocumentDiff(noteId, localState);

    // Apply only the differences
    if (diff) {
      Y.applyUpdate(ydoc, diff);
    }
  }
}
```

#### NoteEditor Component Implementation

```tsx
// apps/web/src/components/note/NoteEditor.tsx
import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { yjsDocumentProvider } from "@/lib/yjs/YjsDocumentProvider";

interface NoteEditorProps {
  noteId: string;
  userId: string;
  readOnly?: boolean;
}

export function NoteEditor({
  noteId,
  userId,
  readOnly = false,
}: NoteEditorProps) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  // Load the Yjs document
  useEffect(() => {
    const loadDocument = async () => {
      const doc = await yjsDocumentProvider.getDocument(noteId, userId);
      setYdoc(doc);
    };

    loadDocument();

    return () => {
      yjsDocumentProvider.disconnectDocument(noteId);
    };
  }, [noteId, userId]);

  // Setup the editor
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Collaboration.configure({
          document: ydoc ? ydoc : new Y.Doc(),
        }),
        CollaborationCursor.configure({
          provider: ydoc ? yjsDocumentProvider.getProvider(noteId) : null,
        }),
      ],
      editable: !readOnly,
    },
    [ydoc]
  );

  if (!ydoc) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="note-editor">
      <EditorContent editor={editor} />
    </div>
  );
}
```

#### Update NotePanel Component

```tsx
// apps/web/src/components/note/NotePanel.tsx
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { NoteEditor } from "./NoteEditor";

interface NotePanelProps {
  noteId: string;
}

export function NotePanel(props: NotePanelProps) {
  const { data: session } = useSessionQuery();
  const userId = session?.user.id || "";

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1">
        <NoteEditor noteId={props.noteId} userId={userId} />
      </div>
    </div>
  );
}
```

### 2.4 API Service Updates

1. Update `apps/web/src/lib/ApiService.ts` to add Yjs document-related endpoints:

```typescript
// Add to ApiService.ts
async getYjsDocument(noteId: string): Promise<Uint8Array | null> {
  try {
    const response = await this.get(`/api/notes/${noteId}/ydoc`);

    if (response.status === 200) {
      const data = await response.arrayBuffer();
      return new Uint8Array(data);
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch Yjs document for note ${noteId}`, error);
    return null;
  }
}

async updateYjsDocument(noteId: string, update: Uint8Array): Promise<void> {
  await this.put(`/api/notes/${noteId}/ydoc`, update);
}

async getYjsDocumentDiff(noteId: string, stateVector: Uint8Array): Promise<Uint8Array | null> {
  try {
    const response = await this.post(`/api/notes/${noteId}/ydoc/diff`, stateVector);

    if (response.status === 200) {
      const data = await response.arrayBuffer();
      return new Uint8Array(data);
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch Yjs document diff for note ${noteId}`, error);
    return null;
  }
}
```

### 2.5 YjsDocRepository Implementation

```typescript
// apps/web/src/lib/db/YjsDocRepository.ts
import { databaseService } from "./db";
import { wrapDbOperation } from "./wrapDbOperation";

interface YjsDocState {
  id: string;
  docType: "NOTE";
  encodedDoc: Uint8Array;
  updatedAt: Date;
}

export class YjsDocRepository {
  static async getById(id: string): Promise<YjsDocState | undefined> {
    return wrapDbOperation(() => {
      const db = databaseService.getDatabase();
      return db.table<YjsDocState>("yjsDocs").get(id);
    }, `Failed to fetch Yjs document with ID ${id}`);
  }

  static async put(docState: YjsDocState): Promise<void> {
    return wrapDbOperation(async () => {
      const db = databaseService.getDatabase();
      await db.table<YjsDocState>("yjsDocs").put(docState);
    }, `Failed to put Yjs document with ID ${docState.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      const db = databaseService.getDatabase();
      await db.table<YjsDocState>("yjsDocs").delete(id);
    }, `Failed to delete Yjs document with ID ${id}`);
  }
}
```

### 2.6 Database Schema Updates

Update the database schema in `apps/web/src/lib/db/db.ts` to include the Yjs documents table:

```typescript
// Update version in db.ts
this.db.version(2).stores({
  collections:
    "id, title, ownerId, createdAt, updatedAt, serverCreatedAt, serverUpdatedAt",
  notes:
    "id, title, description, ownerId, collectionId, createdAt, updatedAt, serverCreatedAt, serverUpdatedAt",
  actionQueue: "id, relatedEntityId, type, status, createdAt",
  yjsDocs: "id, docType, updatedAt", // Add new table for Yjs documents
});
```

## 3. Smart Synchronization Strategy

To implement efficient synchronization avoiding downloading the entire dataset at once:

### 3.1 Lazy Loading

1. Only load Yjs documents when a note is opened for editing
2. Use incremental updates to minimize data transfer
3. Implement a buffer mechanism to batch small changes

### 3.2 Optimized Sync Process

1. **Initial Load**:

   - When opening a note, load the local version from IndexedDB
   - Request only the diff from the server based on local state vector

2. **Active Editing**:

   - Connect to WebSocket for real-time collaboration
   - Apply incoming changes directly to the document

3. **Background Sync**:

   - Periodically sync changes with the server when connected
   - When offline, store changes locally and sync when back online

4. **Memory Management**:
   - Unload documents not actively being edited
   - Clear document cache when app is inactive

### 3.3 Connection State Management

1. **Online**:

   - Connect to WebSocket provider
   - Sync with server in real-time

2. **Offline**:
   - Store changes in IndexedDB
   - Disable collaboration features but allow editing
   - Queue changes for sync when back online

## 4. Challenges and Solutions

### 4.1 Memory Usage

**Challenge**: Yjs documents can grow large with extensive edit history

**Solution**:

- Implement document garbage collection
- Unload inactive documents
- Use incremental loading techniques

### 4.2 Conflict Resolution

**Challenge**: Conflicts may occur when multiple users edit the same content

**Solution**:

- Leverage Yjs's built-in CRDT conflict resolution
- Implement UI to show concurrent edits
- Add merge visualization for complex conflicts

### 4.3 Authentication and Authorization

**Challenge**: Securing the WebSocket connection for Yjs

**Solution**:

- Pass JWT token to WebSocket provider
- Implement server-side validation in Hocuspocus
- Check document access permissions on connection

### 4.4 Performance

**Challenge**: Large documents may impact performance

**Solution**:

- Implement document chunking for large notes
- Use virtualization techniques for rendering
- Optimize data structures for faster operations

## 5. Implementation Timeline

1. **Week 1**: Setup dependencies and create base infrastructure

   - Add dependencies
   - Create YjsDocumentProvider
   - Setup database schema updates

2. **Week 2**: Implement core functionality

   - Create YjsSync service
   - Update API service
   - Implement NoteEditor component

3. **Week 3**: Integration and testing

   - Integrate with SyncService
   - Update NotePanel component
   - Test with multiple clients

4. **Week 4**: Optimization and finalization
   - Optimize sync strategy
   - Implement memory management
   - Fix bugs and performance issues

## 6. Summary

This integration plan provides a comprehensive approach to adding Yjs-based collaborative editing to the application. By leveraging the existing architecture and extending it with Yjs capabilities, we can achieve efficient, real-time collaborative note editing while maintaining compatibility with the current synchronization mechanisms.

The plan focuses on:

1. Efficient data synchronization
2. Seamless integration with existing components
3. Memory-efficient operation
4. Handling online/offline scenarios
5. Providing a robust collaboration experience

Following this implementation plan will result in a fully functional collaborative note editing system that integrates smoothly with the existing application architecture.
