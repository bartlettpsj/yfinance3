// Get a single price for the past year, each friday

import {Database} from "./database.js";
import {getCommandLine} from "./command-line.js";


// Initialize the history database connection once
const historyDb = await Database.initDb("history");
const tickerDb = await Database.initDb("tickers");

const {symbol, exchange} = getCommandLine();

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

const prices = await getHistory(symbol!);

console.log(`Symbol: ${symbol} Count: ${prices.length} `);
prices.forEach(p => console.log(`${symbol} ${p.date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })} ${p.close.toFixed(2)}`));


try {
    await historyDb.close();
    await tickerDb.close();
    console.log("Closed database connections");
} catch (err) {
    console.error("Error closing database connection:", err);
}

