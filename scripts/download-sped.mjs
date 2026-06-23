import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Baixa manuais, notas técnicas, tabelas e legislação do EFD ICMS/IPI do portal
// gov.br/sped (Volto/Plone headless). O backend REST em /++api++/ lista pastas e
// arquivos; cada File é baixado por {@id}/@@download/file.
//
// Estratégia de descoberta:
//   Em vez de hardcodar slugs (que diferem entre sped.rfb.gov.br e gov.br/sped),
//   o script consulta a raiz /efd-icms-ipi via API e lista automaticamente todas
//   as subpastas (@type === 'Folder'), mapeando-as para subdiretórios locais.
//   Isso torna o script resiliente a renomeações de slugs no portal.
//
// Pastas ignoradas (configurável em SKIP_FOLDERS):
//   - historico-guias-pratico: versões antigas do Guia Prático, muito pesadas
//
// Uso:
//   node scripts/download-sped.mjs
//   SPED_DELAY_MS=500 node scripts/download-sped.mjs   # mais devagar
//   SPED_DRY_RUN=1    node scripts/download-sped.mjs   # só lista, não baixa

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outRoot   = path.join(path.resolve(scriptDir, '..'), 'tmp', 'sped-fiscal');
const UA        = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const DELAY_MS  = Number(process.env.SPED_DELAY_MS ?? 200);
const DRY_RUN   = Boolean(process.env.SPED_DRY_RUN);
const MAX_DEPTH = 4;

const SITE = 'https://www.gov.br/sped';
const ROOT = '/pt-br/assuntos/escrituracoes-digitais/efd-icms-ipi';

// Slugs de subpastas a ignorar (conteúdo histórico/irrelevante)
const SKIP_FOLDERS = new Set([
  'historico-guias-pratico',
  'historico-guias-praticos',
]);

// Mapa de slug → nome local amigável.
// Qualquer pasta não listada aqui usará o próprio slug como nome local.
const FOLDER_NAMES = {
  'manuais-e-documentos-tecnicos': 'manuais-e-notas-tecnicas',
  'downloads':                      'downloads',
};

// MIME → extensão de arquivo
const EXT_BY_MIME = {
  'application/pdf':  '.pdf',
  'application/zip':  '.zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel':  '.xls',
  'application/msword':        '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain':                '.txt',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(apiPath) {
  const url = `${SITE}/++api++${apiPath}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} → ${url}`);
  return res.json();
}

function localName(slug) {
  return FOLDER_NAMES[slug] ?? slug;
}

function safeName(item) {
  let name = decodeURIComponent(item['@id'].split('/').pop());
  const mime = item.file?.['content-type'] ?? '';
  const ext  = EXT_BY_MIME[mime];
  if (ext && !name.toLowerCase().endsWith(ext)) name += ext;
  return name.replace(/[/\\:*?"<>|]/g, '_');
}

const counts = { ok: 0, skip: 0, err: 0, folders: 0 };

async function processFolder(apiFolder, outDir, depth = 0) {
  if (depth > MAX_DEPTH) {
    console.warn(`${'  '.repeat(depth)}[aviso] profundidade máxima atingida em ${apiFolder}`);
    return;
  }

  let listing;
  try {
    listing = await api(apiFolder);
  } catch (err) {
    console.error(`${'  '.repeat(depth)}[erro] ${apiFolder}: ${err.message}`);
    counts.err++;
    return;
  }

  const items   = listing.items ?? [];
  const files   = items.filter((i) => i['@type'] === 'File');
  const folders = items.filter((i) => i['@type'] === 'Folder');

  const indent = '  '.repeat(depth);
  console.log(`${indent}📂 ${path.basename(outDir)} — ${files.length} arquivo(s), ${folders.length} subpasta(s)`);
  counts.folders++;

  if (!DRY_RUN) await fs.mkdir(outDir, { recursive: true });

  // Baixa arquivos desta pasta
  for (const item of files) {
    let full = item;
    try {
      full = await api(item['@id'].replace(SITE, ''));
      await delay(DELAY_MS);
    } catch { /* usa resumo da listagem */ }

    const nome   = safeName(full);
    const dest   = path.join(outDir, nome);
    const prefix = '  '.repeat(depth + 1);

    if (DRY_RUN) {
      console.log(`${prefix}~ ${nome}`);
      counts.skip++;
      continue;
    }

    try {
      const stat = await fs.stat(dest).catch(() => null);
      if (stat?.size > 0) {
        console.log(`${prefix}= ${nome}`);
        counts.skip++;
        continue;
      }
      const dlUrl = full.file?.download ?? `${full['@id']}/@@download/file`;
      const res   = await fetch(dlUrl, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      console.log(`${prefix}+ ${nome}`);
      counts.ok++;
      await delay(DELAY_MS);
    } catch (err) {
      console.error(`${'  '.repeat(depth + 1)}! ${nome} — ${err.message}`);
      counts.err++;
    }
  }

  // Desce em subpastas, ignorando as da lista SKIP_FOLDERS
  for (const sub of folders) {
    const subPath = sub['@id'].replace(SITE, '');
    const slug    = decodeURIComponent(subPath.split('/').pop());

    if (SKIP_FOLDERS.has(slug)) {
      console.log(`${'  '.repeat(depth + 1)}↷ ${slug} (ignorada)`);
      continue;
    }

    const subDir = path.join(outDir, localName(slug));
    await processFolder(subPath, subDir, depth + 1);
    await delay(DELAY_MS);
  }
}

// Ponto de entrada: autodescobre as subpastas de ROOT
console.log(`SPED Fiscal — download${DRY_RUN ? ' (dry-run)' : ''}`);
console.log(`Portal: ${SITE}`);
console.log(`Destino: ${outRoot}\n`);

let rootListing;
try {
  rootListing = await api(ROOT);
} catch (err) {
  console.error(`[erro fatal] não foi possível listar a raiz ${ROOT}: ${err.message}`);
  console.error('Verifique se o portal está acessível e se o caminho ROOT está correto.');
  process.exit(1);
}

const rootFolders = (rootListing.items ?? []).filter((i) => i['@type'] === 'Folder');

if (rootFolders.length === 0) {
  // Fallback: a própria raiz pode ser a pasta de conteúdo (sem subpastas)
  console.log('[aviso] nenhuma subpasta encontrada na raiz — processando a raiz diretamente');
  await processFolder(ROOT, outRoot);
} else {
  console.log(`Subpastas encontradas: ${rootFolders.map((f) => f['@id'].split('/').pop()).join(', ')}\n`);
  for (const folder of rootFolders) {
    const subPath = folder['@id'].replace(SITE, '');
    const slug    = decodeURIComponent(subPath.split('/').pop());

    if (SKIP_FOLDERS.has(slug)) {
      console.log(`↷ ${slug} (ignorada)\n`);
      continue;
    }

    const outDir = path.join(outRoot, localName(slug));
    console.log(`── ${slug}`);
    await processFolder(subPath, outDir);
    console.log('');
    await delay(DELAY_MS);
  }
}

console.log(`──────────────────────────────
TOTAL
  Baixados    : ${counts.ok}
  Já existiam : ${counts.skip}
  Erros       : ${counts.err}
  Pastas      : ${counts.folders}
`);
