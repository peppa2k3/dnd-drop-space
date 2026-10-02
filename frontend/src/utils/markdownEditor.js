/**
 * Each function takes the current textarea value + selection range and
 * returns { value, start, end } - the new content and where the cursor /
 * selection should land afterwards. Kept as pure functions (no DOM) so
 * they're trivial to reason about and reuse.
 */

function wrapSelection(value, start, end, marker) {
  const selected = value.slice(start, end) || 'văn bản';
  const before = value.slice(0, start);
  const after = value.slice(end);
  const newValue = `${before}${marker}${selected}${marker}${after}`;
  return { value: newValue, start: start + marker.length, end: start + marker.length + selected.length };
}

function prefixLines(value, start, end, prefix, numbered = false) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lineStart = before.lastIndexOf('\n') + 1;
  const selectedBlock = value.slice(lineStart, end) || 'mục danh sách';

  const lines = selectedBlock.split('\n');
  const newBlock = lines.map((line, i) => `${numbered ? `${i + 1}. ` : prefix}${line}`).join('\n');

  const newValue = value.slice(0, lineStart) + newBlock + after;
  return { value: newValue, start: lineStart, end: lineStart + newBlock.length };
}

export const markdownActions = {
  bold: (value, start, end) => wrapSelection(value, start, end, '**'),
  italic: (value, start, end) => wrapSelection(value, start, end, '_'),
  code: (value, start, end) => wrapSelection(value, start, end, '`'),
  heading: (value, start, end) => prefixLines(value, start, end, '## '),
  bulletList: (value, start, end) => prefixLines(value, start, end, '- '),
  checklist: (value, start, end) => prefixLines(value, start, end, '- [ ] '),
  numberedList: (value, start, end) => prefixLines(value, start, end, '', true),
  link: (value, start, end) => {
    const selected = value.slice(start, end) || 'liên kết';
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insertion = `[${selected}](https://)`;
    const newValue = `${before}${insertion}${after}`;
    const urlStart = before.length + selected.length + 3;
    return { value: newValue, start: urlStart, end: urlStart + 8 };
  },
  insertAtCursor: (value, start, end, text) => {
    const newValue = value.slice(0, start) + text + value.slice(end);
    return { value: newValue, start: start + text.length, end: start + text.length };
  },
};
