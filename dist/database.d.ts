import { MongoClient } from "mongodb";
export declare class Database {
    client: MongoClient;
    constructor();
    connect(): Promise<import("mongodb").Db>;
    close(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map