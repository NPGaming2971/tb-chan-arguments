import { joinTokens } from 'lexure';
import type { StrategyFunction } from './typings.js';
import { ResolveError, ResolveErrorCode } from './structs/index.js';

/**
 * Strategy mặc định.
 * Chỉ gọi mỗi resolver và không làm gì thêm.
 * @returns StrategyFunction
 */
export function defaultStrategy(): StrategyFunction {
	return async ({ resolveFn, arg, resolvable }) => {
		const resolved = await resolveFn.call(null, arg.value, resolvable);
		return resolved;
	};
}

/**
 * Strategy này sẽ sử dụng toàn bộ input còn lại và trả lại kết quả.
 * @returns StrategyFunction
 */
export function restStrategy(): StrategyFunction {
	return async ({ arg, resolveFn, resolvable, args }) => {
		const input = joinTokens([arg, ...args.many()]);
		const resolved = await resolveFn.call(null, input, resolvable);
		return resolved;
	};
}

/**
 * Strategy này sử dụng nhiều input để xử lý kết quả.
 * @returns StrategyFunction
 */
export function manyStrategy(options: ManyStrategyArgs): StrategyFunction {
	const { times, absolute } = options;
	if (!Number.isInteger(times) || times <= 1) throw new Error('options.times must be an integer larger than 1.');

	return async ({ arg, resolveFn, resolvable, args, controller: { unshift } }) => {
		const tokens = [arg, ...args.many(times - 1)];
		const resolvedArgs = [];

		for (let token of tokens) {
			const resolved = await resolveFn.call(null, token.value, resolvable);

			if (resolved.isOk()) {
				resolvedArgs.push(resolved.unwrap());
			} else break;
		}

		if (absolute && resolvedArgs.length < times) {
			throw new ResolveError(
				ResolveErrorCode.ManyStrategyFailed,
				arg.value,
				`Xử lý nhiều tham số thất bại: Yêu cầu xử lý ${options.times}, chỉ xử lý được ${resolvedArgs.length}.`
			);
		}

		if (resolvedArgs.length < tokens.length) {
			unshift(tokens.length - resolvedArgs.length - 1);
		}

		return resolvedArgs;
	};
}
type ManyStrategyArgs = {
	/**
	 * Số lần resolve tối đa.
	 */
	times: number;
	/**
	 * Nếu `absolute: true`, resolver sẽ throw nếu không đủ số lần resolve `times`.
	 */
	absolute?: boolean;
};

/**
 * Strategy này trước hết thử resolve input.
 * - Nếu thành công, trả lại kết quả.
 * - Nếu thất bại, sử dụng input sau và thử resolve lại.
 *
 * Quá trình này lặp lại đến khi resolve thành công.
 * @returns StrategyFunction
 */
export function accumulateStrategy({ allowedErrors = 0, ignoreSuccess = 0 }: AccumulatedStrategyArgs = {}): StrategyFunction {
	let errCount = allowedErrors;
	return async ({ arg, resolveFn, resolvable, args, controller: { unshift } }) => {
		const tokens = [arg];

		while (true) {
			const resolved = await resolveFn.call(null, joinTokens(tokens), resolvable);
			if (resolved.isOk()) ignoreSuccess--;
			else errCount--;

			if (ignoreSuccess < 0 || allowedErrors < 0) {
				errCount = allowedErrors;
				unshift(1);
				return resolved;
			} else {
				tokens.push(...args.many(1));
			}
		}
	};
}

type AccumulatedStrategyArgs = {
	allowedErrors?: number;
	ignoreSuccess?: number;
};
