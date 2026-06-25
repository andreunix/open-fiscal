#!/usr/bin/env bun
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Baixa manuais, esquemas, notas técnicas e tabelas dos DF-e publicados no
// Portal Nacional da SVRS (https://dfe-portal.svrs.rs.gov.br).
//
// Ao contrário do gov.br/sped (que expõe API JSON via Volto /++api++/), o portal
// SVRS é MVC server-rendered: cada página /{Portal}/Documentos é HTML puro. Os
// links de download aparecem de duas formas:
//
//   1. <a href="/{Portal}/Arquivos/{id}">           → download direto
//      <a href="...arquivo.pdf">                     → link com extensão explícita
//   2. onclick="download_arquivo_estatico('SIS', tipo, 'arquivo.ext')"
//      → /{SIS}/DownloadArquivoEstatico/?sistema=SIS&tipoArquivo=N&nomeArquivo=...
//
// A forma (2) é a que o portal realmente usa hoje na maioria das páginas; a (1)
// está prevista no layout e aparece em páginas mais novas. Tratamos as duas.
//
// Tudo é gravado sob ./tmp/svrs/{subpasta}/ conforme o portal de origem. A página
// /DFe/Documentos é transversal (tabelas RTC: CST, cClassTrib, crédito presumido,
// NTs conjuntas) e vai para ./tmp/svrs/dfe/.
//
// Uso:
//   bun scripts/download-svrs.ts                 # todos os portais
//   bun scripts/download-svrs.ts cte mdfe        # só alguns (também via SVRS_PORTAL)
//   SVRS_DRY_RUN=1 bun scripts/download-svrs.ts  # lista sem baixar
//   SVRS_DELAY_MS=500 bun scripts/download-svrs.ts
//   SVRS_PORTAL=nfgas,cte bun scripts/download-svrs.ts

// ─── Configuração ────────────────────────────────────────────────────────────
const scriptDir  = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..');
const OUT_ROOT   = path.join(projectDir, 'tmp', 'svrs');

const BASE = 'https://dfe-portal.svrs.rs.gov.br';
const HOST = new URL(BASE).host;
const UA   = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const DELAY_MS  = Number(process.env.SVRS_DELAY_MS ?? 300);
const DRY_RUN   = process.env.SVRS_DRY_RUN === '1';
const MAX_DEPTH = 1; // 0 = página /Documentos; 1 = páginas de detalhe /Documentos/{slug}

interface Portal {
  key: string;  // subpasta sob tmp/svrs
  page: string; // caminho da página de documentos
}

// Convenção de subpastas (ver cabeçalho). Cada portal aponta para sua página de
// documentos. Cff (Conformidade Fácil) não tem /Documentos — usa a raiz /Cff.
const PORTALS: Portal[] = [
  { key: 'nfe',   page: '/NFe/Documentos'   },
  { key: 'nfce',  page: '/Nfce/Documentos'  },
  { key: 'cte',   page: '/Cte/Documentos'   },
  { key: 'mdfe',  page: '/Mdfe/Documentos'  },
  { key: 'bpe',   page: '/Bpe/Documentos'   },
  { key: 'nf3e',  page: '/Nf3e/Documentos'  },
  { key: 'nfcom', page: '/Nfcom/Documentos' },
  { key: 'nfgas', page: '/Nfgas/Documentos' },
  { key: 'nfag',  page: '/Nfag/Documentos'  },
  { key: 'nfabi', page: '/Nfabi/Documentos' },
  { key: 'dfe',   page: '/DFe/Documentos'   },
  { key: 'cff',   page: '/Cff'              },
];

// Seleção: argumentos de linha de comando têm prioridade, depois SVRS_PORTAL.
const fromArgs = process.argv.slice(2).map((s) => s.trim().toLowerCase()).filter(Boolean);
const fromEnv  = (process.env.SVRS_PORTAL ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const selected = fromArgs.length ? fromArgs : fromEnv;
const portals  = selected.length ? PORTALS.filter((p) => selected.includes(p.key)) : PORTALS;

// ─── Categorias (subpastas por portal) ───────────────────────────────────────
// Cada portal é subdividido por categoria, como em tmp/nfe-oficial
// (manuais, esquemas-xml, notas-tecnicas, informes-tecnicos, ...). A categoria
// vem do `tipoArquivo` do onclick download_arquivo_estatico('SIS', tipo, ...).
const TIPO_DIR: Record<number, string> = {
  1: 'manuais',
  2: 'esquemas-xml',
  3: 'notas-tecnicas',
  4: 'tabelas',
  5: 'informes-tecnicos',
  8: 'boletins-tecnicos',
  12: 'tabelas',
  13: 'apresentacoes',
  14: 'notas-explicativas',
  16: 'informes-tecnicos',
};

// Categoria padrão para links sem tipo conhecido (hrefs avulsos), igual ao
// catch-all "diversos" do portal NFe oficial.
const DEFAULT_CAT = 'diversos';

function categorize(tipo: number | undefined, nome: string): string {
  // Pacotes de liberação de schema (PL_*, Evento_*) às vezes são fichados num
  // tipo genérico; o nome do arquivo é a fonte de verdade.
  if (/^(PL_|Evento_)/i.test(nome) && nome.toLowerCase().endsWith('.zip')) {
    return 'esquemas-xml';
  }
  if (tipo === undefined) return DEFAULT_CAT;
  return TIPO_DIR[tipo] ?? `tipo-${tipo}`;
}

// ─── Extensões e MIME ────────────────────────────────────────────────────────
const EXT_RE = /\.(pdf|zip|xlsx|xls|docx|doc|txt|csv|rar|7z)(?:$|[?#])/i;

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/octet-stream': '', // genérico: cai no content-disposition
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/csv': '.csv',
};

// ─── Utilitários ─────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function extOf(s: string): string {
  const m = s.match(EXT_RE);
  return m ? '.' + m[1].toLowerCase() : '';
}

function sanitize(name: string): string {
  let n = decodeEntities(name)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[/\\:*?"<>|]+/g, '_')
    .replace(/^\.+/, '');
  if (!n) n = 'arquivo';
  if (n.length > 120) {
    const ext = path.extname(n);
    n = n.slice(0, 120 - ext.length).trimEnd() + ext;
  }
  return n;
}

// Monta o nome final a partir do texto da âncora (preferido) ou do basename da
// URL, garantindo a extensão.
function buildName(label: string, url: string, ext: string): string {
  let base = label && label.replace(/[^\w]/g, '').length > 1
    ? label
    : decodeURIComponent(new URL(url, BASE).pathname.split('/').pop() || 'arquivo');
  if (ext && !extOf(base)) base += ext;
  return sanitize(base);
}

// ─── Rede ────────────────────────────────────────────────────────────────────
async function fetchPage(pageUrl: string, routeSeg: string): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(pageUrl, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  // Redirect para a home (portal inexistente) → trata como não encontrado.
  const finalPath = new URL(res.url).pathname.toLowerCase();
  if (res.redirected && !finalPath.includes(routeSeg.toLowerCase())) return null;
  return res.text();
}

async function inferExt(url: string): Promise<string> {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
    const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (ct && EXT_BY_MIME[ct]) return EXT_BY_MIME[ct];
    const cd = res.headers.get('content-disposition') ?? '';
    const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
    if (m) return extOf(decodeURIComponent(m[1]));
  } catch { /* sem extensão inferível */ }
  return '';
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // O portal às vezes responde 200 com corpo vazio ou uma página de erro HTML
  // para links mortos (docs antigos removidos mas ainda listados).
  if (buf.length === 0) throw new Error('vazio (0 bytes)');
  if (buf.length < 256 && buf.toString('utf8').toLowerCase().includes('<html')) {
    throw new Error('página HTML (link morto)');
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

// ─── Extração de candidatos ──────────────────────────────────────────────────
interface Candidate {
  label: string;
  url: string;
  ext: string;        // extensão já conhecida (vazia se precisa inferir)
  needsHead: boolean; // se true, faz HEAD para descobrir a extensão real
  subdir?: string;    // sobrescreve a subpasta-raiz (docs transversais DFE → dfe/)
  category: string;   // categoria → subpasta dentro do portal (manuais, etc.)
}

const ANCHOR_RE = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
const CALL_RE   = /download_arquivo_estatico\(\s*'([A-Z0-9]+)'\s*,\s*(\d+)\s*,\s*'([^']*)'\s*\)/i;

// Captura pelo delimitador real (backreference): atributos com aspas duplas
// frequentemente contêm aspas simples internas, p.ex. onclick="f('SIS', ...)".
function attr(attrs: string, name: string): string {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return m ? m[2] : '';
}

// Varre o HTML de uma página e retorna os arquivos baixáveis + páginas de
// detalhe (/Documentos/{slug}) para eventual descida (MAX_DEPTH).
function extractPage(html: string, pageUrl: string): { files: Candidate[]; detail: string[] } {
  const files: Candidate[] = [];
  const detail: string[] = [];
  const seenDetail = new Set<string>();

  for (const m of html.matchAll(ANCHOR_RE)) {
    const attrs = m[1];
    const label = stripTags(m[2]);
    const onclick = decodeEntities(attr(attrs, 'onclick'));
    const hrefRaw = decodeEntities(attr(attrs, 'href'));

    // (2) Mecanismo onclick do portal: download_arquivo_estatico('SIS',tipo,'nome')
    const call = onclick.match(CALL_RE);
    if (call) {
      const [, sis, tipo, nomeRaw] = call;
      const nome = decodeEntities(nomeRaw);
      const query = new URLSearchParams({ sistema: sis, tipoArquivo: tipo, nomeArquivo: nome });
      files.push({
        label: nome,
        url: `${BASE}/${sis}/DownloadArquivoEstatico/?${query}`,
        ext: extOf(nome),
        needsHead: false,
        // Sistema "DFE" é transversal (tabelas RTC, NTs conjuntas): vai sempre
        // para dfe/ em vez de duplicar em cada portal que o exibe.
        subdir: sis.toUpperCase() === 'DFE' ? 'dfe' : undefined,
        category: categorize(Number(tipo), nome),
      });
      continue;
    }

    if (!hrefRaw || /^(javascript:|mailto:|tel:|#)/i.test(hrefRaw)) continue;

    let abs: URL;
    try {
      abs = new URL(hrefRaw, pageUrl);
    } catch {
      continue;
    }
    if (abs.host !== HOST) continue;

    const ext = extOf(abs.pathname);
    const lower = abs.pathname.toLowerCase();

    // (1a) Link com extensão explícita.
    if (ext) {
      files.push({ label, url: abs.toString(), ext, needsHead: false, category: categorize(undefined, label) });
      continue;
    }
    // (1b) Download direto /{Portal}/Arquivos/{id} sem extensão → inferir via HEAD.
    if (/\/arquivos\/[^/]+/i.test(lower)) {
      files.push({ label, url: abs.toString(), ext: '', needsHead: true, category: categorize(undefined, label) });
      continue;
    }
    // Página de detalhe /{Portal}/Documentos/{slug} → descer (se profundidade permitir).
    if (/\/documentos\/[^/]+/i.test(lower)) {
      const u = abs.toString();
      if (!seenDetail.has(u)) {
        seenDetail.add(u);
        detail.push(u);
      }
    }
  }

  return { files, detail };
}

// Reúne candidatos da página principal e, se MAX_DEPTH permitir, das páginas de
// detalhe. Dedupe por URL.
async function gather(portal: Portal): Promise<Candidate[] | null> {
  const routeSeg = portal.page.split('/').filter(Boolean)[0] ?? portal.key;
  const mainUrl = `${BASE}${portal.page}`;
  const html = await fetchPage(mainUrl, routeSeg);
  if (html === null) return null;

  const byUrl = new Map<string, Candidate>();
  const { files, detail } = extractPage(html, mainUrl);
  for (const c of files) if (!byUrl.has(c.url)) byUrl.set(c.url, c);

  if (MAX_DEPTH >= 1) {
    for (const detUrl of detail) {
      await delay(DELAY_MS);
      const detHtml = await fetchPage(detUrl, routeSeg);
      if (detHtml === null) continue;
      const sub = extractPage(detHtml, detUrl);
      for (const c of sub.files) if (!byUrl.has(c.url)) byUrl.set(c.url, c);
    }
  }

  return [...byUrl.values()];
}

// ─── Execução ────────────────────────────────────────────────────────────────
const counts = { ok: 0, skip: 0, err: 0, portals: 0, missing: 0 };

console.log(`SVRS — download${DRY_RUN ? ' (dry-run)' : ''}`);
console.log(`Portal:  ${BASE}`);
console.log(`Destino: ${OUT_ROOT}`);
console.log(`Portais: ${portals.map((p) => p.key).join(', ') || '(nenhum)'}\n`);

for (const portal of portals) {
  console.log(`── ${portal.key}`);

  const candidates = await gather(portal);
  await delay(DELAY_MS);

  if (candidates === null) {
    console.log(`  [aviso] portal não encontrado: ${BASE}${portal.page}\n`);
    counts.missing++;
    continue;
  }

  counts.portals++;
  console.log(`📂 ${portal.key} — ${candidates.length} arquivo(s)`);

  const seenName = new Set<string>();

  for (const c of candidates) {
    const ext = c.ext || (c.needsHead ? await inferExt(c.url) : '');
    if (c.needsHead) await delay(DELAY_MS);

    const dir  = c.subdir ?? portal.key;
    const nome = buildName(c.label, c.url, ext);
    const rel  = `${c.category}/${nome}`;
    const key  = `${dir}/${rel}`;
    if (seenName.has(key)) continue; // mesmo arquivo via rotas diferentes
    seenName.add(key);

    const dest = path.join(OUT_ROOT, dir, c.category, nome);
    // Mostra categoria/arquivo; se redirecionado para outra raiz (DFE → dfe/), mostra o destino.
    const tag = dir === portal.key ? rel : `→ ${dir}/${rel}`;

    if (DRY_RUN) {
      console.log(`  ~ ${tag}`);
      continue;
    }

    try {
      const stat = await fs.stat(dest).catch(() => null);
      if (stat && stat.size > 0) {
        console.log(`  = ${tag}`);
        counts.skip++;
        continue;
      }
      await download(c.url, dest);
      console.log(`  + ${tag}`);
      counts.ok++;
      await delay(DELAY_MS);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ! ${nome} — ${msg}`);
      counts.err++;
    }
  }

  console.log('');
}

console.log(`──────────────────────────────
TOTAL
  Baixados        : ${counts.ok}
  Já existiam     : ${counts.skip}
  Erros           : ${counts.err}
  Portais OK      : ${counts.portals}
  Portais ausentes: ${counts.missing}
`);

if (counts.err > 0) process.exitCode = 1;
