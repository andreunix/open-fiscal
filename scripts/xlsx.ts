import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Leitor minimo de .xlsx sem dependencias: um .xlsx e um zip OOXML, entao
// extraimos as partes necessarias com `unzip -p` e fazemos o parse do XML.
// Suficiente para tabelas auxiliares (texto/numero), nao para formulas/estilos.

export async function readXlsx(path: string): Promise<string[][]> {
  let sharedXml = "";
  try {
    sharedXml = await unzipPart(path, "xl/sharedStrings.xml");
  } catch {
    sharedXml = "";
  }
  const sheetXml = await unzipPart(path, firstSheetEntry(await listEntries(path)));
  return parseSheet(sheetXml, parseSharedStrings(sharedXml));
}

export function rowsToTsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(tsvCell).join("\t")).join("\n")}\n`;
}

function tsvCell(value: string): string {
  return (value ?? "").replace(/\t|\r|\n/g, " ").trim();
}

async function unzipPart(path: string, entry: string): Promise<string> {
  const { stdout } = await run("unzip", ["-p", path, entry], {
    encoding: "buffer",
    maxBuffer: 256 * 1024 * 1024,
  });
  return new TextDecoder("utf-8").decode(stdout as unknown as Buffer);
}

async function listEntries(path: string): Promise<string[]> {
  const { stdout } = await run("unzip", ["-Z1", path], { maxBuffer: 16 * 1024 * 1024 });
  return stdout.split(/\r?\n/).filter(Boolean);
}

function firstSheetEntry(entries: string[]): string {
  const sheets = entries
    .filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry))
    .sort((a, b) => sheetNumber(a) - sheetNumber(b));
  if (sheets.length === 0) throw new Error("nenhuma planilha encontrada");
  return sheets[0];
}

function sheetNumber(entry: string): number {
  return Number(entry.match(/sheet(\d+)\.xml$/)?.[1] ?? 0);
}

export function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  for (const match of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const text = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1])).join("");
    strings.push(text);
  }
  return strings;
}

export function parseSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  let width = 0;
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g)) {
      const attrs = cellMatch[1] ?? cellMatch[3] ?? "";
      const body = cellMatch[2] ?? "";
      const column = columnIndex(attrs.match(/r="([A-Z]+)\d+"/)?.[1] ?? "");
      const type = attrs.match(/t="([^"]+)"/)?.[1] ?? "";
      const value = cellValue(type, body, shared);
      cells[column] = value;
      if (value !== "" && column + 1 > width) width = column + 1;
    }
    rows.push(cells);
  }
  // Recorta colunas vazias a direita (planilhas estilizadas estendem a grade
  // muito alem dos dados) e normaliza buracos internos para string vazia.
  return rows.map((cells) => {
    const trimmed = cells.slice(0, width);
    for (let index = 0; index < width; index += 1) trimmed[index] ??= "";
    return trimmed;
  });
}

function cellValue(type: string, body: string, shared: string[]): string {
  if (type === "s") {
    const index = Number(body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
    return shared[index] ?? "";
  }
  if (type === "inlineStr") {
    return [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1])).join("");
  }
  return decodeXml(body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
}

function columnIndex(ref: string): number {
  let value = 0;
  for (const char of ref) value = value * 26 + (char.charCodeAt(0) - 64);
  return value > 0 ? value - 1 : 0;
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number.parseInt(num, 10)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}
