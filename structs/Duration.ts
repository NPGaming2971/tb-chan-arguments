export enum Time {
	Nanosecond = 1 / 1_000_000,
	Microsecond = 1 / 1000,
	Millisecond = 1,
	Second = 1000,
	Minute = Second * 60,
	Hour = Minute * 60,
	Day = Hour * 24,
	Week = Day * 7,
	Month = Day * (365 / 12),
	Year = Day * 365,
}

const tokens = new Map([
	["nanosecond", Time.Nanosecond],
	["nanoseconds", Time.Nanosecond],
	["ns", Time.Nanosecond],

	["microsecond", Time.Microsecond],
	["microseconds", Time.Microsecond],
	["μs", Time.Microsecond],
	["us", Time.Microsecond],

	["millisecond", Time.Millisecond],
	["milliseconds", Time.Millisecond],
	["ms", Time.Millisecond],

	["giây", Time.Second],
	["second", Time.Second],
	["seconds", Time.Second],
	["sec", Time.Second],
	["secs", Time.Second],
	["s", Time.Second],

	["phút", Time.Minute],
	["minute", Time.Minute],
	["minutes", Time.Minute],
	["min", Time.Minute],
	["mins", Time.Minute],
	["m", Time.Minute],
	["p", Time.Minute],

	["giờ", Time.Hour],
	["hour", Time.Hour],
	["hours", Time.Hour],
	["hr", Time.Hour],
	["hrs", Time.Hour],
	["h", Time.Hour],

	["ngày", Time.Day],
	["day", Time.Day],
	["days", Time.Day],
	["d", Time.Day],

	["tuần", Time.Week],
	["week", Time.Week],
	["weeks", Time.Week],
	["wk", Time.Week],
	["wks", Time.Week],
	["w", Time.Week],

	["tháng", Time.Month],
	["month", Time.Month],
	["months", Time.Month],
	["b", Time.Month],
	["mo", Time.Month],

	["năm", Time.Year],
	["year", Time.Year],
	["years", Time.Year],
	["yr", Time.Year],
	["yrs", Time.Year],
	["y", Time.Year],
]);

const mappings = new Map([
	[Time.Nanosecond, "nanoseconds"],
	[Time.Microsecond, "microseconds"],
	[Time.Millisecond, "milliseconds"],
	[Time.Second, "seconds"],
	[Time.Minute, "minutes"],
	[Time.Hour, "hours"],
	[Time.Day, "days"],
	[Time.Week, "weeks"],
	[Time.Month, "months"],
	[Time.Year, "years"],
] as const);

/**
 * Chuyển string khoảng thời gian thành ms
 */
export class Duration {
	public offset: number;
	public nanoseconds = 0;
	public microseconds = 0;
	public milliseconds = 0;
	public seconds = 0;
	public minutes = 0;
	public hours = 0;
	public days = 0;
	public weeks = 0;
	public months = 0;
	public years = 0;
	public constructor(pattern: string) {
		let result = 0;
		let valid = false;

		pattern
			.toLowerCase()
			.replace(Duration.commaRegex, "")
			.replace(Duration.aAndAnRegex, "1")
			.replace(Duration.patternRegex, (_, i, units) => {
				const token = tokens.get(units);
				if (token !== undefined) {
					const n = Number(i);
					result += n * token;
					this[mappings.get(token)!] += n;
					valid = true;
				}
				return "";
			});

		this.offset = valid ? result : NaN;
	}

	public get fromNow(): Date {
		return this.dateFrom(new Date());
	}

	public dateFrom(date: Date): Date {
		return new Date(date.getTime() + this.offset);
	}

	private static readonly patternRegex = /(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*)/gi;
	private static readonly commaRegex = /,/g;
	private static readonly aAndAnRegex = /\ban?\b/gi;
}
