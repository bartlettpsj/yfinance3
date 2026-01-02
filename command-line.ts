import minimist from "minimist";

// Get command line parameters:
// --symbol=xxx (default all)
// --interval=1d|1w|1m
// --start=ccyy-mm-dd (default end - 1 year)
// --end=ccyy-mm-dd (default today)
// --exchange=xxx (default NASDAQ)
// --dow=(1 thru 7) (default 0 = nothing)

export interface CommandLineArgs {
    symbol?: string;
    interval: string;
    start: Date;
    end: Date;
    exchange?: string;
    dow: number; // 1 (Sunday) → 7 (Saturday). JS=// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export function getCommandLine(startDefaultAdjustDays: number=365, symbolDefault: string=""): CommandLineArgs {
    const argv = minimist(process.argv.slice(2));

    const symbol = argv.symbol as string || symbolDefault;
    const interval = (argv.interval as string | undefined) || "1d";
    const end = argv.end ? new Date(argv.end) : new Date();
    const start = argv.start ? new Date(argv.start) : new Date(end.getTime() - startDefaultAdjustDays * 24 * 60 * 60 * 1000);
    const exchange = (argv.exchange as string | undefined) || "NASDAQ";
    const dow = (argv.dow as number) || 0;

    return { symbol, interval, start, end, exchange, dow };
}