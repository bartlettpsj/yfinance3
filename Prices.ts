// Get a single price for the past year, each friday

import {Database} from "./database.js";

async function initDb(collectionName: string) {
    const theDb = { database: new Database(), collection: null as any };
    const db = await theDb.database.connect();
    theDb.collection = db.collection(collectionName);
    return theDb;
}

// get the symbol from command line

// Initialize the history database connection once
const historyDb = await initDb("history");
const tickerDb = await initDb("tickers");
const exchange = "NASDAQ";
const symbol = process.argv[2] || "AAPL";
const tickers = await tickerDb.collection.find({ exchange }).map((s: any) => s.symbol).toArray();
const results = [];

async function getHistory(symbol: string) {
    return await historyDb.collection.find({
        symbol,
        $expr: {$eq: [{$dayOfWeek: "$date"}, 6  ]},
        date: {$gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
    })
        .sort({date: 1}).toArray();
}

const prices = await getHistory(symbol);

console.log(`Symbol: ${symbol} Count: ${prices.length} `);
prices.forEach(p => console.log(`${symbol} ${p.date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })} ${p.close.toFixed(2)}`));


try {
    await historyDb.database.close();
    await tickerDb.database.close();
    console.log("Closed database connections");
} catch (err) {
    console.error("Error closing database connection:", err);
}

