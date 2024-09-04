// @ts-check

import util from 'node:util';
import { describe, it, todo } from 'node:test';
import assert from 'node:assert/strict';
import { unescapeIrc, escapeIrc, parseTagsFromString, parseTag, parse, parsePrefix } from '@tmi.js/irc-parser';

util.inspect.defaultOptions.depth = null;

const regexKebabToCamel = /-(\w)/g;

/**
 * @param {string} str
 */
function kebabToCamel(str) {
	return str.replace(regexKebabToCamel, (_, match) => match.toUpperCase());
}

describe('unescaping irc tag', t => {
	it('does not alter empty strings', () => {
		assert.equal(unescapeIrc(''), '');
	});
	it('does not alter plain alphanumeric/space', () => {
		assert.equal(unescapeIrc('snakes and ladders'), 'snakes and ladders');
	});
	it('replaces known escape sequences', () => {
		assert.equal(unescapeIrc('\\s'), ' ', 'spaces');
		assert.equal(unescapeIrc('\\n'), '\n', 'new lines');
		assert.equal(unescapeIrc('\\r'), '\r', 'carriage returns');
		assert.equal(unescapeIrc('\\:'), ';', 'semicolons');
		assert.equal(unescapeIrc('\\\\'), '\\', 'backslashes');
	});
});

describe('escaping irc tag', t => {
	it('does not alter empty strings', () => {
		assert.equal(escapeIrc(''), '');
	});
	it('replaces multiple known characters', () => {
		assert.equal(escapeIrc('snakes and ladders'), 'snakes\\sand\\sladders');
	});
	it('replaces known characters', () => {
		assert.equal(escapeIrc(' '), '\\s', 'spaces');
		assert.equal(escapeIrc('\n'), '\\n', 'new lines');
		assert.equal(escapeIrc('\r'), '\\r', 'carriage returns');
		assert.equal(escapeIrc(';'), '\\:', 'semicolons');
		assert.equal(escapeIrc('\\'), '\\\\', 'backslashes');
	});
	it('stringifies numbers', () => {
		assert.equal(escapeIrc(1), '1', 'numbers');
	});
});

describe('parsing irc tags', t => {
	it('empty string is empty', () => {
		assert.deepStrictEqual(
			parseTagsFromString(''),
			{ rawTags: {}, tags: {} }
		);
	});
	it('single tag', () => {
		assert.deepStrictEqual(
			parseTagsFromString('a=b'),
			{ rawTags: { a: 'b' }, tags: { a: 'b' } }
		);
	});
	it('multiple tags', () => {
		assert.deepStrictEqual(
			parseTagsFromString('a=b;c=d'),
			{ rawTags: { a: 'b', c: 'd' }, tags: { a: 'b', c: 'd' } }
		);
	});
	it('preserve tag key', () => {
		assert.deepStrictEqual(
			parseTagsFromString('a-b=c'),
			{ rawTags: { 'a-b': 'c' }, tags: { 'a-b': 'c' } }
		);
	});
	it('using a transformation callback', () => {
		assert.deepStrictEqual(
			parseTagsFromString('a-b=0', [], (k, v, p) => [ kebabToCamel(k), parseInt(v) ]),
			{ rawTags: { 'a-b': '0' }, tags: { aB: 0 } }
		);
	});
});

describe('parsing irc prefix', t => {
	it('empty string is all undefined', () => {
		assert.deepStrictEqual(parsePrefix(''), { nick: undefined, user: undefined, host: undefined });
	});
	it('parses host only', () => {
		assert.deepStrictEqual(parsePrefix('host'), { nick: undefined, user: undefined, host: 'host' });
	});
	it('parses user and host', () => {
		assert.deepStrictEqual(parsePrefix('user@host'), { nick: undefined, user: 'user', host: 'host' });
	});
	it('parses nick and user', () => {
		assert.deepStrictEqual(parsePrefix('nick!user'), { nick: 'nick', user: 'user', host: undefined });
	});
	it('parses full', () => {
		assert.deepStrictEqual(parsePrefix('nick!user@host'), { nick: 'nick', user: 'user', host: 'host' });
	});
});

describe('parsing messages', t => {
	it('empty string is undefined', () => {
		assert.deepStrictEqual(parse(''), undefined);
	});
	it('basic messages', async t => {
		/** @type {{ message: string; expected: import('@tmi.js/irc-parser').IrcMessage; }[]} */
		const tests = [
			{
				message: 'PING message',
				expected: {
					channel: '',
					command: 'PING',
					params: [],
					prefix: { host: undefined, nick: undefined, user: undefined },
					raw: 'PING',
					rawTags: {},
					tags: {},
				}
			},
			{
				message: 'PING message with originator parameter',
				expected: {
					channel: '',
					command: 'PING',
					params: [ 'tmi.twitch.tv' ],
					prefix: { host: undefined, nick: undefined, user: undefined },
					raw: 'PING :tmi.twitch.tv',
					rawTags: {},
					tags: {},
				}
			},
		];
		for(let i = 0; i < tests.length; i++) {
			const { message, expected } = tests[i];
			await t.test(message, () => {
				assert.deepStrictEqual(parse(expected.raw), expected);
			});
		}
	});
	it('messages with tags', async t => {
		/** @type {{ message: string; tagParser?: import('@tmi.js/irc-parser').ParseTagCallbackFn; expected: import('@tmi.js/irc-parser').IrcMessage; }[]} */
		const tests = [
			{
				message: 'PRIVMSG message with tag parser',
				tagParser: (key, value, params) => {
					key = kebabToCamel(key);
					switch(key) {
						case 'tmiSentTs':
						{
							return [ key, parseInt(value, 10) ];
						}
						case 'firstMsg':
						case 'mod':
						case 'returningChatter':
						case 'subscriber':
						case 'turbo':
						{
							return [ key, value === '1' ];
						}
					}
					return [ key, value ];
				},
				expected: {
					raw: "@badge-info=;badges=;client-nonce=nonce;color=#FF4500;display-name=Name_1;emotes=;first-msg=0;flags=;id=uuid_3;mod=0;reply-parent-display-name=Name_2;reply-parent-msg-body=@Name_1\\shey,\\swhat's\\sgoing\\son?;reply-parent-msg-id=uuid_1;reply-parent-user-id=11111;reply-parent-user-login=name_1;reply-thread-parent-display-name=Name_1;reply-thread-parent-msg-id=uuid_2;reply-thread-parent-user-id=22222;reply-thread-parent-user-login=name_2;returning-chatter=0;room-id=33333;subscriber=0;tmi-sent-ts=1700000000000;turbo=0;user-id=22222;user-type= :name_2!name_2@name_2.tmi.twitch.tv PRIVMSG #channel :@Name_2 not much",
					rawTags: {
						'badge-info': '',
						badges: '',
						'client-nonce': 'nonce',
						color: '#FF4500',
						'display-name': 'Name_1',
						emotes: '',
						'first-msg': '0',
						flags: '',
						id: 'uuid_3',
						mod: '0',
						'reply-parent-display-name': 'Name_2',
						'reply-parent-msg-body': "@Name_1 hey, what's going on?",
						'reply-parent-msg-id': 'uuid_1',
						'reply-parent-user-id': '11111',
						'reply-parent-user-login': 'name_1',
						'reply-thread-parent-display-name': 'Name_1',
						'reply-thread-parent-msg-id': 'uuid_2',
						'reply-thread-parent-user-id': '22222',
						'reply-thread-parent-user-login': 'name_2',
						'returning-chatter': '0',
						'room-id': '33333',
						subscriber: '0',
						'tmi-sent-ts': '1700000000000',
						turbo: '0',
						'user-id': '22222',
						'user-type': ''
					},
					tags: {
						badgeInfo: '',
						badges: '',
						clientNonce: 'nonce',
						color: '#FF4500',
						displayName: 'Name_1',
						emotes: '',
						firstMsg: false,
						flags: '',
						id: 'uuid_3',
						mod: false,
						replyParentDisplayName: 'Name_2',
						replyParentMsgBody: "@Name_1 hey, what's going on?",
						replyParentMsgId: 'uuid_1',
						replyParentUserId: '11111',
						replyParentUserLogin: 'name_1',
						replyThreadParentDisplayName: 'Name_1',
						replyThreadParentMsgId: 'uuid_2',
						replyThreadParentUserId: '22222',
						replyThreadParentUserLogin: 'name_2',
						returningChatter: false,
						roomId: '33333',
						subscriber: false,
						tmiSentTs: 1700000000000,
						turbo: false,
						userId: '22222',
						userType: ''
					},
					prefix: {
						nick: 'name_2',
						user: 'name_2',
						host: 'name_2.tmi.twitch.tv'
					},
					command: 'PRIVMSG',
					channel: '#channel',
					params: [ '@Name_2 not much' ]
				}
			},
		];
		for(let i = 0; i < tests.length; i++) {
			const { message, tagParser, expected } = tests[i];
			await t.test(message, () => {
				assert.deepStrictEqual(parse(expected.raw, tagParser), expected);
			});
		}
	});

	it('real messages', async t => {
		const tests = [
		];
		for(let i = 0; i < tests.length; i++) {
			const test = tests[i];
			await t.test(`#${i}`, () => {
				const parsed = parse(test);
				console.log(parsed);
				// assert.ok(parsed);
				// assert.ok(parsed.tags);
				// assert.ok(parsed.rawTags);
			});
		}
	});
});