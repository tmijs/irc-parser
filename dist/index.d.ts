export type ChannelString = `#${string}`;
export interface IrcMessage {
    raw: string;
    prefix: Record<'nick' | 'user' | 'host', string | undefined>;
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
interface ParsedTagData {
    unescapedKey: string;
    unescapedValue: string;
    key: string;
    value: unknown;
}
export declare function parseTag(rawKey: string, rawValue: string, messageParams?: IrcMessage['params'], cb?: ParseTagCallbackFn): ParsedTagData;
interface ParsedTags {
    rawTags: IrcMessage['rawTags'];
    tags: IrcMessage['tags'];
}
export declare function parseTagsFromString(tagsRawString: string, messageParams?: IrcMessage['params'], cb?: ParseTagCallbackFn): ParsedTags;
export declare function parsePrefix(prefixRaw: string): Record<"nick" | "user" | "host", string | undefined>;
export {};
