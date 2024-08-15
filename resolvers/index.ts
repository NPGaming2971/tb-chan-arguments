import { ResolveError } from '#lib/structs/index.js';
import type { ResolveFunction } from '#lib/typings.js';
import { type MessageArgumentType, copyStaticProperties, isInvalidValue } from '#lib/utils/index.js';
import { BaseResolver, type BaseResolvableType } from './base.js';
import { DiscordResolver, type DiscordResolvableType } from './discord.js';

export class ResolverMixin {}
export interface ResolverMixin extends BaseResolver, DiscordResolver {}
copyStaticProperties(ResolverMixin, BaseResolver, DiscordResolver);

export type MixinResolvableType = BaseResolvableType & DiscordResolvableType;

/**
 * Xử lý input theo 1 list string.
 * Nếu input giống với 1 trong số những string trong list, trả lại input.
 * @param choices list string
 */
export function choiceArgs(...choices: string[]) {
	return (input: string) => {
		const result = choices.map((e) => e.toLowerCase()).includes(input.toLowerCase());
		if (!input) {
			throw new ResolveError(
				'ChoiceArgumentFailed',
				input,
				`Không thể xử lý '${input}' thành 1 trong các giá trị sau:\n${choices.map((e) => `\`${e}\``).join(', ')}`
			);
		}

		return result;
	};
}

/**
 * Xử lý tham số với 1 Regular Expression.
 * Nếu regex match được từ input, trả về 1 array match.
 * @param regex Regex muốn match
 * @param message Message của Error. (Default: `Regex '${regex} không match được gì.'`)
 */
export function regexArgs(regex: RegExp, message?: string) {
	return (input: string) => {
		const matches = Array.from(input.match(regex) ?? []);
		if (matches.length) return matches;

		throw new ResolveError('RegexArgumentFailed', input, message ?? `Regex '${regex} không match được gì.'`);
	};
}
/**
 * Resolver này sẽ bắt đầu xử lý tham số với nhiều type theo chiều từ trái sang phải.
 * Nếu xử lý thành công, kết thúc xử lý.
 * Nếu gặp lỗi, chuyển sang type tiếp theo.
 * @param fns Danh sách functions để chạy
 */
export function multipleArgs(fns: (MessageArgumentType | ResolveFunction)[]): ResolveFunction {
	return async (input: string, resolvable: any) => {
		for (const fn of fns) {
			let result: any;
			if (typeof fn === 'number') {
				const func = Reflect.get(ResolverMixin, fn);
				result = await func(input, resolvable);
			} else result = await fn(input, resolvable);

			if (!isInvalidValue(result)) return result;
		}

		throw new ResolveError('MultipleArgumentsResolveFailed', input);
	};
}
