// Intend to get all NASDAQ stocks and then see if there are certain dow that are more positive and those that are negative

import { Database } from "./database.js";
import _ from "lodash";
import {getCommandLine} from "./command-line.js";
import { tableDeep} from "./util.js";

const historyDb = await Database.initDb("history");
const tickerDb = await Database.initDb("tickers");

// Parse command line arguments
const {symbol, end, start, exchange} = getCommandLine(180);

const tickers = symbol
    ? [symbol]
    : await tickerDb.collection.find({ exchange }).map((s: any) => s.symbol).toArray();

// Track the number of increases and decreases per date
type DateChange = { increases: number, decreases: number, unchanged: number, velocity: number };
const dateChangeMap: Map<string, DateChange> = new Map();
const dayChange: DateChange[] = new Array(7);

for (const symbol of tickers) {
    // For each symbol get the history from the historyDb - get the weekly prices - the price at close on a Friday 

    // Get prices for every day for the last year
    const prices = await historyDb.collection.find({
        symbol,
        date: { $gte: start, $lte: end }
    })
    .sort({ date: 1 }).toArray();

    let previousPrice = 0;

    for (const price of prices) {
        // Initial case
        if (previousPrice !== 0) {

            const change = (price.close - previousPrice) / previousPrice;
            const dateStr = price.date.toISOString().slice(0, 10);

            if (!dateChangeMap.has(dateStr)) {
                dateChangeMap.set(dateStr, { increases: 0, decreases: 0, unchanged: 0, velocity: 0 });
            }

            const entry = dateChangeMap.get(dateStr)!;

            const day = (price.date as Date).getDay(); // sun=0, mon=1, tue=2, wed=3, thu=4, fri=5, sat=6

            if (change > 0) {
                entry.increases++;
            } else if (change < 0) {
                entry.decreases++;
            } else {
                entry.unchanged++;
            }

            entry.velocity = entry.increases - entry.decreases;
        }

        previousPrice = price.close;
    }

    console.log(`Symbol: ${symbol} processed`);
    // results.push({ symbol, maxStreak, increases, decreases, unchanged, bigIncrease, bigDecrease, bigDiff: bigIncrease-bigDecrease, positivity: increases === 0 ? 0 : (increases / (increases + decreases)) * 100 });
}

// const filtered =  _.filter(results, r => r.increases + r.decreases > 100);
const sorted = _.sortBy([...dateChangeMap],entry=> -entry[1].velocity);

// top 100
tableDeep(sorted.slice(0, 100));

try {
    await historyDb.close();
    await tickerDb.close();
    console.log("Closed database connections");
} catch (err) {
    console.error("Error closing database connection:", err);
}

console.log(`Done ${tickers.length} ${exchange} symbols`);