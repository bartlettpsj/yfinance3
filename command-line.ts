import minimist from "minimist";

// Get command line parameters:
// --symbol=xxx (default all)
// --interval=1d|1w|1m
// --start=dd/mm/yy (default end - 1 year)
// --end=dd/mm/yy (default today)
// --exchange=xxx (default NASDAQ)

export interface CommandLineArgs {
    symbol?: string;
    interval?: string;
    start: Date;
    end: Date;
    exchange?: string;
}

export function getCommandLine(startDefaultAdjustDays: number=365): CommandLineArgs {
    const argv = minimist(process.argv.slice(2));

    const symbol = argv.symbol as string || "AAPL";
    const interval = (argv.interval as string | undefined) || "1d";
    const end = argv.end ? new Date(argv.end) : new Date();
    const start = argv.start ? new Date(argv.start) : new Date(end.getTime() - startDefaultAdjustDays * 24 * 60 * 60 * 1000);
    const exchange = (argv.exchange as string | undefined) || "NASDAQ";

    return { symbol, interval, start, end, exchange };
}