import { userDatabaseService } from "./userDatabaseService";
import { ClientNoteYDocState } from "@/types/Entities";
import { INoteYDocStateRepository } from "@/types/Repositories";

export const NoteYDocStateRepository = new (class
  implements INoteYDocStateRepository
{
  async getAll() {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientNoteYDocState>("noteYDocState").toArray();
  }

  async getById(id: string) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientNoteYDocState>("noteYDocState").get(id);
  }

  async put(ydocState: ClientNoteYDocState) {
    const db = userDatabaseService.getDatabase();
    await db.table<ClientNoteYDocState>("noteYDocState").put(ydocState);
  }

  async update(id: string, ydocState: Partial<ClientNoteYDocState>) {
    const db = userDatabaseService.getDatabase();
    await db.table<ClientNoteYDocState>("noteYDocState").update(id, ydocState);
  }

  async delete(id: string) {
    const db = userDatabaseService.getDatabase();
    await db.table<ClientNoteYDocState>("noteYDocState").delete(id);
  }
})();
