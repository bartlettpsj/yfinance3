import YahooFinance from "yahoo-finance2";
import { Database } from "./database.js";
const yahooFinance = new YahooFinance();
// Get history for a symbol and store in MongoDB
async function getHistory(symbol) {
    try {
        // HistoricalOptionsEventsHistory
        // HistoricalOptions
        // Define options: 1 year of daily candles
        const queryOptions = {
            period1: "2020-09-06", // 5 year ago (yyyy-mm-dd)
            period2: "2025-09-06", // day
            interval: "1d" // daily data
        };
        // Fetch historical prices
        const history = await yahooFinance.historical(symbol, queryOptions);
        return history;
    }
    catch (error) {
        console.error("Error fetching Apple history:", error);
    }
}
async function saveHistory(symbol, history, exchange = "NASDAQ", theDb) {
    const database = new Database();
    try {
        const collection = theDb ? theDb.collection : (await database.connect()).collection("history");
        const ops = history.map((doc) => ({ updateOne: { filter: { symbol, date: doc.date }, update: { $set: { ...doc, symbol, exchange } }, upsert: true } }));
        if (ops.length > 0) {
            const result = await collection.bulkWrite(ops);
            //   console.log(`Bulk write result for ${symbol}:`, result);
        }
        // for (const doc of history) {
        //   const item: HistoricalItem = { ...doc, symbol, exchange    };
        //   const update = await collection.updateOne({ symbol, date: doc.date }, { $set: item }, { upsert: true });
        //   if (update.upsertedId) {
        //     console.log(`${item.symbol}: Document upserted with _id: ${update.upsertedId}`);
        //   } else {
        //     console.log(`Document updated for symbol: ${symbol} (${exchange}) on date: ${doc.date}`);
        //   }
        // }
    }
    finally {
        if (!theDb) {
            await database.close();
        }
    }
}
async function getSymbols() {
    const database = new Database();
    try {
        const db = await database.connect();
        const collection = db.collection("tickers");
        const symbols = await collection.find({}).toArray();
        return symbols.map(s => ({ symbol: s.symbol, exchange: s.exchange }));
    }
    finally {
        await database.close();
    }
}
const symbols = await getSymbols();
console.log(`Loaded ${symbols.length} symbols`);
async function initHistoryDb() {
    const theDb = { database: new Database(), collection: null };
    const db = await theDb.database.connect();
    theDb.collection = db.collection("history");
    return theDb;
}
// Initialize the history database connection once
const theDb = await initHistoryDb();
for (const { symbol, exchange } of symbols) {
    const history = await getHistory(symbol);
    if (history) {
        await saveHistory(symbol, history, exchange, theDb);
        console.log(`Saved ${history.length} history entries for ${symbol} - exchange ${exchange}`);
    }
    else {
        console.log(`No history for ${symbol}`);
    }
}
// Close the database
try {
    await theDb.database.close();
    console.log("Closed history database connection");
}
catch (err) {
    console.error("Error closing history database connection:", err);
}
// Example for a single symbol
// const symbol = "AAPL";
// const history = await getHistory(symbol);
// console.log(history);
// await saveHistory(symbol, history);
//# sourceMappingURL=index.js.map