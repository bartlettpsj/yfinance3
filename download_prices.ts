import YahooFinance from "yahoo-finance2";
import {Database} from "./database.js";
import {getCommandLine} from "./command-line.js";

const yahooFinance = new YahooFinance();
type HistoricalReturn = Awaited<ReturnType<typeof yahooFinance.historical>>;
type HistoricalItem = HistoricalReturn & { symbol?: string; exchange?: string };

// Parse command line arguments
const {end, start} = getCommandLine(14);

// Get history for a symbol and store in MongoDB
async function getHistory(symbol: string) {
    try {
        type Interval = "1mo" | "1d" | "1wk";

        // Define options: 1 year of daily candles
        const queryOptions = {
            period1: start, // new Date(new Date().setDate(new Date().getDate() - 14)), // 2 weeks ago
            period2: end, // new Date(), // day
            interval: "1d" as Interval // daily data
        };

        // Fetch historical prices
        return await yahooFinance.historical(symbol, queryOptions);
    } catch (error) {
        console.error("Error fetching Apple history:", error);
    }
}

async function saveHistory(symbol: string, history: HistoricalReturn, exchange: string = "NASDAQ", database : Database) {
    const ops = history.map((doc: HistoricalItem) => ({
        updateOne: {
            filter: {symbol, date: doc.date},
            update: {$set: {...doc, symbol, exchange}},
            upsert: true
        }
    }));

    if (ops.length > 0) {
        const result = await database.collection.bulkWrite(ops);
        console.log(`Bulk write result for ${symbol}:`, result);
    }
}

async function getSymbols() {
    const theDb = await Database.initDb("tickers");

    try {
        const symbols = await theDb.collection.find({}).toArray();
        return symbols.map(s => ({symbol: s.symbol, exchange: s.exchange}));
    } finally {
        await theDb.close();
    }
}

const symbols = await getSymbols();
console.log(`Loaded ${symbols.length} symbols`);

// Initialize the history database connection once
const database = await Database.initDb("history");

for (const {symbol, exchange} of symbols) {
    const history = await getHistory(symbol);
    if (history) {
        await saveHistory(symbol, history, exchange, database);
        console.log(`Saved ${history.length} history entries for ${symbol} - exchange ${exchange}`);
    } else {
        console.log(`No history for ${symbol}`);
    }
}

// Close the database
try {
    await database.close();
    console.log("Closed history database connection");
} catch (err) {
    console.error("Error closing history database connection:", err);
}
