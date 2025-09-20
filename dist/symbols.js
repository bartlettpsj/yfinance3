import yahooFinance from "yahoo-finance2";
import { Database } from "./database.js";
import _ from "lodash";
// Open Source Symbol directory (NASDAQ + NYSE + AMEX)
const NASDAQ_URL = "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/refs/heads/main/nasdaq/nasdaq_full_tickers.json";
const NYSE_URL = "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/refs/heads/main/nyse/nyse_full_tickers.json";
const AMEX_URL = "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/refs/heads/main/amex/amex_full_tickers.json";
async function downloadSymbols(url, exchange) {
    const res = await fetch(url);
    const json = await res.json();
    return json.map(r => ({ symbol: r.symbol, name: r.name, exchange }));
}
async function saveSymbols(symbols) {
    const database = new Database();
    try {
        const db = await database.connect();
        const collection = db.collection("tickers");
        for (const symbolItem of symbols) {
            const item = _.pick(symbolItem, ["symbol", "name", "exchange"]);
            const update = await collection.updateOne(item, { $set: item }, { upsert: true });
            console.log(`Document upserted with _id: ${update.upsertedId}`);
        }
    }
    finally {
        await database.close();
    }
}
async function main() {
    console.log("📥 Downloading ticker lists...");
    const nasdaqSymbols = await downloadSymbols(NASDAQ_URL, "NASDAQ");
    const nyseSymbols = await downloadSymbols(NYSE_URL, "NYSE");
    const amexSymbols = await downloadSymbols(AMEX_URL, "AMEX");
    console.log(`✅ Loaded ${nasdaqSymbols.length} NASDAQ symbols`);
    console.log(`✅ Loaded ${nyseSymbols.length} NYSE symbols`);
    console.log(`✅ Loaded ${amexSymbols.length} AMEX symbols`);
    const allSymbols = [...nasdaqSymbols, ...nyseSymbols, ...amexSymbols];
    await saveSymbols(allSymbols);
    console.log(`✅ Saved ${allSymbols.length} symbols`);
}
main().catch(err => {
    console.error("❌ Error:", err);
});
//# sourceMappingURL=symbols.js.map