
import {Collection, Db, MongoClient} from "mongodb";

const uri = "mongodb://localhost:27017"; // Replace with your MongoDB connection string

// Single database with a single collection
export class Database {
    connected: boolean = false;
    client: MongoClient;
    db!: Db;
    collection!: Collection;

    constructor() {
        this.client = new MongoClient(uri);
    }

    async setCollection(collectionName: string): Promise<Collection> {
        await this.connect();
        this.collection = this.db.collection(collectionName);
        return this.collection;
    }

    static async initDb(collectionName: string, dbName: string="finance"): Promise<Database> {
        const database = new Database();
        await database.setCollection(collectionName);
        return database;
    }
   
    async connect(dbName: string="finance" ) {
        if (!this.connected) {
            await this.client.connect();
            this.connected = true;
        }
        this.db = this.client.db(dbName)
        return this.db;
    }

    async close() {
        if (this.connected) {
            await this.client.close();
            this.connected = false;
        }
    }
}

