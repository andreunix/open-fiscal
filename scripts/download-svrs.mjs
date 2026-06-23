import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Baixa manuais, schemas, notas técnicas, tabelas e informes dos DF-e
// hospedados no Portal Nacional da SVRS (https://dfe-portal.svrs.rs.gov.br).
//
// As páginas /{Sistema}/Documentos são MVC server-rendered: cada documento é
// um onclick `download_arquivo_estatico('SIS', tipo, 'arquivo')` que aponta
// para /{SIS}/DownloadArquivoEstatico/?sistema=SIS&tipoArquivo=N&nomeArquivo=...
//
// Os documentos com sistema "DFE" são compartilhados entre todos os DF-e
// (tabelas de classificação tributária RT, informes do split etc.) e ficam em
// tmp/_dfe-comum em vez de duplicados por sistema.
//
// Uso: node scripts/download-svrs.mjs [Sistema ...]

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..');
const outRoot = path.join(projectDir, 'tmp');

const BASE = 'https://dfe-portal.svrs.rs.gov.br';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// tipoArquivo → subpasta. Tipos compartilhados (DFE) reaproveitam os mesmos nomes.
const TIPO_DIR = {
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

// Rotas do portal. A NFe ficou fora deste downloader; a versão do portal
// federal nfe.fazenda.gov.br fica em tmp/nfe-oficial, baixada por
// scripts/download-nfe.ts.
const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['Nfce', 'Bpe', 'Cte', 'Mdfe', 'Nf3e', 'Nfcom', 'Nff', 'One',
     'Dce', 'Nfag', 'Nfabi', 'Nfgas', 'Cff', 'Pes', 'Difal'];

const CALL_RE = /download_arquivo_estatico\('([A-Z0-9]+)',\s*(\d+),\s*'([^']*)'\)/g;

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function exists(file) {
  try {
    const stat = await fs.stat(file);
    return stat.size > 0;
  } catch {
    return false;
  }
}

async function download(sistema, tipo, nome, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, nome);
  if (await exists(dest)) return 'skip';

  const query = new URLSearchParams({ sistema, tipoArquivo: String(tipo), nomeArquivo: nome });
  const url = `${BASE}/${sistema}/DownloadArquivoEstatico/?${query}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // O portal às vezes responde 200 com corpo vazio para links mortos (docs
  // antigos removidos mas ainda listados): não grava 0-byte, sinaliza erro.
  if (buf.length === 0) throw new Error('vazio (servidor retornou 0 bytes)');
  if (buf.length < 200 && buf.toString('utf8').toLowerCase().includes('<html')) {
    throw new Error('html-error-page');
  }
  await fs.writeFile(dest, buf);
  return 'ok';
}

const counts = { ok: 0, skip: 0, err: 0 };
const manifest = [];

for (const route of ROUTES) {
  let html;
  try {
    html = await fetchPage(`${BASE}/${route}/Documentos`);
  } catch (err) {
    console.error(`[${route}] erro na página: ${err.message}`);
    continue;
  }

  const seen = new Set();
  const docs = [];
  for (const [, sis, tipo, raw] of html.matchAll(CALL_RE)) {
    const nome = decodeEntities(raw);
    const key = `${sis}/${tipo}/${nome}`;
    if (seen.has(key)) continue;
    seen.add(key);
    docs.push({ sis, tipo: Number(tipo), nome });
  }

  console.log(`[${route}] ${docs.length} documentos`);
  for (const { sis, tipo, nome } of docs) {
    // Pacotes de liberação de schema (PL_*, Evento_*) às vezes são fichados
    // num tipo genérico; o nome do arquivo é a fonte de verdade.
    const isSchema = /^(PL_|Evento_)/i.test(nome) && nome.toLowerCase().endsWith('.zip');
    const sub = isSchema ? 'esquemas-xml' : (TIPO_DIR[tipo] ?? `tipo-${tipo}`);
    const destDir = sis === 'DFE'
      ? path.join(outRoot, '_dfe-comum', sub)
      : path.join(outRoot, route.toLowerCase(), sub);
    try {
      const status = await download(sis, tipo, nome, destDir);
      counts[status]++;
      manifest.push({ route, sistema: sis, tipo, nome, status });
      console.log(`  ${status === 'ok' ? '+' : '='} [${sis}/${tipo}] ${nome}`);
    } catch (err) {
      counts.err++;
      manifest.push({ route, sistema: sis, tipo, nome, status: 'err', error: err.message });
      console.error(`  ! [${sis}/${tipo}] ${nome} — ${err.message}`);
    }
  }
}

await fs.writeFile(
  path.join(outRoot, 'svrs-manifest.json'),
  JSON.stringify(manifest, null, 2),
);

console.log(`\nTOTAL: ${counts.ok} baixados, ${counts.skip} já existiam, ${counts.err} erros`);
