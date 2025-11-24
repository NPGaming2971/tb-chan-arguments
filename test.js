import { preprocessArgs, processArgs, findCommandInMap, MessageArgumentType, restStrategy } from './dist/index.js';
import { Client } from 'discord.js';

const client = new Client({
	intents: ['GuildMessages', 'Guilds', 'MessageContent']
});

const commands = new Map([
	[
		// The map key will be used for lookup.
		'mycommand',
		{
			name: 'mycommand',
			// This command has 2 arguments: foo, bar; resolved using type string and number, respectively
			arguments: {
				foo: {
					name: 'foo',
					type: MessageArgumentType.String,
					// This is a required arg, parsing will fail if this is missing.
					required: true
				},
				bar: {
					name: 'bar',
					type: MessageArgumentType.Number,
					strategy: restStrategy()
				}
			}
		}
	]
]);

(async () => {
	// client.on('messageCreate', async (message) => {
	const args = preprocessArgs('!mycommand content', '!');
	if (!args) return;

	const command = findCommandInMap({ args, commands });
	if (!command) return;

	const result = await processArgs({
		command,
		args
	});

	console.log(result);
})();
// });

// client.login('TOKEN');
