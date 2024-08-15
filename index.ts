import { Lexer, Parser, prefixedStrategy, Args, type Token, joinTokens } from 'lexure';
import type { Command, UnionToIntersection, ValuesType } from './typings.js';
import { constructToken, isInvalidValue } from './utils/index.js';
import { defaultStrategy } from './strategies.js';
import { ResolverMixin, type MixinResolvableType } from './resolvers/index.js';
import { ParseError, ParseErrorCode } from './structs/index.js';
/**
 * Xử lý ban đầu input thành `Args` của lib lexure để thuận tiện cho việc xử lý khác.
 * LƯU Ý: Đây KHÔNG phải là args của người dùng, vì tên lệnh vẫn còn.
 *
 * Ví dụ: `tbtest 1 2` sẽ được sử lý thành `Args { test, 1, 2 }`. Bạn cần tự loại bỏ tên lệnh `test` ở đây để xử lý được input của user.
 * @param input Đầu vào
 * @param prefix Prefix của bot
 * @returns
 */
export function preprocessArgs(input: string, prefix: string = '') {
	const out = new Lexer(input).lexCommand(() => (input.toLocaleLowerCase().startsWith(prefix.toLowerCase()) ? prefix.length : null));
	if (!out) return null;

	const [cmd, rest] = out;
	const parser = new Parser([cmd, ...rest()]).setUnorderedStrategy(prefixedStrategy(['--'], ['=', ':'])).parse();

	const args = new Args(parser);
	return args;
}

/**
 * Tìm 1 command theo tên. Consume token đến khi tìm ra.
 * @param param0
 * @returns
 */
export function findCommandInMap<T extends Command, I extends Map<string, T>>({ commands, args, mapAlias = () => [] }: FindCommandsOptions<T, I>) {
	const tokens: Token[] = [];

	while (true) {
		tokens.push(...args.many(1));
		const input = joinTokens(tokens).toLowerCase();
		const commandKey = Array.from(commands.keys()).find(
			(c) => String(c).toLowerCase() === input || Boolean(mapAlias(commands.get(c)!)?.includes(input))
		) as string;
		const command = commands.get(commandKey);

		if (command) return command;
		if (args.finished) return null;
	}
}
type FindCommandsOptions<T extends Command, I extends Map<string | RegExp, T>> = {
	commands: I;
	args: Args;
	mapAlias: (i: T) => string[];
};
export async function processArgs({ command, args, resolvable, state }: ProcessArgsOption) {
	const commandArgs = command.arguments;
	const resolved = state ?? {};

	if (!commandArgs) return resolved;
	for (const [argId, data] of Object.entries(commandArgs)) {
		let result = null;

		const arg = (data.name.startsWith('--') ? constructToken(args.option(argId)) : args.many(1).at(0)) ?? constructToken(data.default);
		const resolveFn = typeof data.type === 'function' ? data.type : Reflect.get(ResolverMixin, data.type);
		if (!resolveFn) {
			throw new ParseError(ParseErrorCode.ResolverNotFound, { argId, command, message: `Không tìm thấy resolver cho argument '${argId}'` });
		}

		if (!arg) {
			if (data.required)
				throw new ParseError(ParseErrorCode.MissingRequiredArgument, { argId, command, message: `Tham số '${argId}' là tham số bắt buộc.` });
			continue;
		}

		const controller = {
			unshift(n: number) {
				const set = args.state.usedIndices;
				const arr = Array.from(set);
				const indices = arr.slice(arr.length - n);

				indices.forEach((i) => set.delete(i));
			},
			shift(n: number) {
				if (n <= 0 || !Number.isInteger(n)) throw new RangeError('n has to be a positive integer.');
				const set = args.state.usedIndices;
				const arr = Array.from(set);
				let last = arr[arr.length - 1];

				while (n > 0) {
					last++;
					set.add(last);
					n--;
				}
			}
		};

		// Xử lý tham số
		result = await (data.strategy ?? defaultStrategy()).call(null, {
			arg,
			resolveFn,
			controller,
			argId,
			args,
			resolvable,
			resolved
		});

		if (isInvalidValue(result) && data.required) {
			throw new ParseError(ParseErrorCode.MissingRequiredArgument, {
				argId,
				command,
				input: arg.value,
				message: `Việc xử lý tham số '${argId}' không cho ra kết quả nhưng đó lại là tham số bắt buộc.`
			});
		}

		//@ts-ignore
		await data.validate?.(result);
		Reflect.set(resolved, argId, result);
	}

	return resolved;
}

type ProcessArgsOption<T extends Command = Command> = {
	command: T;
	args: Args;
	resolvable: Partial<UnionToIntersection<ValuesType<MixinResolvableType>>>;
	state?: Record<string, any>;
};
