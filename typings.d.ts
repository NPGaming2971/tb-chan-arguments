import type { Token, Args } from 'lexure';
import type { MessageArgumentType } from './utils/constants.ts';
import type { GuildChannel, GuildMember, Message, Role, User } from 'discord.js';

/**
 * Type của 1 strategy function.
 * @param input Đầu vào để xử lý
 * @param resolveFn Resolver để xử lý đầu vào
 * @param resolvable Dữ liệu khác cần thiết để xử lý đầu vào
 * @param args
 * @param resolved Những arg đã xử lý xong
 * @param controller Cung cấp 2 function để điều chỉnh index xử lý.
 */
export type StrategyFunction = (options: StrategyFunctionArgs) => Awaitable<any>;
type StrategyFunctionArgs = {
	arg: Token;
	resolveFn: ResolveFunction;
	resolvable: Record<string, any>;
	args: Args;
	argId: string;
	resolved: Record<string, any>;
	controller: Controller;
};

type Controller = {
	shift(n: number): void;
	unshift(n: number): void;
};

/**
 * Type của 1 Resolver
 * @param input Đầu vào để xử lý
 * @param resolvable Dữ liệu khác cần thiết để xử lý đầu vào
 */
export type ResolveFunction<T = any> = (input: string, resolvable: Record<string, any>) => Awaitable<T>;

/**
 * Type của 1 validate function.
 */
export type ValidateFunction<T = string> = (received: T) => Awaitable<void>;
export interface EmojiObject {
	name: string | null;
	id: string | null;
	animated?: boolean;
}

interface BaseCommand {
	name: string;
	description?: string;
	arguments: Arguments;
}

/**
 * Format của 1 command
 */
export interface Command<T extends BaseCommand = BaseCommand> extends BaseCommand {
	subcommands?: Command<T>[];
}

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type ValuesType<T extends ReadonlyArray<any> | ArrayLike<any> | Record<any, any>> = T extends ReadonlyArray<any>
	? T[number]
	: T extends ArrayLike<any>
	? T[number]
	: T extends object
	? T[keyof T]
	: never;

export type Argument =
	| StringishArgument
	| NumberishArgument
	| MessageArgument
	| GuildMemberArgument
	| ChannelArgument
	| BooleanArgument
	| RoleArgument
	| CustomArgument
	| SubcommandArgument;

export type Arguments = Record<string, Argument>;

export interface BaseArgument {
	name: string;
	description?: string;
	type: MessageArgumentType | ResolveFunction;
	/**
	 * Tham số này có phải là bắt buộc không?
	 * LƯU Ý: `default` field sẽ bị bỏ qua nếu `required: true`
	 */
	required?: boolean;
	/**
	 * Giá trị mặc định (chưa được resolve) mà argument này sẽ fallback về nếu không tìm thấy tham số đầu vào nào.
	 */
	default?: string;
	/**
	 * 1 custom function để validate input. Sẽ prompt user liên tục cho đến khi validate xong.
	 * Not implemented.
	 */
	validate?: ValidateFunction<any>;
	strategy?: Resolvable<StrategyFunction>;
}

export type Resolvable<T> = T | (() => T);

export interface StringishArgument extends BaseArgument {
	type: MessageArgumentType.String | MessageArgumentType.Hyperlink;
	validate?: ValidateFunction;
}
export interface NumberishArgument extends BaseArgument {
	type: MessageArgumentType.Number | MessageArgumentType.Integer | MessageArgumentType.Duration | MessageArgumentType.Amount;
	validate?: ValidateFunction<number>;
}
export interface BooleanArgument extends BaseArgument {
	type: MessageArgumentType.Boolean;
	validate?: ValidateFunction<boolean>;
}
export interface SubcommandArgument<T extends Command = Command> extends BaseArgument {
	type: MessageArgumentType.Subcommand;
	validate?: ValidateFunction<T>;
}
export interface DateArgument extends BaseArgument {
	type: MessageArgumentType.Date;
	validate?: ValidateFunction<Date>;
}
export interface ChannelArgument extends BaseArgument {
	type: MessageArgumentType.Channel;
	validate?: ValidateFunction<GuildChannel>;
}
export interface UserArgument extends BaseArgument {
	type: MessageArgumentType.User;
	validate?: ValidateFunction<User>;
}
export interface GuildMemberArgument extends BaseArgument {
	type: MessageArgumentType.GuildMember;
	validate?: ValidateFunction<GuildMember>;
	default?: '@me' | '@executor' | '@reference' | string;
}
export interface EmojiArgument extends BaseArgument {
	type: MessageArgumentType.Emoji;
	validate?: ValidateFunction<EmojiObject>;
}
export interface RoleArgument extends BaseArgument {
	type: MessageArgumentType.Role;
	validate?: ValidateFunction<Role>;
}
export interface MessageArgument extends BaseArgument {
	type: MessageArgumentType.Message;
	validate?: ValidateFunction<Message>;
}
export interface CustomArgument extends BaseArgument {
	type: ResolveFunction;
	validate?: ValidateFunction<any>;
}
export interface SubcommandArguments<T extends Command = Command> {
	$parent: T;
}
/**
 * Type của arg đã xử lý xong.
 */
export type ResolvedArguments = Record<string, any>;

export type Awaitable<T> = T | Promise<T>;

export type ExtractResolvableTypes<T> = {
	[K in keyof T]: T[K] extends (a: any, b: infer B) => any ? B : never;
};