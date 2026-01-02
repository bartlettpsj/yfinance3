import YahooFinance from "yahoo-finance2";
import {Database} from "./database.js";
import {getCommandLine} from "./command-line.js";
import { getAllSymbols } from "./price_util.js";

const yahooFinance = new YahooFinance();
type HistoricalReturn = Awaited<ReturnType<typeof yahooFinance.historical>>;
type HistoricalItem = HistoricalReturn & { symbol?: string; exchange?: string };

// Parse command line arguments
const {end, start, interval} = getCommandLine();

// Get history for a symbol and store in MongoDB
async function getHistory(symbol: string, interval: string) {
    try {
        type Interval = "1mo" | "1d" | "1wk";

        // Define options: 1 year of daily candles
        const queryOptions = {
            period1: start, // new Date(new Date().setDate(new Date().getDate() - 14)), // 2 weeks ago
            period2: end, // new Date(), // day
            interval: interval as Interval
        };

        // Fetch historical prices

        // Add interval to each returned item       
        return (await yahooFinance.historical(symbol, queryOptions)).map(item => ({ ...item, interval }));
    } catch (error) {
        console.error(`Error fetching [${symbol}] history:`, error);
    }
}

async function saveHistory(symbol: string, history: HistoricalReturn, exchange: string = "NASDAQ", database : Database) {
    const ops = history.map((doc: HistoricalItem) => ({
        updateOne: {
            filter: {symbol, date: doc.date, interval: doc.interval},
            update: {$set: {...doc, symbol, exchange, interval: doc.interval}},
            upsert: true
        }
    }));

    if (ops.length > 0) {
        const result = await database.collection.bulkWrite(ops);
        // console.log(`Bulk write result for ${symbol}:`, result);
    }
}

// async function getAllSymbols() {
//     const theDb = await Database.initDb("tickers");

//     try {
//         const symbols = await theDb.collection.find({}).toArray();
//         return symbols.map(s => ({symbol: s.symbol, exchange: s.exchange}));
//     } finally {
//         await theDb.close();
//     }
// }

const symbols = await getAllSymbols();
console.log(`Loaded ${symbols.length} symbols`);

// Initialize the history database connection once
const database = await Database.initDb("history");

// Ensure index on (symbol, date)
await Database.checkCreateIndex(database.collection, { symbol: 1, date: 1, interval: 1 }, { unique: true });

for (const {symbol, exchange} of symbols) {
    const history = await getHistory(symbol, interval);
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
