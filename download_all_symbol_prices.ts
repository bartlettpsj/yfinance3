import YahooFinance from "yahoo-finance2";
import {Database} from "./database.js";
import {getCommandLine} from "./command-line.js";
import { getAllSymbols, getHistory } from "./price_util.js";

const yahooFinance = new YahooFinance();
type HistoricalReturn = Awaited<ReturnType<typeof yahooFinance.historical>>;
type HistoricalItem = HistoricalReturn & { symbol?: string; exchange?: string };

// Parse command line arguments
const {end, start, interval} = getCommandLine();

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

const symbols = await getAllSymbols();
console.log(`Loaded ${symbols.length} symbols`);

// Initialize the history database connection once
const database = await Database.initDb("history");

// Ensure index on (symbol, date)
await Database.checkCreateIndex(database.collection, { symbol: 1, date: 1, interval: 1 }, { unique: true });

for (const {symbol, exchange} of symbols) {
    const history = await getHistory(symbol, interval, start, end);
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
