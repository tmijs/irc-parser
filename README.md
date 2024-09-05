# @tmi.js/irc-parser

IRC parsing package for the `@tmi.js/chat` library

# Install

```bash
npm i @tmi.js/irc-parser
```

# Usage

```ts
import { unescapeIrc, escapeIrc, parseTagsFromString, parseTag, parse, parsePrefix, format, formatTags, formatChannel, formatPrefix } from '@tmi.js/irc-parser';
import type { IrcMessage, ChannelString, FormatMessage, ParsedTags, ParsedTagData, ParseTagCallbackFn } from '@tmi.js/irc-parser';

function handleMessage(ircString: string) {
	const ircMessage = parse(ircString, (key, value, params) => {
		switch(key) {
			case 'aNumberKey': return [ key, parseInt(value, 10) ];
			case 'aBooleanKey': return [ key, value === '1' || value === 'true' ];
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
				ws.send(format({ command: 'PRIVMSG', channel, params: [ helpString ] }));
			}
			break;
	}
}
```