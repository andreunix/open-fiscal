#!/usr/bin/env bun
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASE,
  MENU_URL,
  delay,
  fetchDocument,
  listCategories,
  listCategoryItems,
  tokenOf,
  uniqueDest,
  type Category,
  type Item,
} from './cte-portal';

// Baixa manuais, esquemas, notas técnicas e demais documentos do Portal Nacional
// do CT-e (https://www.cte.fazenda.gov.br/portal) numa árvore PLANA por categoria.
//
// As categorias são DESCOBERTAS a partir do menu (ver cte-portal.ts) — nada de
// IDs base64 fixos. Categorias sem arquivos hospedados (Ajustes SINIEF/Atos
// COTEPE/Convênios → CONFAZ; Visualizador de DF-e → ferramenta online) são
// puladas automaticamente (0 links exibirArquivo).
//
// Saída: ./tmp/cte-oficial/{categoria}/, espelhando tmp/nfe-oficial.
// Para a variante separada por família (CT-e/BP-e/MDF-e/DF-e), ver
// scripts/download-cte-parseado.ts.
//
// Uso:
//   bun scripts/download-cte.ts                  # descobre e baixa tudo
//   bun scripts/download-cte.ts manuais esquemas-xml   # filtra por slug
//   CTE_DRY_RUN=1 bun scripts/download-cte.ts    # lista sem baixar
//   CTE_DELAY_MS=500 bun scripts/download-cte.ts

const scriptDir  = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..');
const OUT_ROOT   = path.join(projectDir, 'tmp', 'cte-oficial');

const DELAY_MS = Number(process.env.CTE_DELAY_MS ?? 300);
const DRY_RUN  = process.env.CTE_DRY_RUN === '1';

// Filtro opcional por slug, via argumentos.
const selected = process.argv.slice(2).map((s) => s.trim().toLowerCase()).filter(Boolean);

type DownloadResult =
  | { status: 'ok' | 'exists'; rel: string }
  | { status: 'dead' };

async function download(item: Item, slug: string): Promise<DownloadResult> {
  const got = await fetchDocument(item);
  if (got.status === 'dead') return { status: 'dead' };

  const dest = uniqueDest(path.join(OUT_ROOT, slug), got.name, tokenOf(item.url));
  const rel  = path.relative(OUT_ROOT, dest);

  const existing = await fs.stat(dest).catch(() => null);
  if (existing && existing.size > 0) return { status: 'exists', rel };

  await fs.mkdir(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.part`;
  await fs.writeFile(tmp, Buffer.from(got.bytes));
  await fs.rename(tmp, dest);
  return { status: 'ok', rel };
}

// ─── Execução ────────────────────────────────────────────────────────────────
const counts = { ok: 0, skip: 0, dead: 0, err: 0, cats: 0, empty: 0 };

console.log(`CT-e — download${DRY_RUN ? ' (dry-run)' : ''}`);
console.log(`Portal:  ${BASE}`);
console.log(`Menu:    ${MENU_URL}`);
console.log(`Destino: ${OUT_ROOT}\n`);

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

  // Categorias sem arquivos (legislação no CONFAZ, visualizador) são puladas.
  if (items.length === 0) {
    console.log(`── ${category.slug} — sem arquivos hospedados (pulado)\n`);
    counts.empty++;
    continue;
  }

  console.log(`── ${category.slug} — ${items.length} documento(s)`);
  counts.cats++;

  for (const item of items) {
    if (DRY_RUN) {
      console.log(`  ~ ${item.title}`);
      continue;
    }
    try {
      const result = await download(item, category.slug);
      if (result.status === 'dead') {
        // Entrada removida do portal (302 → home): listada mas sem arquivo.
        console.warn(`  ⚠ link morto no portal: ${item.title}`);
        counts.dead++;
      } else if (result.status === 'exists') {
        console.log(`  = ${result.rel}`);
        counts.skip++;
      } else {
        console.log(`  + ${result.rel}`);
        counts.ok++;
        await delay(DELAY_MS);
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
  Baixados        : ${counts.ok}
  Já existiam     : ${counts.skip}
  Links mortos    : ${counts.dead}
  Erros           : ${counts.err}
  Categorias      : ${counts.cats}
  Categorias vazias: ${counts.empty}
`);

if (counts.err > 0) process.exitCode = 1;
