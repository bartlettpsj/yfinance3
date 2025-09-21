
import {Collection, MongoClient} from "mongodb";

const uri = "mongodb://localhost:27017"; // Replace with your MongoDB connection string

export interface TheDb {
    database: Database;
    collection: Collection;
}

export class Database {
    client: MongoClient;

    constructor() {
        this.client = new MongoClient(uri);
    }

    static async initDb(collectionName: string) {
        const theDb: TheDb = { database: new Database(), collection: null as any };
        const db = await theDb.database.connect();
        theDb.collection = db.collection(collectionName);
        return theDb;
    }
   
    async connect() {
        await this.client.connect();
        return this.client.db("finance");
    }

    async close() {
        await this.client.close();
    }
}

