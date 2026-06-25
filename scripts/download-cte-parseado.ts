#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { copyFile, mkdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASE,
  MENU_URL,
  delay,
  familyFor,
  fetchDocument,
  headDocument,
  listCategories,
  listCategoryItems,
  tokenOf,
  uniqueDest,
  type Category,
  type Item,
} from './cte-portal';

// Variante "parseada" do downloader do CT-e.
//
// O downloader padrão (scripts/download-cte.ts) grava tudo plano em
// tmp/cte-oficial/<categoria>/. O portal CT-e, porém, mistura documentos de
// VÁRIOS modelos na mesma categoria (CT-e/CT-e OS/GTV-e, BP-e/BP-e TA/TM,
// MDF-e e DF-e comum). Aqui produzimos uma SEGUNDA árvore separando cada
// categoria por família:
//
//   tmp/cte-oficial-parseado/
//     manuais/        cte/  bpe/  mdfe/  dfe/
//     esquemas-xml/   cte/  bpe/  mdfe/  dfe/
//     notas-tecnicas/ cte/  bpe/  mdfe/  dfe/
//     diversos/       cte/  ...
//
// A família vem de familyFor() (cte-portal.ts), inferida do título. Para não
// rebaixar o que já está na árvore plana, reaproveitamos o arquivo local (cópia)
// quando ele existe em tmp/cte-oficial/<categoria>/; só baixamos o que faltar.
// O downloader original e a pasta tmp/cte-oficial NÃO são tocados.
//
// Uso:
//   bun scripts/download-cte-parseado.ts
//   bun scripts/download-cte-parseado.ts notas-tecnicas      # filtra por slug
//   CTE_PARSED_DRY_RUN=1 bun scripts/download-cte-parseado.ts # só planeja
//   CTE_PARSED_DELAY_MS=500 bun scripts/download-cte-parseado.ts

const scriptDir  = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..');
const FLAT_DIR = path.join(projectDir, 'tmp', 'cte-oficial');
const DEST_DIR = path.join(projectDir, 'tmp', 'cte-oficial-parseado');

const DELAY_MS = Number(process.env.CTE_PARSED_DELAY_MS ?? 200);
const DRY_RUN  = process.env.CTE_PARSED_DRY_RUN === '1';

const selected = process.argv.slice(2).map((s) => s.trim().toLowerCase()).filter(Boolean);

async function fileSize(p: string): Promise<number> {
  try { return (await stat(p)).size; } catch { return 0; }
}

type ItemResult =
  | { status: 'copied' | 'downloaded' | 'exists'; rel: string }
  | { status: 'dead' };

// Processa um documento: define a família, reaproveita o arquivo plano (cópia)
// quando existir, senão baixa. Um HEAD descobre o nome sem baixar o corpo.
async function handle(item: Item, slug: string): Promise<ItemResult> {
  const family = familyFor(item.title);
  const destDir = path.join(DEST_DIR, slug, family);
  const token = tokenOf(item.url);

  const head = await headDocument(item);
  if (head.status === 'dead') return { status: 'dead' };

  const dest = uniqueDest(destDir, head.name, token);
  const rel  = path.relative(DEST_DIR, dest);

  if ((await fileSize(dest)) > 0) return { status: 'exists', rel };

  const flatPath = path.join(FLAT_DIR, slug, head.name);

  if (DRY_RUN) {
    return { status: existsSync(flatPath) ? 'copied' : 'downloaded', rel };
  }

  await mkdir(destDir, { recursive: true });
  // Caminho 1: já existe na árvore plana → copia (sem rede).
  if ((await fileSize(flatPath)) > 0) {
    await copyFile(flatPath, dest);
    return { status: 'copied', rel };
  }
  // Caminho 2: não há cópia local → baixa do portal.
  const got = await fetchDocument(item);
  if (got.status === 'dead') return { status: 'dead' };
  const tmp = `${dest}.part`;
  await writeFile(tmp, Buffer.from(got.bytes));
  await rename(tmp, dest);
  return { status: 'downloaded', rel };
}

// ─── Execução ────────────────────────────────────────────────────────────────
const counts = { copied: 0, downloaded: 0, skip: 0, dead: 0, err: 0, cats: 0, empty: 0 };

console.log(`CT-e — download parseado${DRY_RUN ? ' (dry-run)' : ''}`);
console.log(`Portal:        ${BASE}`);
console.log(`Menu:          ${MENU_URL}`);
console.log(`Origem (reuso): ${FLAT_DIR}`);
console.log(`Destino:        ${DEST_DIR}\n`);

let categories: Category[] = await listCategories();
if (selected.length) categories = categories.filter((c) => selected.includes(c.slug));
await delay(DELAY_MS);

console.log(`Categorias descobertas: ${categories.map((c) => c.slug).join(', ') || '(nenhuma)'}\n`);

for (const category of categories) {
  let items: Item[];
  try {
    items = await listCategoryItems(category);
  } catch (err) {
    console.error(`── ${category.slug}\n  ! falha ao listar — ${err instanceof Error ? err.message : String(err)}\n`);
    counts.err++;
    continue;
  }
  await delay(DELAY_MS);

  if (items.length === 0) {
    console.log(`── ${category.slug} — sem arquivos hospedados (pulado)\n`);
    counts.empty++;
    continue;
  }

  console.log(`── ${category.slug} — ${items.length} documento(s)`);
  counts.cats++;

  for (const item of items) {
    try {
      const result = await handle(item, category.slug);
      if (result.status === 'dead') {
        console.warn(`  ⚠ link morto no portal: ${item.title}`);
        counts.dead++;
      } else if (result.status === 'exists') {
        console.log(`  =    ${result.rel}`);
        counts.skip++;
      } else if (result.status === 'copied') {
        console.log(`  COPY ${result.rel}`);
        counts.copied++;
      } else {
        console.log(`  GET  ${result.rel}`);
        counts.downloaded++;
        if (!DRY_RUN) await delay(DELAY_MS);
      }
    } catch (err) {
      console.error(`  ! ${item.title} — ${err instanceof Error ? err.message : String(err)}`);
      counts.err++;
    }
  }

  console.log('');
}

console.log(`──────────────────────────────
TOTAL
  Copiados        : ${counts.copied}
  Baixados        : ${counts.downloaded}
  Já existiam     : ${counts.skip}
  Links mortos    : ${counts.dead}
  Erros           : ${counts.err}
  Categorias      : ${counts.cats}
  Categorias vazias: ${counts.empty}
`);

if (counts.err > 0) process.exitCode = 1;
