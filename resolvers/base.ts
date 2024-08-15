import { Amount, Duration, ResolveError, ResolveErrorCode } from '#lib/structs/index.js';
import type { Command, ExtractResolvableTypes } from '#lib/typings.js';
import { MessageArgumentType } from '#lib/utils/index.js';

export class BaseResolver {
	static [MessageArgumentType.String](input: string) {
		if (!input.length) throw new ResolveError(ResolveErrorCode.StringResolveFailed, input, `Không thể xử lý '${input}' thành string`);
		return input;
	}

	static [MessageArgumentType.Boolean](input: string) {
		const truthyResponse = ['1', 'true', '+', 't', 'yes', 'y', 'có'];
		const falsyResponse = ['0', 'false', '-', 'f', 'no', 'n', 'ko', 'không'];

		const boolean = input.toLowerCase();
		if (truthyResponse.includes(boolean)) return true;
		if (falsyResponse.includes(boolean)) return false;
		throw new ResolveError(ResolveErrorCode.BooleanResolveFailed, input, `Không thể xử lý '${input}' thành boolean`);
	}
	static [MessageArgumentType.Integer](input: string) {
		const parsed = Number(input);
		if (!Number.isInteger(parsed))
			throw new ResolveError(ResolveErrorCode.IntegerResolveFailed, input, `Không thể xử lý '${input}' thành 1 số tự nhiên`);

		return parsed;
	}
	static [MessageArgumentType.Hyperlink](input: string) {
		try {
			const result = new URL(input);
			return result;
		} catch (_) {
			throw new ResolveError(ResolveErrorCode.URLResolveFailed, input, `Không thể xử lý ${input} thành 1 URL`);
		}
	}
	static [MessageArgumentType.Number](input: string) {
		const parsed = Number(input);
		if (Number.isNaN(parsed)) throw new ResolveError(ResolveErrorCode.NumberResolveFailed, input, `Không thể xử lý '${input}' thành 1 số thực`);

		return parsed;
	}
	static [MessageArgumentType.Date](input: string) {
		const parsed = new Date(input);

		const time = parsed.getTime();
		if (Number.isNaN(time)) throw new ResolveError(ResolveErrorCode.DateResolveFailed, input, `Không thể xử lý '${input}' thành 1 ngày`);

		return parsed;
	}
	static [MessageArgumentType.Duration](input: string) {
		const { offset } = new Duration(input);

		if (isNaN(offset)) {
			throw new ResolveError(ResolveErrorCode.DurationResolveFailed, input, `Không thể xử lý '${input}' thành 1 khoảng thời gian`);
		}

		return offset;
	}
	static [MessageArgumentType.Amount](input: string) {
		const { amount } = new Amount(input);

		if (isNaN(amount)) {
			throw new ResolveError(ResolveErrorCode.DurationResolveFailed, input, `Không thể xử lý '${input}' thành 1 khoảng`);
		}

		return amount;
	}
	static [MessageArgumentType.Subcommand]<T extends Command<T> = Command>(
		input: string,
		{ command, locateTargetSubcommand = defaultLocateTargetSubcommand, locateSubcommands, display = defaultDisplayFn }: SubcommandResolverOptions
	) {
		let subcommand: T | Command | null = null;

		const subcommands = locateSubcommands?.(input, command) ?? command.subcommands;
		if (!subcommands) throw new ResolveError(ResolveErrorCode.SubcommandResolveFailed, input, `Không thể xử lý '${input}' thành 1 subcommand.`);

		subcommand = locateTargetSubcommand?.(input, command.subcommands ?? []);

		if (!subcommand) return subcommand;
		throw new ResolveError(
			ResolveErrorCode.SubcommandResolveFailed,
			input,
			`Không thể xử lý '${input}' thành 1 subcommand.\nYêu cầu đầu vào là 1 trong các giá trị sau:\n${subcommands?.map(display).join('\n')}`
		);
	}
}
function defaultDisplayFn<T extends Command>(command: T) {
	let str = `- \`${command.name}\``;
	if (command.description) str = `: ${command.description}`;
	return str;
}
function defaultLocateTargetSubcommand<T extends Command>(input: string, commands: T[]) {
	const target = commands.find((e) => {
		return e.name.toLowerCase() === input.toLowerCase();
	});

	if (!target) return null;
	return target;
}

type SubcommandResolverOptions<T extends Command = Command> = {
	command: T;
	locateTargetSubcommand?: (input: string, commands: T[]) => T | null;
	locateSubcommands?: (input: string, command: T) => T[];
	display?: (command: T) => string;
};

export type BaseResolvableType = ExtractResolvableTypes<typeof BaseResolver>;