const tokens = new Map([
	['jack', 5e6],

	['billion', 1e9],
	['billions', 1e9],
	['b', 1e9],
	['tỉ', 1e9],
	['tỷ', 1e9],

	['million', 1e6],
	['millions', 1e6],
	['m', 1e6],
	['tr', 1e6],
	['triệu', 1e6],

	['thousand', 1e3],
	['thousands', 1e3],
	['th', 1e3],
	['ngh', 1e3],
	['k', 1e3],
	['ng', 1e3],
	['nghìn', 1e3],

	['t', 1e2],
	['hundred', 1e2],
	['hundreds', 1e2],
	['trăm', 1e2],

	['chục', 10],
	['ch', 10],
	['c', 10]
]);

export class Amount {
	public amount: number;

	public constructor(pattern: string) {
		this.amount = Amount.parse(pattern.toLowerCase());
	}

	private static readonly kPatternRegex =
		/(\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễếệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]*)/gi;
	private static readonly kCommaRegex = /,/g;
	private static readonly kAanRegex = /\ban?\b/gi;

	private static parse(pattern: string): number {
		let result = 0;
		let lastUnit = null;
		let valid = false;

		pattern = pattern.replace(Amount.kCommaRegex, '').replace(Amount.kAanRegex, '1');

		const matches = pattern.matchAll(Amount.kPatternRegex)!;
		for (const [, i, units] of matches) {
			const token = tokens.get(units);
			if (token !== undefined) {
				result += Number(i) * token;
				lastUnit = token;
				valid = true;
			}

			if (!units?.length) {
				result += (Number(i) * (lastUnit ?? 10)) / 10;
			}
		}

		return valid ? result : NaN;
	}
}
