import YahooFinance  from "yahoo-finance2";
import { Database } from "./database.js";
const yahooFinance = new YahooFinance();
type HistoricalReturn = Awaited<ReturnType<typeof yahooFinance.historical>>;
type HistoricalItem = HistoricalReturn & { symbol?: string; exchange?: string };

// Get history for a symbol and store in MongoDB
async function getHistory(symbol: string) {
  try {
    // Need to define Duration type
    type Interval = "1mo" | "1d" | "1wk";

    // HistoricalOptionsEventsHistory
    // HistoricalOptions

    // Define options: 1 year of daily candles
    const queryOptions = {
      period1: "2020-09-06", // 5 year ago (yyyy-mm-dd)
      period2: "2025-09-06", // day
      interval: "1d" as Interval // daily data
    };

    // Fetch historical prices
    const history = await yahooFinance.historical(symbol, queryOptions);
    return history;
  } catch (error) {
    console.error("Error fetching Apple history:", error);
  }
}

async function saveHistory(symbol: string, history: HistoricalReturn, exchange: string = "NASDAQ") {
  const database = new Database();

  try {
    const db = await database.connect();
    const collection = db.collection("history");

    for (const doc of history) {
      const item: HistoricalItem = { ...doc, symbol, exchange    };
      const update = await collection.updateOne({ symbol, date: doc.date }, { $set: item }, { upsert: true });

      if (update.upsertedId) {
        console.log(`${item.symbol}: Document upserted with _id: ${update.upsertedId}`);
      } else {
        console.log(`Document updated for symbol: ${symbol} (${exchange}) on date: ${doc.date}`);
      }
    }
  } finally {
    await database.close();
  }
}

async function getSymbols() {
  const database = new Database();

  try {
    const db = await database.connect();
    const collection = db.collection("tickers");
    const symbols = await collection.find({}).toArray();
    return symbols.map(s => ({ symbol: s.symbol, exchange: s.exchange }));
  } finally {
    await database.close();
  }
}

const symbols = await getSymbols();
console.log(`Loaded ${symbols.length} symbols`);

for (const { symbol, exchange } of symbols) {
  const history = await getHistory(symbol);
  if (history) {
    await saveHistory(symbol, history, exchange);
    console.log(`Saved history for ${symbol}`);
  } else {
    console.log(`No history for ${symbol}`);
  }
}

// Example for a single symbol
// const symbol = "AAPL";
// const history = await getHistory(symbol);
// console.log(history);

// await saveHistory(symbol, history);
