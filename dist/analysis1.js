// Intend to get all NASDAQ stocks and then find which stocks have had the most wining streaks based on weekly data.  
// I.e. grew each week (definition of grow need to be defined)
import { Database } from "./database.js";
import _ from "lodash";
// Initialize the history database connection once
const historyDb = await Database.initDb("history");
const tickerDb = await Database.initDb("tickers");
const exchange = "NASDAQ";
const tickers = await tickerDb.collection.find({ exchange }).map((s) => s.symbol).toArray();
const results = [];
for (const symbol of tickers) {
    // For each symbol get the history from the historyDb - get the weekly prices - the price at close on a Friday 
    const prices = await historyDb.collection.find({
        symbol,
        $expr: { $eq: [{ $dayOfWeek: "$date" }, 6] },
        date: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
    })
        .sort({ date: 1 }).toArray();
    // Find the winning streaks - i.e. the number of consecutive weeks where the closing price was higher than the previous week
    let maxStreak = 0;
    let currentStreak = 0;
    let previousPrice = 0;
    let increases = 0;
    let decreases = 0;
    let unchanged = 0;
    for (const price of prices) {
        // Initial case
        if (previousPrice !== 0) {
            if (price.close > previousPrice) {
                increases++;
                currentStreak++;
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            }
            else if (price.close < previousPrice) {
                decreases++;
                currentStreak = 0;
            }
            else {
                unchanged++;
                // unchanged - do not reset the streak
            }
        }
        previousPrice = price.close;
    }
    console.log(`Symbol: ${symbol}, Max Winning Streak: ${maxStreak}. increases: ${increases}, decreases: ${decreases}, unchanged: ${unchanged}`);
    results.push({ symbol, maxStreak, increases, decreases, unchanged });
}
const sorted = _.sortBy(results, r => -r.increases);
// top 10
console.table(sorted.slice(0, 100));
try {
    await historyDb.close();
    await tickerDb.close();
    console.log("Closed database connections");
}
catch (err) {
    console.error("Error closing database connection:", err);
}
console.log(`Done ${tickers.length} ${exchange} symbols`);
//# sourceMappingURL=analysis1.js.map