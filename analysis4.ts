// Test a theory to see if there are certain days of the week best to buy and sell next day?  I believe sell end of Mon and buy Tuesday

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

// Track the 2 dimensional array of changes
// e.g. [0][1] = sunday to monday
// Positive equals more increases, negative equals decreases, 0 equals unchanged
const changes: number[][] = new Array(7);
for (let i = 0; i < 7; i++) {
    changes[i] = new Array(7).fill(0);
}

// Processing a symbol an d in date order, but warning there could be gaps in the data, so do not process the day where there is more than a week since last one

for (const symbol of tickers) {
    // For each symbol get the history from the historyDb - get the weekly prices - the price at close on a Friday 

    // Get prices for every day for the last year
    const prices = await historyDb.collection.find({
        symbol,
        date: { $gte: start, $lte: end }
    })
    .sort({ date: 1 }).toArray();

    let previousPrice = 0;
    let previousDate: Date;

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