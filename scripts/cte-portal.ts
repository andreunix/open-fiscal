import { createHash } from 'node:crypto';
import path from 'node:path';

// Biblioteca compartilhada do Portal Nacional do CT-e
// (https://www.cte.fazenda.gov.br/portal). É consumida por:
//   - scripts/download-cte.ts          → árvore plana tmp/cte-oficial/<categoria>/
//   - scripts/download-cte-parseado.ts → árvore por família tmp/cte-oficial-parseado/
//
// O portal usa a mesma estrutura ASP.NET do portal NF-e oficial: cada categoria é
// uma página listaConteudo.aspx?tipoConteudo=<id> e cada documento é um link
// exibirArquivo.aspx?conteudo=<token>, com o título em <span class="tituloConteudo">.

export const BASE = 'https://www.cte.fazenda.gov.br/portal';
// Página "Documentos" — ponto de partida; o menu lateral dela lista TODAS as
// categorias do portal (não só as de Documentos).
export const MENU_URL = `${BASE}/listaSubMenu.aspx?Id=${encodeURIComponent('tW+YMyk/50s=')}`;
export const UA     = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
export const COOKIE = 'AspxAutoDetectCookieSupport=1';

export interface Category {
  slug: string;       // subpasta (derivada do texto do menu)
  label: string;      // texto original do menu
  contentId: string;  // valor de tipoConteudo (decodificado)
}

export interface Item {
  title: string;
  url: string;
}

export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Extensões e MIME ────────────────────────────────────────────────────────
export const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msi': '.msi',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/xml': '.xml',
  'text/xml': '.xml',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/csv': '.csv',
};

// ─── Utilitários de texto ────────────────────────────────────────────────────
export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function cleanText(value: string): string {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/ /g, ' ')
    .replace(/�/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(label: string): string {
  return cleanText(label)
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sanitize(name: string): string {
  let n = cleanText(name)
    .replace(/[/\\:*?"<>|]+/g, '_')
    .replace(/^\.+/, '')
    .trim();
  if (!n) n = 'arquivo';
  if (n.length > 150) {
    const ext = path.extname(n);
    n = n.slice(0, 150 - ext.length).trimEnd() + ext;
  }
  return n;
}

export function extOf(s: string): string {
  const m = s.split('?')[0].match(/(\.[a-z0-9]{1,8})$/i);
  return m ? m[1].toLowerCase() : '';
}

// Valores de header chegam como latin-1; quando o filename traz bytes UTF-8
// (acentos), reinterpreta para corrigir mojibake ("AlteraÃ§Ãµes" → "Alterações").
export function fixLatin1Mojibake(value: string): string {
  if (!/[\u0080-\u00ff]/.test(value)) return value;
  try {
    const bytes = Uint8Array.from(value, (c) => c.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

// Token único do documento (valor de ?conteudo=), usado para desambiguar nomes.
export function tokenOf(url: string): string {
  return url.split('conteudo=')[1] ?? url;
}

// ─── Família/tipo de documento (parseado) ────────────────────────────────────
// O portal CT-e hospeda documentos de VÁRIOS modelos na mesma categoria. A
// família é inferida do título. Regras avaliadas em ordem (a primeira vence);
// modelos específicos antes do CT-e, que é o padrão.
const FAMILY_RULES: Array<[string, RegExp]> = [
  // DF-e comum/transversal: RTC IBS/CBS, NT conjunta, distribuição DF-e.
  ['dfe', /\bdf-?e\b|ibs\/?cbs|nota t[eé]cnica conjunta|distribui[cç][aã]o de df-?e/i],
  ['bpe', /\bbp-?e\b/i],
  ['mdfe', /\bmdf-?e\b|damdfe/i],
  ['cte', /\bct-?e\b|dacte|gtv-?e/i],
];

// Família para um documento. O padrão é "cte" (CT-e/CT-e OS/GTV-e e NTs genéricas
// sem prefixo de modelo, que historicamente são do CT-e).
export function familyFor(title: string, filename = ''): string {
  const haystack = `${title} ${filename}`;
  for (const [family, pattern] of FAMILY_RULES) {
    if (pattern.test(haystack)) return family;
  }
  return 'cte';
}

// ─── Rede ────────────────────────────────────────────────────────────────────
export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Cookie: COOKIE } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = res.headers.get('content-type') ?? '';
  const charset = ct.match(/charset=([^;\s]+)/i)?.[1]?.trim();
  const bytes = await res.arrayBuffer();
  for (const enc of [charset, 'windows-1252', 'utf-8'].filter(Boolean) as string[]) {
    try {
      return new TextDecoder(enc).decode(bytes);
    } catch { /* tenta o próximo */ }
  }
  return new TextDecoder().decode(bytes);
}

// ─── Descoberta de categorias (menu) ─────────────────────────────────────────
const MENU_RE = /<a\b[^>]*href="([^"]*listaConteudo\.aspx\?tipoConteudo=[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

// Categorias ignoradas na descoberta (não são documentos fiscais de interesse).
// O Assinador é apenas o instalador da ferramenta de assinatura.
export const SKIP_SLUGS = new Set(['assinador']);

export function discoverCategories(html: string): Category[] {
  const byId = new Map<string, Category>();
  for (const m of html.matchAll(MENU_RE)) {
    const href = decodeEntities(m[1]);
    const raw = href.match(/tipoConteudo=([^"&]+)/i)?.[1] ?? '';
    if (!raw) continue;
    // O token pode vir percent-encoded (%2f, %3d) na página atual; canoniza.
    let contentId = raw;
    try { contentId = decodeURIComponent(raw); } catch { /* mantém raw */ }
    const label = cleanText(m[2]);
    const slug = slugify(label);
    if (!slug || SKIP_SLUGS.has(slug) || byId.has(contentId)) continue;
    byId.set(contentId, { slug, label, contentId });
  }
  return [...byId.values()];
}

// Descobre as categorias com documentos a partir do menu do portal.
export async function listCategories(): Promise<Category[]> {
  return discoverCategories(await fetchText(MENU_URL));
}

// ─── Extração de itens (categoria) ───────────────────────────────────────────
const LINK_RE = /<a\b[^>]*href="([^"]*exibirArquivo\.aspx\?conteudo=[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

export function parseItems(html: string): Item[] {
  const byUrl = new Map<string, Item>();
  for (const m of html.matchAll(LINK_RE)) {
    // href quebrado por &#xD;&#xA; + indentação. Normaliza CR/LF/TAB do prefixo
    // para espaço, apara as pontas e então re-encoda CADA espaço restante como
    // %20 — sem colapsar: o token conteudo pode ter MÚLTIPLOS espaços seguidos
    // (ex.: "nzX1w  qFCE=" precisa de "%20%20", senão vira link morto).
    const href = decodeEntities(m[1]).replace(/[\r\n\t]+/g, ' ').trim().replace(/ /g, '%20');
    const body = m[2];
    const span = body.match(/<span\b[^>]*class="tituloConteudo"[^>]*>([\s\S]*?)<\/span>/i);
    const title = cleanText(span?.[1] ?? body);
    if (!title) continue;
    // Canoniza o link preservando o HOST: alguns documentos são absolutos para
    // OUTRO portal (ex.: o AssinadorRS é hospedado em nfe.fazenda.gov.br), então
    // não dá para forçar o host do CT-e. Dois ajustes apenas:
    //   1. caminho na raiz (/exibirArquivo.aspx) → /portal/... — a raiz faz 302
    //      descartando o ?conteudo= e cai em página de erro;
    //   2. preserva a query crua (já com %20) em vez de deixar URL re-encodar o
    //      token, que pode conter +, / e =.
    const url0 = new URL(href.replace(/^\.\//, ''), `${BASE}/`);
    const query = href.split('exibirArquivo.aspx?')[1] ?? '';
    if (!query) continue;
    const pathname = url0.pathname.replace(/^\/exibirArquivo\.aspx$/i, '/portal/exibirArquivo.aspx');
    const url = `https://${url0.host}${pathname}?${query}`;
    if (!byUrl.has(url)) byUrl.set(url, { title, url });
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
}

// Lista os documentos de uma categoria (fetch + parse).
export async function listCategoryItems(category: Category): Promise<Item[]> {
  const url = `${BASE}/listaConteudo.aspx?tipoConteudo=${encodeURIComponent(category.contentId)}`;
  return parseItems(await fetchText(url));
}

// Nome do arquivo a partir do content-disposition; senão título + extensão do MIME.
export function filenameFor(res: Response, item: Item): string {
  const cd = res.headers.get('content-disposition') ?? '';
  const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();

  const utf8 = cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = cd.match(/filename="?([^";]+)"?/i)?.[1];
  let headerName = '';
  if (utf8) { try { headerName = decodeURIComponent(utf8); } catch { headerName = utf8; } }
  else if (plain) headerName = fixLatin1Mojibake(plain);

  if (headerName) return sanitize(headerName);

  const ext = EXT_BY_MIME[ct] ?? extOf(item.url) ?? '';
  return sanitize(`${item.title}${ext}`);
}

// ─── Desambiguação de nomes (colisões) ───────────────────────────────────────
// O portal serve documentos DIFERENTES com o MESMO content-disposition (ex.: 3
// "PL_CTe_300.zip" distintos, NTs 2016.001 em duas versões). Sem desambiguar, um
// sobrescreve o outro e o arquivo "some". O sufixo deriva do token único, então é
// estável entre execuções (mantém a idempotência). `claimed` mapeia dest → token.
const claimed = new Map<string, string>();

export function uniqueDest(dir: string, name: string, token: string): string {
  let dest = path.join(dir, name);
  const owner = claimed.get(dest);
  if (owner !== undefined && owner !== token) {
    const ext = path.extname(name);
    const stem = ext ? name.slice(0, -ext.length) : name;
    const tag = createHash('sha1').update(token).digest('hex').slice(0, 8);
    dest = path.join(dir, `${stem}_${tag}${ext}`);
  }
  claimed.set(dest, token);
  return dest;
}

// ─── HEAD: descobre nome/destino sem baixar o corpo ──────────────────────────
export type HeadResult =
  | { status: 'dead' }
  | { status: 'ok'; name: string };

export async function headDocument(item: Item): Promise<HeadResult> {
  const res = await fetch(item.url, { method: 'HEAD', headers: { 'User-Agent': UA, Cookie: COOKIE }, redirect: 'manual' });
  // Links removidos do portal dão 302 para /portal/principal.aspx (link morto).
  if (res.status >= 300 && res.status < 400) return { status: 'dead' };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if ((res.headers.get('content-type') ?? '').toLowerCase().includes('text/html')) {
    return { status: 'dead' };
  }
  return { status: 'ok', name: filenameFor(res, item) };
}

// ─── Download do arquivo (corpo) ─────────────────────────────────────────────
export type FetchResult =
  | { status: 'dead' }
  | { status: 'ok'; name: string; bytes: ArrayBuffer };

export async function fetchDocument(item: Item): Promise<FetchResult> {
  // redirect: 'manual' — links válidos respondem 200 com o arquivo direto; os
  // removidos do portal dão 302 para /portal/principal.aspx (link morto).
  const res = await fetch(item.url, { headers: { 'User-Agent': UA, Cookie: COOKIE }, redirect: 'manual' });
  if (res.status >= 300 && res.status < 400) return { status: 'dead' };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if ((res.headers.get('content-type') ?? '').toLowerCase().includes('text/html')) {
    return { status: 'dead' };
  }
  const name = filenameFor(res, item);
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength === 0) throw new Error('vazio (0 bytes)');
  return { status: 'ok', name, bytes };
}
