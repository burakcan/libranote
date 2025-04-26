import { userDatabaseService } from "./userDatabaseService";
import { ClientNoteYDocState } from "@/types/Entities";

export class NoteYDocStateRepository {
  static async getAll() {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientNoteYDocState>("noteYDocState").toArray();
  }

  static async getById(id: string) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientNoteYDocState>("noteYDocState").get(id);
  }

  static async put(ydocState: ClientNoteYDocState) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientNoteYDocState>("noteYDocState").put(ydocState);
  }

  static async update(id: string, ydocState: Partial<ClientNoteYDocState>) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientNoteYDocState>("noteYDocState").update(id, ydocState);
  }

  static async delete(id: string) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientNoteYDocState>("noteYDocState").delete(id);
  }
}
