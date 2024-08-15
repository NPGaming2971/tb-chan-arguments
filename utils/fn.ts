import type { Argument, Command } from '#lib/typings.js';
import type { Token } from 'lexure';

/**
 * Tạo ra 1 Token của lib 'lexure'.
 */
export function constructToken(value?: string | null): Token | undefined {
	if (!value) return;
	return { raw: value, trailing: '', value };
}

export function copyStaticProperties(target: any, ...sources: any[]): void {
	for (const source of sources) {
		Object.getOwnPropertyNames(source).forEach((prop) => {
			if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
				Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop) as PropertyDescriptor);
			}
		});
	}
}

export function isInvalidValue(value: any): value is undefined | null | number {
	return value === undefined || value === null || Number.isNaN(value);
}

export function generateCommandSyntax<T extends Command = Command>(command: T) {
	let str = `${command.name}`;
	if (!command.arguments) return str;

	for (const [name, arg] of Object.entries(command.arguments)) {
		str += ` ${generateCommandArgumentSyntax(name, arg)}`;
	}
	return str;
}

export function generateCommandArgumentSyntax(name: string, arg: Argument) {
	let argString = arg.name;
	if (arg.default) argString = `${name} (mặc định: "${arg.default}")`;

	if (arg.required) {
		argString = `<${argString}>`;
	} else argString = `[${argString}]`;

	return argString;
}

export function formatParseError<T extends Command = Command>(command: T, id: string) {
	let [syntax, pointer] = [command.name, ' '.repeat(command.name.length)];
	const arg = command.arguments[id];

	for (const [idx, arg] of Object.entries(command.arguments)) {
		const argString = ` ${generateCommandArgumentSyntax(idx, arg)}`;
		syntax += argString;
		pointer += ` ${(id === idx ? '^' : ' ').repeat(argString.length - 1)}`;
	}
	return `${syntax}\n${pointer}\n${arg.description}`;
}
