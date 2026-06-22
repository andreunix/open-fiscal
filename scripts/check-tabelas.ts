import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  CHECKSUMS,
  ENDPOINTS_DIR,
  TABELAS_DIR,
  fileSha256,
  readManifest,
  readTsv,
  snapshotPath,
  type ChecksumRow,
} from "./tabelas";

// Verificacao dos catalogos versionados (Estagio 7): campos obrigatorios
// (fonte + vigencia), integridade do snapshot (hash) e deteccao de tabela
// alterada/vencida. Use --fail-on-change para travar CI.

const failOnChange = process.argv.includes("--fail-on-change");
const problems: string[] = [];
const changes: string[] = [];

const manifest = await readManifest();
const checksums = await readTsv<ChecksumRow>(CHECKSUMS);
const checksumById = new Map(checksums.map((row) => [row.id, row]));

for (const row of manifest) {
  const label = row.id || "(sem id)";
  if (!row.id) problems.push("linha do manifest sem id");
  if (!row.descricao) problems.push(`${label}: sem descricao`);
  if (!row.fonte_url) problems.push(`${label}: sem fonte_url (Decisao 2)`);
  if (!row.arquivo) problems.push(`${label}: sem arquivo de origem`);
  if (!row.vigencia) problems.push(`${label}: sem vigencia`);

  const extractable = row.status === "extraido" || row.status === "minuta";
  if (!extractable) continue;

  const tsv = join(TABELAS_DIR, `${row.id}.tsv`);
  if (!existsSync(tsv)) {
    changes.push(`${label}: TSV extraido ausente (rode bun run tabelas:build)`);
  }

  const source = snapshotPath(row.arquivo);
  const stored = checksumById.get(row.id);
  if (!stored) {
    changes.push(`${label}: sem checksum registrado`);
    continue;
  }
  if (!existsSync(source)) {
    console.log(`- snapshot local ausente (so verifico hash quando presente): ${label}`);
    continue;
  }
  const current = await fileSha256(source);
  if (current !== stored.sha256) {
    changes.push(`${label}: snapshot ALTERADO (hash difere do registrado) -> reextrair e revisar vigencia`);
  }
}

await checkEndpoints();

printSection("Problemas de catalogo", problems);
printSection("Mudancas/staleness detectadas", changes);
printVigencias();

console.log("");
console.log(`Manifest: ${manifest.length} tabelas. Checksums: ${checksums.length}.`);
console.log(`Problemas: ${problems.length}. Mudancas: ${changes.length}.`);

if (problems.length > 0) process.exitCode = 1;
if (failOnChange && changes.length > 0) process.exitCode = 1;

async function checkEndpoints(): Promise<void> {
  const autorizadores = await readTsv<Record<string, string>>(join(ENDPOINTS_DIR, "autorizadores.tsv"));
  const webservices = await readTsv<Record<string, string>>(join(ENDPOINTS_DIR, "webservices.tsv"));

  if (autorizadores.length === 0) problems.push("endpoints/autorizadores.tsv vazio ou ausente");
  if (webservices.length === 0) problems.push("endpoints/webservices.tsv vazio ou ausente");

  for (const row of autorizadores) {
    if (!row.uf || !row.autorizador_nfe) problems.push(`autorizadores: linha incompleta (${row.uf || "?"})`);
    if (!row.fonte || !row.data_captura) problems.push(`autorizadores ${row.uf}: sem fonte/data (Decisao 2)`);
  }

  const autorizadoresRef = new Set(webservices.map((row) => row.autorizador));
  for (const row of webservices) {
    if (!row.url || !row.servico) problems.push(`webservices: linha incompleta (${row.autorizador}/${row.servico})`);
    if (!row.ambiente || !row.data_captura) problems.push(`webservices ${row.autorizador}/${row.servico}: sem ambiente/data`);
  }
  // todo autorizador citado na matriz de UFs deve ter endpoints (exceto os "ver-CCC")
  for (const row of autorizadores) {
    for (const value of [row.autorizador_nfe, row.svc]) {
      if (value && value !== "ver-CCC" && !autorizadoresRef.has(value)) {
        problems.push(`autorizador "${value}" (UF ${row.uf}) sem endpoints em webservices.tsv`);
      }
    }
  }
}

function printSection(title: string, rows: string[]): void {
  console.log("");
  console.log(`## ${title} (${rows.length})`);
  if (rows.length === 0) {
    console.log("nenhum");
    return;
  }
  for (const row of rows) console.log(`- ${row}`);
}

function printVigencias(): void {
  console.log("");
  console.log("## Vigencias (mais antigas primeiro)");
  const dated = manifest
    .filter((row) => /\d{2}\/\d{2}\/\d{4}/.test(row.vigencia))
    .sort((a, b) => dateValue(a.vigencia) - dateValue(b.vigencia));
  for (const row of dated) console.log(`- ${row.vigencia}\t${row.id}\t${row.versao_it}`);
}

function dateValue(value: string): number {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? Number(`${match[3]}${match[2]}${match[1]}`) : 0;
}
