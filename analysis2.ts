// Intend to get all NASDAQ stocks and then find which stocks have had the most wining streaks based on daily data.  
// I.e. grew each day (definition of grow need to be defined)

import { Database } from "./database.js";
import _ from "lodash";

// Initialize the history database connection once
const historyDb = await Database.initDb("history");
const tickerDb = await Database.initDb("tickers");
const exchange = "NASDAQ";
const tickers = await tickerDb.collection.find({ exchange }).map((s: any) => s.symbol).toArray();
const results = [];

for (const symbol of tickers) {
    // For each symbol get the history from the historyDb - get the weekly prices - the price at close on a Friday 

    // Get prices for every day for the last year
    const prices = await historyDb.collection.find({
        symbol,
        date: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
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

// const sorted = _.sortBy(results, r => -r.maxStreak);
const filtered =  _.filter(results, r => r.increases + r.decreases > 100);
const sorted = _.sortBy(filtered, r => -r.bigDiff);

// top 10
console.table(sorted.slice(0, 100));


try {
    await historyDb.database.close();
    await tickerDb.database.close();
    console.log("Closed database connections");
} catch (err) {
    console.error("Error closing database connection:", err);
}

console.log(`Done ${tickers.length} ${exchange} symbols`);