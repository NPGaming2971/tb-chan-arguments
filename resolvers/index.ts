import { copyStaticProperties } from '#lib/utils/fn.js';
import { BaseResolver, type BaseResolvableType } from './base.js';
import { DiscordResolver, type DiscordResolvableType } from './discord.js';

export class ResolverMixin {}
export interface ResolverMixin extends BaseResolver, DiscordResolver {}
copyStaticProperties(ResolverMixin, BaseResolver, DiscordResolver);

export type MixinResolvableType = BaseResolvableType & DiscordResolvableType