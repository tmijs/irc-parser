# @tmi.js/parser

IRC parsing package for the @tmi.js/chat library

# Install

```bash
npm i @tmi.js/irc-parser
```

# Usage

```ts
import { escapeIrc, parse, unescapeIrc, parseTagsFromString, parseTag } from '@tmi.js/irc-parser';
import type { IrcMessage } from '@tmi.js/irc-parser';

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
			// Respond to PING
			break;
		case 'PRIVMSG':
			console.log(`[${channel}] <${prefix.user}> ${params[0]}`);
			break;
	}
}
```