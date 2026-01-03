import {Database} from "./database.js";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();


export async function getAllSymbols() {
    const theDb = await Database.initDb("tickers");

    try {
        const symbols = await theDb.collection.find({}).toArray();
        return symbols.map(s => ({symbol: s.symbol, exchange: s.exchange}));
    } finally {
        await theDb.close();
    }
}

// Get history for a symbol and store in MongoDB
export async function getHistory(symbol: string, interval: string, start: Date, end: Date) {
    try {
        // Define options: 1 year of daily candles
        const queryOptions = {
            period1: start, // new Date(new Date().setDate(new Date().getDate() - 14)), // 2 weeks ago
            period2: end, // new Date(), // day
            interval: interval as any    
        };  

        // Add interval to each returned item       
        return (await yahooFinance.historical(symbol, queryOptions)).map(item => ({ ...item, interval }));
    } catch (error) {
        console.error(`Error fetching [${symbol}] history:`, error);
    }
}
// Fetch chart data for symbol for a specific date range and interval
export async function fetchChartData(symbol: string, period1: Date, period2: Date, interval: string) {
    try {
        const data = await yahooFinance.chart(symbol, { period1, period2, interval: interval as any });
        // console.log("Chart Data:", data);
        return data
    } catch (error) {
        console.error("Error fetching chart data:", error);
    }
}