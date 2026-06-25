import { existsSync } from "node:fs";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import {
  CATEGORIES,
  OUT_DIR,
  PROJECT_DIR,
  fetchFile,
  filenameFromResponse,
  listPortalCategorySnapshot,
  readIndex,
  relativePath,
  subfolderFor,
  writeDownloadedFile,
} from "./nfe-portal";

// Variante "parseada" do downloader oficial da NF-e/NFC-e.
//
// O downloader padrão (scripts/download-nfe.ts) grava tudo plano em
// tmp/nfe-oficial/<categoria>/. Aqui produzimos uma SEGUNDA árvore, separando a
// categoria "manuais" por família temática (MOC NF-e/NFC-e e anexos, NFAg,
// NFGas, NF-e ABI, DANFE, contingência, autorizadoras, emissor...):
//
//   tmp/nfe-oficial-parseado/
//     manuais/
//       moc-nfe-nfce/   nfag/   nfgas/   nfe-abi/   danfe/   ...
//     esquemas-xml/   notas-tecnicas/   informes-tecnicos/   diversos/
//
// A classificação vem de subfolderFor() em nfe-portal.ts. Para não rebaixar o
// que já está em tmp/nfe-oficial, reaproveitamos o arquivo local (cópia) sempre
// que o índice (data/nfe/index.tsv) souber o nome; só baixamos o que faltar.
//
// O downloader original e a pasta tmp/nfe-oficial NÃO são tocados.
//
// Uso:
//   bun scripts/download-nfe-parseado.ts
//   NFE_PARSED_DRY_RUN=1 bun scripts/download-nfe-parseado.ts   # só planeja

const DEST_DIR = join(PROJECT_DIR, "tmp", "nfe-oficial-parseado");
const DRY_RUN = process.env.NFE_PARSED_DRY_RUN === "1";
const DELAY_MS = Number(process.env.NFE_PARSED_DELAY_MS ?? 200);

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fileSize(path: string): Promise<number> {
  try {
    return (await stat(path)).size;
  } catch {
    return 0;
  }
}

// Mapa url → entrada do índice (categoria/nome de arquivo já conhecidos).
const index = await readIndex();
const byUrl = new Map(index.filter((e) => e.url).map((e) => [e.url, e]));

const counts = { copied: 0, downloaded: 0, skipped: 0, failed: 0 };

console.error(`NF-e oficial — download parseado${DRY_RUN ? " (dry-run)" : ""}`);
console.error(`Origem (reuso): ${relativePath(OUT_DIR)}`);
console.error(`Destino:        ${relativePath(DEST_DIR)}\n`);

for (const category of CATEGORIES) {
  console.error(`[${category.slug}]`);
  const snapshot = await listPortalCategorySnapshot(category);

  for (const item of snapshot.current) {
    try {
      const indexed = byUrl.get(item.url);
      const knownName = indexed?.filename;
      const sourceFlat = knownName ? join(OUT_DIR, item.category, knownName) : "";

      // Caminho 1: arquivo já existe na árvore plana → copia (sem rede).
      if (knownName && sourceFlat && existsSync(sourceFlat)) {
        const sub = subfolderFor(item.category, item.title, knownName);
        const dest = join(DEST_DIR, item.category, sub, knownName);
        const rel = join(item.category, sub, knownName);

        if ((await fileSize(dest)) > 0) {
          counts.skipped += 1;
          console.error(`  =    ${rel}`);
          continue;
        }
        if (DRY_RUN) {
          console.error(`  COPY ${rel}`);
          counts.copied += 1;
          continue;
        }
        await mkdir(join(DEST_DIR, item.category, sub), { recursive: true });
        await copyFile(sourceFlat, dest);
        counts.copied += 1;
        console.error(`  COPY ${rel}`);
        continue;
      }

      // Caminho 2: não há cópia local → baixa do portal.
      if (DRY_RUN) {
        const sub = subfolderFor(item.category, item.title, knownName ?? item.title);
        console.error(`  GET  ${join(item.category, sub, knownName ?? item.title)}`);
        counts.downloaded += 1;
        continue;
      }

      const { response, bytes } = await fetchFile(item.url);
      const filename = knownName || filenameFromResponse(response, item);
      if (!filename) throw new Error("nome vazio");
      const sub = subfolderFor(item.category, item.title, filename);
      const dest = join(DEST_DIR, item.category, sub, filename);
      const rel = join(item.category, sub, filename);

      if ((await fileSize(dest)) > 0) {
        counts.skipped += 1;
        console.error(`  =    ${rel}`);
        continue;
      }
      await writeDownloadedFile(dest, bytes);
      counts.downloaded += 1;
      console.error(`  GET  ${rel}`);
      await delay(DELAY_MS);
    } catch (error) {
      counts.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FAIL ${item.title} (${message})`);
    }
  }
}

console.error(`\n──────────────────────────────`);
console.error(`Destino:    ${relativePath(DEST_DIR)}`);
console.error(`Copiados:   ${counts.copied}`);
console.error(`Baixados:   ${counts.downloaded}`);
console.error(`Já existiam:${counts.skipped}`);
console.error(`Falhas:     ${counts.failed}`);

if (counts.failed > 0) process.exitCode = 1;
