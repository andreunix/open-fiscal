import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { PROJECT_DIR } from "./nfe-portal";

// Catalogos versionados (consumiveis por codigo) do Estagio 7.
// - manifest.tsv: registro de cada tabela auxiliar com vigencia + fonte.
// - checksums.tsv: hash do snapshot extraido, para detectar tabela alterada.
// - <id>.tsv: extracao fiel do snapshot .xlsx em tmp/nfe-oficial/diversos/.

export const DATA_DIR = join(PROJECT_DIR, "data");
export const TABELAS_DIR = join(DATA_DIR, "tabelas");
export const ENDPOINTS_DIR = join(DATA_DIR, "endpoints");
export const MANIFEST = join(TABELAS_DIR, "manifest.tsv");
export const CHECKSUMS = join(TABELAS_DIR, "checksums.tsv");
export const SNAPSHOT_DIR = join(PROJECT_DIR, "tmp", "nfe-oficial", "diversos");

export type ManifestRow = {
  id: string;
  descricao: string;
  vigencia: string;
  versao_it: string;
  colunas_chave: string;
  arquivo: string;
  fonte_url: string;
  onde_usada: string;
  status: string;
};

export type ChecksumRow = {
  id: string;
  arquivo: string;
  sha256: string;
  linhas: string;
  gerado_em: string;
};

export const MANIFEST_COLUMNS: Array<keyof ManifestRow> = [
  "id",
  "descricao",
  "vigencia",
  "versao_it",
  "colunas_chave",
  "arquivo",
  "fonte_url",
  "onde_usada",
  "status",
];

export const CHECKSUM_COLUMNS: Array<keyof ChecksumRow> = ["id", "arquivo", "sha256", "linhas", "gerado_em"];

export async function readTsv<T extends Record<string, string>>(path: string): Promise<T[]> {
  if (!existsSync(path)) return [];
  const content = await readFile(path, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const row: Record<string, string> = {};
    header.forEach((name, index) => {
      row[name] = cells[index] ?? "";
    });
    return row as T;
  });
}

export async function writeTsv<T extends Record<string, string>>(
  path: string,
  columns: readonly (keyof T)[],
  rows: T[],
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const lines = [
    columns.join("\t"),
    ...rows.map((row) => columns.map((column) => cell(String(row[column] ?? ""))).join("\t")),
  ];
  await writeFile(path, `${lines.join("\n")}\n`);
}

export function readManifest(): Promise<ManifestRow[]> {
  return readTsv<ManifestRow>(MANIFEST);
}

export function snapshotPath(arquivo: string): string {
  return join(SNAPSHOT_DIR, arquivo);
}

export function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function fileSha256(path: string): Promise<string> {
  return sha256(await readFile(path));
}

function cell(value: string): string {
  return value.replace(/\t|\r|\n/g, " ").trim();
}
