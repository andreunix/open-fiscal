import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Baixa os manuais e documentos técnicos do SPED Fiscal (EFD ICMS/IPI) do novo
// portal gov.br/sped. O site é Volto (Plone headless): a listagem das pastas é
// obtida pelo backend REST em /++api++/ e cada item File é baixado por
// {@id}/@@download/file.
//
// A EFD ICMS/IPI é um arquivo texto com campos delimitados por pipe — não há
// schema XSD; o leiaute é definido no Guia Prático e nas Notas Técnicas.
//
// Uso: node scripts/download-sped.mjs

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.join(path.resolve(scriptDir, '..'), 'tmp', 'sped-fiscal');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const SITE = 'https://www.gov.br/sped';
const ROOT = '/pt-br/assuntos/escrituracoes-digitais/efd-icms-ipi';

// Pastas (relativas a ROOT) → subpasta local de saída.
const FOLDERS = {
  'manuais-e-documentos-tecnicos': 'manuais-e-notas-tecnicas',
};

async function api(apiPath) {
  const url = `${SITE}/++api++${apiPath}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${apiPath}`);
  return res.json();
}

function safeName(item) {
  // @id termina no id do objeto; garante extensão pela content-type do File.
  let name = decodeURIComponent(item['@id'].split('/').pop());
  const mime = item.file?.['content-type'] || '';
  const extByMime = { 'application/pdf': '.pdf', 'application/zip': '.zip' };
  const ext = extByMime[mime];
  if (ext && !name.toLowerCase().endsWith(ext)) name += ext;
  return name;
}

const counts = { ok: 0, skip: 0, err: 0 };

for (const [folder, outSub] of Object.entries(FOLDERS)) {
  const dir = path.join(outRoot, outSub);
  await fs.mkdir(dir, { recursive: true });

  let listing;
  try {
    listing = await api(`${ROOT}/${folder}`);
  } catch (err) {
    console.error(`[${folder}] erro: ${err.message}`);
    continue;
  }

  const files = (listing.items || []).filter((i) => i['@type'] === 'File');
  console.log(`[${folder}] ${files.length} arquivos`);

  for (const item of files) {
    // Busca o item para ter o campo file com content-type e download URL.
    let full = item;
    try {
      full = await api(item['@id'].replace(SITE, ''));
    } catch { /* usa o resumo da listagem */ }

    const nome = safeName(full);
    const dest = path.join(dir, nome);
    try {
      const stat = await fs.stat(dest).catch(() => null);
      if (stat && stat.size > 0) {
        counts.skip++;
        console.log(`  = ${nome}`);
        continue;
      }
      const dl = full.file?.download || `${full['@id']}/@@download/file`;
      const res = await fetch(dl, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      counts.ok++;
      console.log(`  + ${nome}`);
    } catch (err) {
      counts.err++;
      console.error(`  ! ${nome} — ${err.message}`);
    }
  }
}

console.log(`\nTOTAL: ${counts.ok} baixados, ${counts.skip} já existiam, ${counts.err} erros`);
