## @tb-chan/arguments  

This library aims to help with resolving user input string to meaningful data.  
For internal uses only.  
  
(For whatever reason I can't type proper Vietnamese in vscode)  
For simplicity sake, let's start with a working example.  
  
```js
import { preprocessArgs, processArgs, findCommandInMap } from '@tb-chan/arguments';
import { Client } from 'discord.js';

const client = new Client({
	intents: ['GuildMessages', 'Guilds']
});

const commands = new Map([
	'test',
	{
		name: 'mycommand',
		arguments: {
			foo: {
				name: 'foo',
				type: MessageArgumentType.String,
				required: true
			}
		}
	}
]);

client.on('ready', () => {
	console.log(`${client.user.username} is ready!`);
});

client.on('messageCreate', (message) => {
	const args = preprocessArgs(message.content, 'tb');
	if (!args) return;

	const command = findCommandInMap({ args, commands });
    if (!command) return;

	const result = processArgs({
		command,
		args,
		resolvable: { guild: message.guild, message }
	});

	console.log(result);
});
```
  
Pretty complexed, ain't it? Let's break down the code into parts.