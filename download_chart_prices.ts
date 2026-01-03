import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import { Database } from "./database.js";
import {getCommandLine} from "./command-line.js";
import { getAllSymbols, fetchChartData } from "./price_util.js";

type ChartReturn = any;
// type ChartItem = ChartReturn & { symbol?: string; exchange?: string };

// Parse command line arguments
const {symbol, end: period2, start: period1, interval} = getCommandLine();

// if (!symbol) {
//     console.error("No symbol provided. Use --symbol=XXX to specify a symbol.");
//     process.exit(1);
// }

// Initialize the history database connection once
const database = await Database.initDb("history");



// Save chart data to the database
async function saveChartData(symbol: string, chartData: ChartReturn, exchange: string = "NASDAQ", database : Database) {
    const interval = chartData?.meta?.dataGranularity;

    const ops = (chartData?.quotes ?? []).map((doc: any) => ({
        
        updateOne: {
            filter: {symbol, date: doc.date, interval},
            update: {$set: {...doc, symbol, exchange, interval}},
            upsert: true
        }
    }));

    if (ops.length > 0) {
        const result = await database.collection.bulkWrite(ops);
        // console.log(`Bulk write result for ${symbol}:`, result);
    }
}   

const symbols = symbol ? [{symbol, exchange: "NASDAQ"}] : await getAllSymbols();
console.log(`Loaded ${symbols.length} symbols`);    

for (const {symbol, exchange} of symbols) {
    const chartData = await fetchChartData(symbol, period1, period2, interval!);
    if (chartData) {
        await saveChartData(symbol, chartData, exchange, database);
        console.log(`Saved chart data for ${symbol} [${exchange}]`);
    } else {
        console.log(`No chart data fetched for ${symbol} [${exchange}] `);
    }   
}


// Close the database
try {
    await database.close();
    console.log("Closed history database connection");
} catch (err) {
    console.error("Error closing history database connection:", err);
}
