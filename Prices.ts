// Get a single price for the past fortnight

import {Database} from "./database.js";
import {getCommandLine} from "./command-line.js";

// Initialize the history database connection once
const historyDb = await Database.initDb("history");

const {start, end, symbol, exchange, dow} = getCommandLine(14, "AAPL");

async function getHistoryFromDow(symbol: string) {
    return await historyDb.collection.find({
        symbol,
        ...(dow && { $expr: {$eq: [{$dayOfWeek: "$date"}, dow  ]}}),
        date: {$gte: start, $lte: end}
    })
        .sort({date: 1}).toArray();
}

const prices = await getHistoryFromDow(symbol!);

console.log(`Symbol: ${symbol} Count: ${prices.length} `);
prices.forEach(p => console.log(`${symbol} ${p.date.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: '2-digit' })} ${p.close?.toFixed(2)}`));

try {
    await historyDb.close();
    console.log("Closed database connections");
} catch (err) {
    console.error("Error closing database connection:", err);
} 
