import { ResolveError, ResolveErrorCode } from '#lib/structs/index.js';
import type { Awaitable, ExtractResolvableTypes } from '#lib/typings.js';
import {
	ChannelMessageRegex,
	ChannelRegex,
	EmojiRegex,
	MessageArgumentType,
	MessageLinkRegex,
	RoleMentionRegex,
	SnowflakeRegex,
	TwemojiRegex,
	UserMentionRegex
} from '#lib/utils/constants.js';
import { RequireModules } from '#lib/utils/index.js';
import type { Client, User, Message, PartialEmoji, Guild, GuildChannel } from 'discord.js';
declare type Discord = typeof import('discord.js');

const lib: any = {};

@RequireModules(lib, { Discord: 'discord.js' })
export class DiscordResolver {
	static Discord: Discord;

	static async [MessageArgumentType.Emoji](input: string): Promise<PartialEmoji> {
		const twemoji = TwemojiRegex.exec(input)?.[0] ?? null;

		if (twemoji) {
			return {
				name: twemoji,
				animated: false,
				id: undefined
			};
		}

		const emojiId = EmojiRegex.test(input);

		if (emojiId) {
			const resolved = lib.Discord.parseEmoji(input);

			if (resolved) {
				return resolved;
			}
		}

		throw new ResolveError(ResolveErrorCode.EmojiResolveFailed, input, `Không thể xử lý '${input}' thành 1 emoji`);
	}

	static async [MessageArgumentType.User](input: string, resolvable: { message: Message }) {
		const userId = UserMentionRegex.exec(input) ?? SnowflakeRegex.exec(input);
		const user = userId ? await resolvable.message.client.users.fetch(userId[1] as string).catch(() => null) : null;
		if (user) return user;
		throw new ResolveError(ResolveErrorCode.UserResolveFailed, input, `Không thể xử lý '${input}' thành 1 user`);
	}

	static async [MessageArgumentType.Message](input: string, resolvable: { message: Message }) {
		const { message } = resolvable;
		const target =
			(await resolveMessageById(lib.Discord, input, message)) ??
			(await resolveMessageByLink(lib.Discord, input, message)) ??
			(await resolveMessageByChannelAndMessage(lib.Discord, input, message));

		if (target) {
			return target;
		}

		throw new ResolveError(ResolveErrorCode.MessageResolveFailed, input, `Không thể xử lý '${input}' thành 1 tin nhắn`);
	}

	static async [MessageArgumentType.Role](input: string, resolvable: { guild: Guild }) {
		const { guild } = resolvable;
		const role = (await resolveRoleById(input, guild)) ?? resolveRoleByQuery(input, guild);
		if (role) return role;
		throw new ResolveError(ResolveErrorCode.RoleResolveFailed, input, `Không thể xử lý '${input}' thành 1 role`);
	}

	static [MessageArgumentType.Channel](input: string, resolvable: { message: Message }) {
		const channelId = (ChannelRegex.exec(input)?.[1] ?? input) as string;
		const channel = (resolvable.message.guild ? resolvable.message.guild.channels : resolvable.message.client.channels).cache.get(channelId);
		if (channel) return channel as GuildChannel;
		throw new ResolveError(ResolveErrorCode.ChannelResolveFailed, input, `Không thể xử lý '${input}' thành 1 kênh`);
	}

	static async [MessageArgumentType.GuildMember](input: string, resolvable: { guild: Guild }) {
		const member = (await resolveMemberById(input, resolvable.guild)) ?? (await resolveMemberByQuery(input, resolvable.guild));
		if (member) return member;
		throw new ResolveError(ResolveErrorCode.GuildMemberResolveFailed, input, `Không thể xử lý '${input}' thành 1 thành viên máy chủ`);
	}
}
async function resolveMemberById(argument: string, guild: Guild) {
	const memberId = UserMentionRegex.exec(argument) ?? SnowflakeRegex.exec(argument);
	return memberId ? guild.members.fetch(memberId[1] as string).catch(() => null) : null;
}

async function resolveMemberByQuery(argument: string, guild: Guild) {
	const members = await guild.members.fetch({ query: argument, limit: 1 }).catch(() => null);
	return members?.first() ?? null;
}
async function resolveRoleById(input: string, guild: Guild) {
	const roleId = RoleMentionRegex.exec(input) ?? SnowflakeRegex.exec(input);
	return roleId ? guild.roles.fetch(roleId[1]) : null;
}

function resolveRoleByQuery(input: string, guild: Guild) {
	const lowerCaseArgument = input.toLowerCase();
	return guild.roles.cache.find((role) => role.name.toLowerCase() === lowerCaseArgument) ?? null;
}

function resolveMessageById(_lib: Discord, input: string, message: Message): Awaitable<Message | null> {
	if (!SnowflakeRegex.test(input)) {
		return null;
	}
	return message.channel?.messages.fetch(input).catch(() => null);
}

async function resolveMessageByLink(lib: Discord, input: string, message: Message): Promise<Message | null> {
	if (!message.guild) return null;

	const matches = MessageLinkRegex.exec(input);
	if (!matches) {
		return null;
	}

	const [, guildId, channelId, messageId] = matches;

	const guild = message.client.guilds.cache.get(guildId);
	if (guild !== message.guild) return null;

	return getMessageFromChannel(lib, message.client, channelId, messageId, message.author);
}

async function resolveMessageByChannelAndMessage(lib: Discord, input: string, message: Message): Promise<Message | null> {
	const result = ChannelMessageRegex.exec(input)?.groups;

	if (!result) {
		return null;
	}

	return getMessageFromChannel(lib, message.client, result.channelId, result.messageId, message.author);
}

async function getMessageFromChannel(
	lib: Discord,
	client: Client,
	channelId: string,
	messageId: string,
	originalAuthor: User
): Promise<Message | null> {
	const channel = client.channels.cache.get(channelId);
	if (!channel || channel.type === lib.ChannelType.GuildCategory || channel.type === lib.ChannelType.GroupDM) return null;

	if (!(channel.type === lib.ChannelType.GuildText, lib.ChannelType.GuildAnnouncement || channel.type === lib.ChannelType.GuildAnnouncement)) {
		return null;
	}

	if (!channel.isDMBased() && !channel.viewable) {
		return null;
	}

	if (!channel.isDMBased() && !channel.permissionsFor(originalAuthor)?.has('ViewChannel')) {
		return null;
	}

	return channel.messages.fetch(messageId);
}

export type DiscordResolvableType = ExtractResolvableTypes<typeof DiscordResolver>