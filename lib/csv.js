const WINDOWS_1252_HINTS = new Set([0x80,0x82,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8a,0x8b,0x8c,0x8e,0x91,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9a,0x9b,0x9c,0x9e,0x9f]);

export function decodeOfficialCsv(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  return (utf8.includes('\uFFFD') || bytes.some(byte => WINDOWS_1252_HINTS.has(byte)))
    ? new TextDecoder('windows-1252').decode(bytes) : utf8;
}

export function parseCsv(text) {
  const source = String(text || '').replace(/^\uFEFF/, '');
  const firstBreak = source.search(/\r?\n/);
  const headerLine = firstBreak === -1 ? source : source.slice(0, firstBreak);
  if (!headerLine.trim()) return [];
  const separator = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ';' : ',';
  const records = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === separator && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field); if (row.some(value => value !== '')) records.push(row); row = []; field = '';
    } else field += char;
  }
  row.push(field); if (row.some(value => value !== '')) records.push(row);
  if (records.length < 2) return [];
  const headers = records[0].map(value => value.trim());
  return records.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}
