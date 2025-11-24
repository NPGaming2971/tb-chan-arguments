## @tb-chan/arguments

This library aims to help with resolving user input string to meaningful data.  
For internal uses only.

Example code:

```js
import { preprocessArgs, processArgs, findCommandInMap, MessageArgumentType, restStrategy } from '@tb-chan/arguments';
import { Client } from 'discord.js';

const client = new Client({
	intents: ['GuildMessages', 'Guilds', 'MessageContent']
});

// Define your command store so the lib can look it up when parsing.
// Or you can just specify which command to run directly.
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
					// Introducing strategy fn, function that let you control how many argument token you want to use for resolving. This built-in strategy takes the rest of the args tokens
					strategy: restStrategy()
				}
			}
		}
	]
]);

client.on('messageCreate', async (message) => {
	// Example content: '!mycommand content 42'

	// Preprocessing the content into 'token'
	// Resolved token: 'mycommand', 'content', '42'
	const args = preprocessArgs(message.content, '!');
	if (!args) return;

	// Find the command in the command store using the first token, consuming subsequent token if not found, remove the used token if found.
	const command = findCommandInMap({ args, commands });
	if (!command) return;

	// Parse the arguemnts using the leftover token
	const result = await processArgs({
		command,
		args,
		resolvable: { guild: message.guild, message }
	});

	console.log(result); // { foo: "content", bar: 42 }
});

client.login('TOKEN');
```
