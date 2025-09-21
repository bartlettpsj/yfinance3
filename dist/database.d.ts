import { Collection, Db, MongoClient } from "mongodb";
export declare class Database {
    connected: boolean;
    client: MongoClient;
    db: Db;
    collection: Collection;
    constructor();
    setCollection(collectionName: string): Promise<Collection>;
    static initDb(collectionName: string, dbName?: string): Promise<Database>;
    connect(dbName?: string): Promise<Db>;
    close(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map