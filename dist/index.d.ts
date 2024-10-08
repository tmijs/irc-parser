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
export type ParseTagCallbackFn = (key: string, value: string, messageParams: IrcMessage['params']) => [key: string, value: any];
export declare function unescapeIrc(value: string): string;
export declare function escapeIrc(value: string | number): string;
export declare function parse(line: string, parseTagCb?: ParseTagCallbackFn): IrcMessage;
export declare function parse(line: '', parseTagCb?: ParseTagCallbackFn): undefined;
export interface FormatMessage {
    tags?: IrcMessage['tags'];
    command: IrcMessage['command'];
    prefix?: IrcMessage['prefix'];
    channel?: string;
    params?: IrcMessage['params'];
}
export declare function format(ircMessage: FormatMessage): string;
export interface ParsedTagData {
    unescapedKey: string;
    unescapedValue: string;
    key: string;
    value: unknown;
}
export declare function parseTag(rawKey: string, rawValue: string, messageParams?: IrcMessage['params'], cb?: ParseTagCallbackFn): ParsedTagData;
export interface ParsedTags {
    rawTags: IrcMessage['rawTags'];
    tags: IrcMessage['tags'];
}
export declare function parseTagsFromString(tagsRawString: string, messageParams?: IrcMessage['params'], cb?: ParseTagCallbackFn): ParsedTags;
export declare function parsePrefix(prefixRaw: string): Partial<Record<"nick" | "user" | "host", string>>;
export declare function formatTags(tags: Record<string, string> | [string, string][]): string;
export declare function formatPrefix(prefix: IrcMessage['prefix']): string;
export declare function formatChannel(channel: string): string;
