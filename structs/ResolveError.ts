export class ResolveError extends Error {
	name: string = 'ResolveError';
	code: string;
	input: string;

	constructor(code: ResolveErrorCode | string, input: string, message?: string) {
		super();
		this.code = Reflect.get(ResolveErrorCode, code) || code;
		if (!code) this.code = 'Unknown'
		this.input = input;
		this.message = message ?? `Xử lý tham số cho '${input}' thất bại.`;
	}
}

export enum ResolveErrorCode {
	// Resolver
	StringResolveFailed,
	IntegerResolveFailed,
	BooleanResolveFailed,
	GuildMemberResolveFailed,
	UserResolveFailed,
	EmojiResolveFailed,
	ChannelResolveFailed,
	AmountResolveFailed,
	DateResolveFailed,
	NumberResolveFailed,
	URLResolveFailed,
	SubcommandResolveFailed,
	MessageResolveFailed,
	DurationResolveFailed,
	RoleResolveFailed,
	// Strategy
	ManyStrategyFailed
}
