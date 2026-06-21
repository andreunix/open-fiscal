import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsRoot = path.join(root, 'content/docs/(nfe-nfce)');

async function walk(dir) {
  const out = [];
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...await walk(file));
    else if (ent.isFile() && file.endsWith('.mdx')) out.push(file);
  }
  return out;
}

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) data[field[1]] = field[2].replace(/^['"]|['"]$/g, '');
  }
  return data;
}

function clean(value) {
  return String(value || 'não especificado')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\|/g, '\\|');
}

function firstSentence(text) {
  const value = text.replace(/\n+/g, ' ').trim();
  if (!value) return '';
  const index = value.search(/(?<!\bp)\.\s/);
  return index >= 0 ? value.slice(0, index + 1) : value;
}

function extractVersions(text, title) {
  const values = new Set();
  for (const source of [title || '', text || '']) {
    for (const match of source.matchAll(/\bv\d+(?:\.\d+){0,2}[a-z]?\b/gi)) values.add(match[0]);
    for (const match of source.matchAll(/\b\d+\.\d{2}[a-z]?\b/g)) values.add(match[0]);
  }
  return [...values].slice(0, 4).join('; ') || 'ver fonte original';
}

function extractDates(text, title) {
  const values = new Set();
  for (const source of [title || '', text || '']) {
    for (const match of source.matchAll(/\b\d{2}\/\d{2}\/\d{4}\b/g)) values.add(match[0]);
    for (const match of source.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)) values.add(match[0]);
    for (const match of source.matchAll(/\b(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.?\s*\/?\s*\d{4}\b/gi)) values.add(match[0]);
    for (const match of source.matchAll(/\b(?:janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de \d{4}\b/gi)) values.add(match[0]);
  }
  return [...values].slice(0, 4).join('; ') || 'ver fonte original';
}

function extractChapters(text) {
  const values = new Set();
  for (const match of (text || '').matchAll(/§\s*[^.;\n]+/g)) values.add(match[0].trim());
  for (const match of (text || '').matchAll(/p\.\s*\d+(?:[–-]\d+)?/gi)) values.add(match[0].trim());
  for (const match of (text || '').matchAll(/cap[ií]tulos?\s*[^.;\n]+/gi)) values.add(match[0].trim());
  return [...values].slice(0, 5).join('; ') || 'ver fonte original';
}

function extractNT(text, rel, title) {
  const values = new Set();
  for (const match of (text || '').matchAll(/NT(?: Conjunta)?\s+\d{4}\.\d{3}(?:-[A-Z]+)?(?:\s+v\d+(?:\.\d+){0,2}[a-z]?)?/gi)) {
    values.add(match[0]);
  }
  if (rel.includes('/notas-tecnicas/')) {
    const base = path.basename(rel, '.mdx');
    if (base !== 'index') values.add((title || '').split(' — ')[0] || base.toUpperCase());
  }
  return [...values].slice(0, 6).join('; ') || 'não indicada';
}

function extractSchemaOrTable(text, rel) {
  const values = new Set();
  const lower = rel.toLowerCase();
  if (lower.includes('/schemas/')) values.add('pacote XSD indicado nesta página');
  if (lower.includes('/informes-tecnicos/')) values.add('tabela externa do Informe Técnico');
  for (const match of (text || '').matchAll(/\b(?:XSD|schema|schemas|PL_[A-Za-z0-9_.-]+|Evento_[A-Za-z0-9_.-]+|CST|CFOP|NCM|cClassTrib|cProdANP|tPag|pBio|FCP|GTIN|CSC|QR Code)\b/g)) {
    values.add(match[0]);
  }
  return [...values].slice(0, 8).join('; ') || 'não indicada';
}

function documentFromPath(rel, title, oldSource) {
  const source = oldSource.trim();
  if (rel.includes('/notas-tecnicas/')) return title.split(' — ')[0] || 'Nota Técnica da NF-e/NFC-e';
  if (rel.includes('/informes-tecnicos/')) return title.split(' — ')[0] || 'Informe Técnico da NF-e/NFC-e';
  if (rel.includes('/schemas/')) return 'Pacotes de schemas XSD da NF-e/NFC-e';
  if (rel.includes('/nfag/')) return source ? firstSentence(source) : 'MOC NFAg e anexos oficiais';
  if (rel.includes('/nfgas/')) return source ? firstSentence(source) : 'MOC NFGas e anexos oficiais';
  if (rel.includes('/nfe-abi/')) return source ? firstSentence(source) : 'MOC NF-e ABI e anexos oficiais';
  if (path.basename(rel) === 'index.mdx' || rel.endsWith('/nfe-nfce.mdx')) return `Índice editorial: ${title}`;
  return source ? firstSentence(source) : 'MOC 7.0, anexos, NT, IT e schemas oficiais relacionados ao tema';
}

function statusFrom(rel, oldSource) {
  const text = oldSource.toLowerCase();
  if (path.basename(rel) === 'index.mdx' || rel.endsWith('/nfe-nfce.mdx')) return 'página índice; rastreabilidade detalhada nas páginas filhas';
  if (rel.includes('/notas-tecnicas/')) return 'revisão consolidada na página; verificar revisão posterior no Portal Nacional antes de implementar';
  if (rel.includes('/informes-tecnicos/')) return 'tabela externa versionada; recapturar revisão vigente antes de validar produção';
  if (rel.includes('/schemas/')) return 'forma de dado versionada pelo pacote XSD indicado';
  if (text.includes('overlay')) return 'base oficial com overlay explícito de NT, IT ou schema';
  if (text.includes('historico') || text.includes('histórico')) return 'contém regra histórica; confrontar com NT e legislação vigente';
  return 'base oficial mapeada; confrontar com NT, IT, XSD e regra estadual vigentes';
}

function fallbackSource(rel, title) {
  if (rel.endsWith('/nfe-nfce.mdx')) return 'Página de entrada construída a partir da matriz de fontes oficiais em Referência, com detalhes nas páginas temáticas.';
  if (rel.includes('/comece-aqui/')) return 'Índice ou guia editorial baseado no MOC 7.0, manuais de credenciamento e páginas temáticas vinculadas.';
  if (rel.includes('/fundamentos/')) return 'Índice editorial baseado no MOC 7.0 e nas páginas de fundamentos vinculadas.';
  if (rel.includes('/emissao-e-comunicacao/')) return 'Índice editorial baseado no MOC 7.0 — Visão Geral, capítulo de arquitetura e Web Services.';
  if (rel.includes('/leiaute-e-rejeicoes/')) return 'Índice editorial baseado no MOC 7.0 — Anexo I, schemas XSD e páginas de validação vinculadas.';
  if (rel.includes('/eventos/')) return 'Índice editorial baseado no Sistema de Registro de Eventos do MOC 7.0 e nas NTs de eventos vinculadas.';
  if (rel.includes('/danfe/')) return 'Índice editorial baseado no MOC 7.0 — Anexo II, manual DANFE NFC-e e páginas de DANFE vinculadas.';
  if (rel.includes('/contingencia/')) return 'Índice editorial baseado nos Anexos III e IV do MOC 7.0 e nas especificações de contingência off-line.';
  if (rel.includes('/operacao/')) return 'Índice editorial baseado nos manuais operacionais, autorizadoras e páginas de operação vinculadas.';
  if (rel.includes('/referencia/glossario.mdx')) return 'Glossário editorial derivado dos termos recorrentes no MOC 7.0, anexos, NTs, ITs e schemas.';
  if (rel.includes('/referencia/index.mdx')) return 'Índice editorial da seção Referência; a fonte técnica está nas páginas vinculadas.';
  return `Página editorial "${title}" baseada nas fontes oficiais das páginas vinculadas.`;
}

function originalSource(block) {
  const marker = '\n### Registro de origem\n\n';
  const index = block.indexOf(marker);
  const value = index >= 0 ? block.slice(index + marker.length) : block;
  return value
    .replace(/\bIndice\b/g, 'Índice')
    .replace(/\bPagina\b/g, 'Página')
    .replace(/\bpaginas\b/g, 'páginas')
    .replace(/\btematicas\b/g, 'temáticas')
    .replace(/\bReferencia\b/g, 'Referência')
    .replace(/\bsecao\b/g, 'seção')
    .replace(/\btecnica\b/g, 'técnica')
    .replace(/\best[aá]\b/g, 'está')
    .replace(/\bVisao Geral\b/g, 'Visão Geral')
    .replace(/\bcapitulo\b/g, 'capítulo')
    .replace(/\bvalidacao\b/g, 'validação')
    .replace(/\bespecificacoes\b/g, 'especificações')
    .replace(/\boperacao\b/g, 'operação')
    .replace(/\bconstruida\b/g, 'construída')
    .replace(/\bGlossario\b/g, 'Glossário');
}

function buildBlock(rel, title, oldSource) {
  const source = originalSource(oldSource).trim() || fallbackSource(rel, title);
  const fields = [
    ['Documento', documentFromPath(rel, title, source)],
    ['Versão', extractVersions(source, title)],
    ['Data', extractDates(source, title)],
    ['Páginas/capítulo', extractChapters(source)],
    ['NT relacionada', extractNT(source, rel, title)],
    ['Schema/tabela relacionada', extractSchemaOrTable(source, rel)],
    ['Status', statusFrom(rel, source)],
  ];
  const table = ['| Campo | Valor |', '|---|---|', ...fields.map(([key, value]) => `| ${key} | ${clean(value)} |`)].join('\n');
  return `## Fonte\n\n${table}\n\n### Registro de origem\n\n${source}`;
}

const files = await walk(docsRoot);
let changed = 0;
let replaced = 0;
let added = 0;

for (const file of files) {
  const rel = path.relative(root, file);
  const original = await fs.readFile(file, 'utf8');
  const { title = path.basename(file, '.mdx') } = frontmatter(original);
  const sourceBlock = /\n## Fonte\n\n([\s\S]*?)(?=\n## |\s*$)/;
  const match = original.match(sourceBlock);
  let next;

  if (match) {
    next = original.replace(sourceBlock, `\n${buildBlock(rel, title, match[1])}`);
    replaced += 1;
  } else {
    next = original.replace(/\s*$/, `\n\n${buildBlock(rel, title, '')}\n`);
    added += 1;
  }

  if (next !== original) {
    await fs.writeFile(file, next);
    changed += 1;
  }
}

console.log(JSON.stringify({ files: files.length, changed, replaced, added }, null, 2));
