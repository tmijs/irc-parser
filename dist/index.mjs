// src/index.ts
var ircEscapedChars = {
  "s": " ",
  "n": "\n",
  "r": "\r",
  ":": ";",
  "\\": "\\"
};
var ircUnescapedChars = {
  " ": "s",
  "\n": "n",
  "\r": "r",
  ";": ":",
  "\\": "\\"
};
function unescapeIrc(value) {
  if (!value || !value.includes("\\")) {
    return value;
  }
  return value.replace(/\\[snr:\\]/g, (match) => ircEscapedChars[match[1]]);
}
function escapeIrc(value) {
  if (typeof value === "number") {
    value = value.toString();
  }
  return value.replace(/[\s\n\r;\\]/g, (match) => "\\" + ircUnescapedChars[match] || match);
}
function parse(line, parseTagCb) {
  if (!line) {
    return;
  }
  let offset = 0;
  const getNextSpace = () => line.indexOf(" ", offset);
  const advanceToNextSpace = (start) => {
    if (start === void 0) {
      start = getNextSpace();
      if (start === -1) {
        offset = line.length;
        return;
      }
    } else if (start === -1) {
      offset = line.length;
      return;
    }
    offset = start + 1;
  };
  const charIs = (char, start = offset) => line[start] === char;
  const raw = line;
  let tagsRawString = "";
  if (charIs("@")) {
    const tagsEnd = getNextSpace();
    tagsRawString = line.slice(1, tagsEnd);
    advanceToNextSpace(tagsEnd);
  }
  const prefix = { nick: void 0, user: void 0, host: void 0 };
  if (charIs(":")) {
    const prefixEnd = getNextSpace();
    const prefixRaw = line.slice(offset + 1, prefixEnd);
    if (prefixRaw.includes("!")) {
      const [nick, userHost] = prefixRaw.split("!");
      prefix.nick = nick;
      [prefix.user, prefix.host] = userHost.includes("@") ? userHost.split("@") : [userHost, void 0];
    } else if (prefixRaw.includes("@")) {
      [prefix.nick, prefix.host] = prefixRaw.split("@");
    } else {
      prefix.host = prefixRaw;
    }
    advanceToNextSpace(prefixEnd);
  }
  const commandEnd = getNextSpace();
  const command = line.slice(offset, commandEnd === -1 ? void 0 : commandEnd);
  advanceToNextSpace(commandEnd);
  let channel = "";
  if (charIs("#")) {
    const channelEnd = getNextSpace();
    if (channelEnd === -1) {
      channel = line.slice(offset);
      advanceToNextSpace();
    } else {
      channel = line.slice(offset, channelEnd);
      advanceToNextSpace(channelEnd);
    }
  }
  const params = [];
  while (offset < line.length) {
    if (charIs(":")) {
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
function parseTag(rawKey, rawValue, messageParams, cb) {
  const unescapedKey = unescapeIrc(rawKey);
  let key = kebabToCamel(unescapedKey);
  const unescapedValue = unescapeIrc(rawValue);
  let value = unescapedValue;
  if (cb) {
    [key, value] = cb(key, unescapedValue, messageParams ?? []);
  }
  return { unescapedKey, unescapedValue, key, value };
}
function parseTagsFromString(tagsRawString, messageParams, cb) {
  const rawTags = {};
  const tags = {};
  if (!tagsRawString) {
    return { rawTags, tags };
  }
  tagsRawString.split(";").forEach((str) => {
    const [rawKey, rawValue] = str.split("=");
    const { unescapedKey, unescapedValue, key, value } = parseTag(rawKey, rawValue, messageParams, cb);
    rawTags[unescapedKey] = unescapedValue;
    tags[key] = value;
  });
  return { rawTags, tags };
}
function kebabToCamel(str) {
  return str.replace(/-(\w)/g, (_, match) => match.toUpperCase());
}
export {
  escapeIrc,
  parse,
  parseTag,
  parseTagsFromString,
  unescapeIrc
};
//# sourceMappingURL=index.mjs.map
