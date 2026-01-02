import {Database} from "./database.js";

export async function getAllSymbols() {
    const theDb = await Database.initDb("tickers");

    try {
        const symbols = await theDb.collection.find({}).toArray();
        return symbols.map(s => ({symbol: s.symbol, exchange: s.exchange}));
    } finally {
        await theDb.close();
    }
}