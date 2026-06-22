import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readXlsx, rowsToTsv } from "./xlsx";
import {
  CHECKSUM_COLUMNS,
  CHECKSUMS,
  TABELAS_DIR,
  readManifest,
  sha256,
  snapshotPath,
  writeTsv,
  type ChecksumRow,
} from "./tabelas";

// Extrai os snapshots .xlsx de tmp/nfe-oficial/diversos/ para data/tabelas/<id>.tsv
// (consumiveis por codigo) e registra hash + contagem em checksums.tsv.

const manifest = await readManifest();
const checksums: ChecksumRow[] = [];
const now = new Date().toISOString();
let extracted = 0;
let skipped = 0;

for (const row of manifest) {
  const source = snapshotPath(row.arquivo);
  const extractable = row.status === "extraido" || row.status === "minuta";

  if (!extractable) {
    console.log(`- pulado (${row.status}): ${row.id}`);
    skipped += 1;
    continue;
  }
  if (!existsSync(source)) {
    console.log(`- snapshot ausente: ${row.id} (${row.arquivo})`);
    skipped += 1;
    continue;
  }

  const rows = await readXlsx(source);
  await mkdir(TABELAS_DIR, { recursive: true });
  const target = join(TABELAS_DIR, `${row.id}.tsv`);
  await writeFile(target, rowsToTsv(rows));

  checksums.push({
    id: row.id,
    arquivo: row.arquivo,
    sha256: sha256(await readFile(source)),
    linhas: String(Math.max(rows.length - 1, 0)),
    gerado_em: now,
  });
  console.log(`- extraido: ${row.id} (${rows.length} linhas com cabecalho)`);
  extracted += 1;
}

checksums.sort((a, b) => a.id.localeCompare(b.id));
await writeTsv(CHECKSUMS, CHECKSUM_COLUMNS, checksums);

console.log("");
console.log(`Resumo: ${extracted} tabelas extraidas, ${skipped} puladas.`);
console.log(`Checksums: ${CHECKSUMS}`);
