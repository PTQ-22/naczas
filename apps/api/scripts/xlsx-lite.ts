/**
 * Minimal .xlsx reader for scripts only: first worksheet → rows of cell strings.
 * Why hand-rolled: the NFZ files are plain OOXML (zip + XML) and we only need cell values once a
 * month, so node:zlib + a few regexes beat adding a spreadsheet dependency to the monorepo.
 * Not a general parser: no dates, formulas or rich-text formatting beyond concatenated runs.
 */
import { inflateRawSync } from 'node:zlib';

function unzip(buf: Buffer): Map<string, Buffer> {
  // End of central directory record: signature 0x06054b50, search backwards (comment may follow).
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('Not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(start, start + compSize);
    files.set(name, method === 0 ? data : inflateRawSync(data));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

const textOf = (xml: string) =>
  decode([...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1] ?? '').join(''));

function colIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? 'A';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function readFirstSheet(buf: Buffer): string[][] {
  const files = unzip(buf);
  const sharedXml = files.get('xl/sharedStrings.xml')?.toString('utf8') ?? '';
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1] ?? ''));
  const sheet = files.get('xl/worksheets/sheet1.xml')?.toString('utf8');
  if (!sheet) throw new Error('xl/worksheets/sheet1.xml missing');

  const rows: string[][] = [];
  for (const row of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const c of (row[1] ?? '').matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1] ?? '';
      const body = c[2] ?? '';
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1] ?? 'A';
      const type = /t="(\w+)"/.exec(attrs)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value = '';
      if (type === 's' && v !== undefined) value = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') value = textOf(body);
      else if (v !== undefined) value = decode(v);
      cells[colIndex(ref)] = value.trim();
    }
    rows.push(Array.from(cells, (x) => x ?? ''));
  }
  return rows;
}
