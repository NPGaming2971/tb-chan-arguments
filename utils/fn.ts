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
