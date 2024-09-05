export type ChannelString = `#${string}`;

export interface IrcMessage {
	raw: string;
	prefix: Partial<Record<'nick' | 'user' | 'host', string>>;
	command: string;
	channel: '' | ChannelString;
	params: string[];
	rawTags: Record<string, string>;
	tags: Record<string, any>;
}

export type ParseTagCallbackFn = (key: string, value: string, messageParams: IrcMessage['params']) => [ key: string, value: any ];

const ircEscapedChars = <const>{
	's': ' ',
	'n': '\n',
	'r': '\r',
	':': ';',
	'\\': '\\',
};
const ircUnescapedChars = <const>{
	' ': 's',
	'\n': 'n',
	'\r': 'r',
	';': ':',
	'\\': '\\',
};

export function unescapeIrc(value: string) {
	if(!value || !value.includes('\\')) {
		return value;
	}
	return value.replace(/\\[snr:\\]/g, match => ircEscapedChars[match[1] as keyof typeof ircEscapedChars]);
}

export function escapeIrc(value: string | number) {
	if(typeof value === 'number') {
		value = value.toString();
	}
	return value.replace(/[\s\n\r;\\]/g, match => '\\' + ircUnescapedChars[match as keyof typeof ircUnescapedChars] || match);
}

export function parse(line: string, parseTagCb?: ParseTagCallbackFn): IrcMessage;
export function parse(line: '', parseTagCb?: ParseTagCallbackFn): undefined;
export function parse(line: string, parseTagCb?: ParseTagCallbackFn): IrcMessage | undefined {
	if(!line) {
		return;
	}
	let offset = 0;
	const getNextSpace = () => line.indexOf(' ', offset);
	const advanceToNextSpace = (start?: number) => {
		if(start === undefined) {
			start = getNextSpace();
			if(start === -1) {
				offset = line.length;
				return;
			}
		}
		else if(start === -1) {
			offset = line.length;
			return;
		}
		offset = start + 1;
	};
	const charIs = (char: string, start = offset) => line[start] === char;
	const raw = line;
	let tagsRawString: string = '';
	if(charIs('@')) {
		const tagsEnd = getNextSpace();
		tagsRawString = line.slice(1, tagsEnd);
		advanceToNextSpace(tagsEnd);
	}
	let prefix: IrcMessage['prefix'] = {};
	if(charIs(':')) {
		const prefixEnd = getNextSpace();
		const prefixRaw = line.slice(offset + 1, prefixEnd);
		prefix = parsePrefix(prefixRaw);
		advanceToNextSpace(prefixEnd);
	}
	const commandEnd = getNextSpace();
	const command = line.slice(offset, commandEnd === -1 ? undefined : commandEnd);
	advanceToNextSpace(commandEnd);
	let channel: IrcMessage['channel'] = '';
	if(charIs('#')) {
		const channelEnd = getNextSpace();
		if(channelEnd === -1) {
			channel = line.slice(offset) as ChannelString;
			advanceToNextSpace();
		}
		else {
			channel = line.slice(offset, channelEnd) as ChannelString;
			advanceToNextSpace(channelEnd);
		}
	}
	const params: IrcMessage['params'] = [];
	while(offset < line.length) {
		if(charIs(':')) {
			params.push(line.slice(offset + 1));
			break;
		}
		const nextSpace = getNextSpace();
		params.push(line.slice(offset, nextSpace));
		advanceToNextSpace(nextSpace);
	}
	const { rawTags, tags } = parseTagsFromString(tagsRawString, params, parseTagCb);
	const ircMessage = { raw, rawTags, tags, prefix, command, channel, params };
	return ircMessage;
}

export interface FormatMessage {
	tags?: IrcMessage['tags'];
	command: IrcMessage['command'];
	prefix?: IrcMessage['prefix'];
	channel?: string;
	params?: IrcMessage['params'];
}

export function format(ircMessage: FormatMessage): string {
	const { tags, prefix: p, command, channel, params } = ircMessage;
	const prefixWith = (n: string, c: string = ' ') => n ? `${c}${n}` : null;
	const tagsStr = tags ? prefixWith(formatTags(tags), '@') : null;
	const prefixStr = p ? prefixWith(formatPrefix(p), ':') : null;
	const channelStr = channel ? formatChannel(channel) : null;
	const paramsStr = params && params.length ? prefixWith(params.join(' '), ':') : null;
	return [ tagsStr, prefixStr, command, channelStr, paramsStr ].filter(Boolean).join(' ');
}

export interface ParsedTagData {
	unescapedKey: string;
	unescapedValue: string;
	key: string;
	value: unknown;
}

export function parseTag(rawKey: string, rawValue: string, messageParams?: IrcMessage['params'], cb?: ParseTagCallbackFn): ParsedTagData {
	const unescapedKey = unescapeIrc(rawKey);
	let key: string = unescapedKey;
	const unescapedValue = unescapeIrc(rawValue);
	let value: unknown = unescapedValue;
	if(cb) {
		[ key, value ] = cb(key, unescapedValue, messageParams ?? []);
	}
	return { unescapedKey, unescapedValue, key, value };
}

export interface ParsedTags {
	rawTags: IrcMessage['rawTags'];
	tags: IrcMessage['tags'];
}

export function parseTagsFromString(tagsRawString: string, messageParams?: IrcMessage['params'], cb?: ParseTagCallbackFn): ParsedTags {
	const rawTags: IrcMessage['rawTags'] = {};
	const tags: IrcMessage['tags'] = {};
	if(!tagsRawString) {
		return { rawTags, tags };
	}
	tagsRawString.split(';').forEach(str => {
		const [ rawKey, rawValue ] = str.split('=');
		const { unescapedKey, unescapedValue, key, value } = parseTag(rawKey, rawValue, messageParams, cb);
		rawTags[unescapedKey] = unescapedValue;
		tags[key] = value;
	});
	return { rawTags, tags };
}

export function parsePrefix(prefixRaw: string) {
	const prefix: IrcMessage['prefix'] = {};
	if(!prefixRaw) {
		return prefix;
	}
	if(prefixRaw.includes('!')) {
		const [ nick, userHost ] = prefixRaw.split('!');
		prefix.nick = nick;
		[ prefix.user, prefix.host ] = userHost.includes('@') ? userHost.split('@') : [ userHost, undefined ];
	}
	else if(prefixRaw.includes('@')) {
		[ prefix.user, prefix.host ] = prefixRaw.split('@');
	}
	else {
		prefix.host = prefixRaw;
	}
	return prefix;
}

export function formatTags(tags: Record<string, string> | [ string, string ][]): string {
	const entries = Array.isArray(tags) ? tags : Object.entries(tags);
	return entries.map(([ key, value ]) =>
		`${escapeIrc(key)}=${escapeIrc(value.toString())}`
	).join(';');
}

export function formatPrefix(prefix: IrcMessage['prefix']) {
	if(!prefix) {
		return '';
	}
	const { nick, user, host } = prefix;
	if(!nick) {
		return '';
	}
	return `${nick}${user ? `!${user}` : ''}${host ? `@${host}` : ''}`;
}

export function formatChannel(channel: string) {
	return channel ? `${channel.startsWith('#') ? channel : `#${channel}`}` : '';
}