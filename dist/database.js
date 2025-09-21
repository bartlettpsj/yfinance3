import { Collection, Db, MongoClient } from "mongodb";
const uri = "mongodb://localhost:27017"; // Replace with your MongoDB connection string
// Single database with a single collection
export class Database {
    connected = false;
    client;
    db;
    collection;
    constructor() {
        this.client = new MongoClient(uri);
    }
    async setCollection(collectionName) {
        await this.connect();
        this.collection = this.db.collection(collectionName);
        return this.collection;
    }
    static async initDb(collectionName, dbName = "finance") {
        const database = new Database();
        await database.setCollection(collectionName);
        return database;
    }
    async connect(dbName = "finance") {
        if (!this.connected) {
            await this.client.connect();
            this.connected = true;
        }
        this.db = this.client.db(dbName);
        return this.db;
    }
    async close() {
        if (this.connected) {
            await this.client.close();
            this.connected = false;
        }
    }
}
//# sourceMappingURL=database.js.map