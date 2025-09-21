// Intend to get all NASDAQ stocks and then find which stocks have had the most wining streaks based on daily data.  
// I.e. grew each day (definition of grow need to be defined)

import { Database } from "./database.js";
import _ from "lodash";
import minimist from "minimist";
import {getCommandLine} from "./command-line.js";

const historyDb = await Database.initDb("history");
const tickerDb = await Database.initDb("tickers");

// Parse command line arguments
const {symbol, end, start, exchange} = getCommandLine(180);
const results = [];

const tickers = symbol
    ? [symbol]
    : await tickerDb.collection.find({ exchange }).map((s: any) => s.symbol).toArray();

for (const symbol of tickers) {
    // For each symbol get the history from the historyDb - get the weekly prices - the price at close on a Friday 

    // Get prices for every day for the last year
    const prices = await historyDb.collection.find({
        symbol,
        // date: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        date: { $gte: start, $lte: end }
    })
    .sort({ date: 1 }).toArray();

    // Find the winning streaks - i.e. the number of consecutive number of days where the closing price was higher than the previous day
    let maxStreak = 0;
    let currentStreak = 0;
    let previousPrice = 0;
    let increases = 0;
    let decreases = 0;
    let unchanged = 0;
    let bigIncrease = 0;
    let bigDecrease = 0;

    const bigChangeThreshold = 0.02; // 2%

    for (const price of prices) {
        // Initial case
        if (previousPrice !== 0) {

            const change = (price.close - previousPrice) / previousPrice;

            if (change > 0) {
                increases++;
                if (change > bigChangeThreshold) {
                    bigIncrease++;
                }
                currentStreak++;
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            } else if (change < 0) {
                decreases++;
                if (change < -bigChangeThreshold) {
                    bigDecrease++;
                }
                currentStreak = 0;
            } else {
                unchanged++;
                // unchanged - do not reset the streak
            }
        }

        previousPrice = price.close;
    }

    console.log(`Symbol: ${symbol}, Max Winning Streak: ${maxStreak}. increases: ${increases}, decreases: ${decreases}, unchanged: ${unchanged}`);
    results.push({ symbol, maxStreak, increases, decreases, unchanged, bigIncrease, bigDecrease, bigDiff: bigIncrease-bigDecrease, positivity: increases === 0 ? 0 : (increases / (increases + decreases)) * 100 });
}

const filtered =  _.filter(results, r => r.increases + r.decreases > 100);
const sorted = _.sortBy(filtered, r => -r.bigDiff);

// top 100
console.table(sorted.slice(0, 100));


try {
    await historyDb.close();
    await tickerDb.close();
    console.log("Closed database connections");
} catch (err) {
    console.error("Error closing database connection:", err);
}

console.log(`Done ${tickers.length} ${exchange} symbols`);