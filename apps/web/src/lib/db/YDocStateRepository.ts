import { userDatabaseService } from "./userDatabaseService";
import { ClientYDocState } from "@/types/Entities";

export class YDocStateRepository {
  static async getAll() {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientYDocState>("ydocState").toArray();
  }

  static async getById(id: string) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientYDocState>("ydocState").get(id);
  }

  static async put(ydocState: ClientYDocState) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientYDocState>("ydocState").put(ydocState);
  }

  static async update(id: string, ydocState: ClientYDocState) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientYDocState>("ydocState").update(id, ydocState);
  }

  static async delete(id: string) {
    const db = userDatabaseService.getDatabase();
    return db.table<ClientYDocState>("ydocState").delete(id);
  }
}
