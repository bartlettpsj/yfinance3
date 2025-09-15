import { MongoClient } from "mongodb";
const uri = "mongodb://localhost:27017"; // Replace with your MongoDB connection string
export class Database {
    client;
    constructor() {
        this.client = new MongoClient(uri);
    }
    async connect() {
        await this.client.connect();
        return this.client.db("finance");
    }
    async close() {
        await this.client.close();
    }
}
async function run() {
    const database = new Database();
    try {
        const db = await database.connect();
        const collection = db.collection("tickers");
        // Example document to insert
        const doc = { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" };
        const result = await collection.insertOne(doc);
        console.log(`New document inserted with _id: ${result.insertedId}`);
        // Query the document
        const query = { ticker: "AAPL" };
        const item = await collection.findOne(query);
        console.log("Found document:", item);
    }
    finally {
        await database.close();
    }
}
// run().catch(console.dir);   
//# sourceMappingURL=database.js.map