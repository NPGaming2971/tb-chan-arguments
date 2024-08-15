import type { Command } from '#lib/typings.js';

export class ParseError<T extends Command = Command> extends Error {
	name: string = 'ParseError';
	code: string;
	input?: string;
	argId: string;
	command: T;

	constructor(code: ParseErrorCode | string, { argId, command, input, message }: ParseErrorOptions<T>) {
		super();
		this.argId = argId;
		this.command = command;
		this.input = input;

		this.code = Reflect.get(ParseErrorCode, code) || code;
		if (!code) this.code = 'Unknown';
		this.message = message ?? `Xử lý tham số '${argId}' thất bại.`;
	}
}

type ParseErrorOptions<T extends Command = Command> = {
	message?: string;
	input?: string;
	argId: string;
	command: T;
};

export enum ParseErrorCode {
	ResolverNotFound,
	MissingRequiredArgument
}
