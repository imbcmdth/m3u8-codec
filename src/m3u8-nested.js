import m3u8Codec from './m3u8.js';

const groupPlaylistObject = (hlsObject) => {
  const groupLocation = hlsObject.playlistType === 'manifest' ? 'playlists': 'segments';
  const groupedLines = {
    playlistType: hlsObject.playlistType,
    globals:[],
    [groupLocation]: []
  };
  const commentStack = [];
  let pendingUriTags = [];

  hlsObject.forEach((obj) => {
    if (obj.lineType === 'empty') {
      return;
    }

    if (obj.lineType === 'comment') {
      commentStack.push(obj);
      return;
    }

    if (obj.lineType === 'tag') {
      if (!obj.appliesToNextUri) {
        if (commentStack.length) {
          groupedLines.globals = groupedLines.globals.concat(commentStack);
          commentStack.length = 0;
        }
        groupedLines.globals.push(obj);
        return;
      }

      if (commentStack.length) {
        pendingUriTags = pendingUriTags.concat(commentStack);
        commentStack.length = 0;
      }

      pendingUriTags.push(obj);
      return;
    }

    let group = [];

    // Finally we can ONLY have a uri type line
    if (commentStack.length) {
      group = group.concat(commentStack);
      commentStack.length = 0;
    }
    if (pendingUriTags.length) {
      group = group.concat(pendingUriTags);
      pendingUriTags.length = 0;
    }
    group.push(obj);
    groupedLines[groupLocation].push(group);
  });

  // todo:
  //   spread media-sequence?
  //   spread discontinuity-sequence?

  return groupedLines;
};

const ungroupPlaylistObject = (hlsObject) => {
  const group = hlsObject.playlists || hlsObject.segments;

  return hlsObject.globals.concat(group.flat());
}

export default {
  parse: (m3u8Data) => {
    const hlsObject = m3u8Codec.parse(m3u8Data);
    const nestedHlsObject = groupPlaylistObject(hlsObject);

    return nestedHlsObject;
  },
  stringify: (nestedHlsObject) => {
    const hlsObject = ungroupPlaylistObject(nestedHlsObject);
    const m3u8Data = m3u8Codec.stringify(hlsObject);

    return m3u8Data;
  },
  setCustomTag: m3u8Codec.setCustomTag,
  setCustomType: m3u8Codec.setCustomType,
  getTag: m3u8Codec.getTag
};