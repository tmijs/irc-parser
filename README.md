# @tmi.js/irc-parser

IRC parsing package for the `@tmi.js/chat` library

# Install

```bash
npm i @tmi.js/irc-parser
```

# Usage

```ts
import {
	parse, parseTagsFromString, parseTag, parsePrefix,
	format, formatTags, formatChannel, formatPrefix,
	unescapeIrc, escapeIrc
} from '@tmi.js/irc-parser';
import type {
	IrcMessage, ChannelString,
	ParsedTags, ParsedTagData, ParseTagCallbackFn,
	FormatMessage
} from '@tmi.js/irc-parser';

handleMessage('@a-number-key=123;a-boolean-key=true :username@irc.example.com PRIVMSG #channel :Hello, world!');
// [#channel] <username> Hello, world!

function handleMessage(ircString: string) {
	const ircMessage = parse(ircString, (key, value, params) => {
		switch(key) {
			case 'a-number-key':
				return [ key, parseInt(value, 10) ];
			case 'a-boolean-key':
				return [ key, value === '1' || value === 'true' ];
		}
		return [ key, value ];
	});
	const { channel, command, params, prefix, tags } = ircMessage;
	switch(command) {
		case 'PING':
			ws.send(format({ command: 'PONG' }));
			break;
		case 'PRIVMSG':
			console.log(`[${channel}] <${prefix.user}> ${params[0]}`);
			if(params[0].startsWith('!help')) {
				ws.send(format({
					command: 'PRIVMSG',
					channel,
					params: [ helpString ]
				}));
			}
			break;
	}
}
```