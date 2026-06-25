import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Baixa a documentação técnica vigente da NFS-e Padrão Nacional, hospedada no
// Portal da Secretaria-Executiva do CGNFS-e (https://www.gov.br/nfse).
//
// As páginas são Plone clássico com links diretos para os arquivos, então a
// lista abaixo é curada (não há padrão de scraping como no portal SVRS).
// Seguindo o mesmo critério de scripts/download-nfe.ts, ficamos só com a
// documentação atual (produção) + RTC; leiautes antigos e produção restrita de
// homologação ficam de fora.
//
// Uso: bun scripts/download-nfse.ts

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.join(path.resolve(scriptDir, '..'), 'tmp', 'nfse');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const ATUAL = 'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual';
const RTC = 'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/rtc';
const PR = 'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/producao-restrita';

// categoria → [url, ...]
const DOCS: Record<string, string[]> = {
  manuais: [
    `${ATUAL}/guia-emissorpubliconacionalweb_snnfse-ern-v12.pdf`,
    `${ATUAL}/guia-do-painel-administrativo-municipal-nfs-e-v1-2-out2025.pdf`,
    `${ATUAL}/manual-contribuintes-emissor-publico-api-sistema-nacional-nfs-e-v1-2-out2025.pdf`,
    `${ATUAL}/manual-municipios-apis-adn-sistema-nacional-nfs-e-v1-2-out21025.pdf`,
    `${ATUAL}/manual-municipios-cnc-api-sistema-nacional-nfs-e-v1-2-out21025.pdf`,
    `${ATUAL}/manual-municipios-emissor-publico-api-sistema-nacional-nfs-e-v1-2-out21025.pdf`,
    `${ATUAL}/manual-contribuintes-apis-adn-sistema-nacional-nfse.pdf`,
    `${ATUAL}/manual-contribuintes-emissor-publico-api-emissao-decisao-administrativa-e-judicial.pdf`,
  ],
  'esquemas-xml': [
    `${ATUAL}/nfse-esquemas_xsd-v1-01-20260209.zip`,
    `${PR}/nfse-esquemas_xsd-rtc-v1-00-20251210.zip`,
  ],
  tabelas: [
    `${ATUAL}/anexo_a-municipio_ibge-paises_iso2-v1-00-snnfse-20251210.xlsx`,
    `${ATUAL}/anexo_b-nbs2-lista_servico_nacional-snnfse-v1-01-20260122.xlsx`,
    `${ATUAL}/anexo_c-indop_ibscbs-snnfse-v1-01-20260122.xlsx`,
  ],
  leiautes: [
    `${ATUAL}/anexo_i-sefin_adn-dps_nfse-snnfse-v1-01-20260209.xlsx`,
    `${ATUAL}/anexo_ii-sefin_adn-pedregevt_evt-snnfse-v1-01-20260122.xlsx`,
    `${ATUAL}/anexo_iii-cnc-snnfse-v1-00-20251216.xlsx`,
    `${ATUAL}/anexo_iv-adn-snnfse-v1-00-20251216.xlsx`,
    `${ATUAL}/anexo_v-painel_adm_municipal-snnfse-v1-00-20251216.xlsx`,
    `${RTC}/anexovi-leiautesrn_rtc_ibscbs-v1-04-00-2013-nt009.xlsx`,
    `${RTC}/anexovii-indop_ibscbs_v1-02-00.xlsx`,
    `${RTC}/anexoviii-correlacaoitemnbsindopcclasstrib_ibscbs_v1-01-00.xlsx`,
  ],
  'notas-tecnicas': [
    `${RTC}/nt-009-se-cgnfse-v1-0-1.pdf`,
    `${RTC}/nt-008-se-cgnfse-danfse-20260505.pdf`,
    `${RTC}/nt-007-se-cgnfse-v1-0.pdf`,
    `${RTC}/nt-006-se-cgnfse-leiaute-nfse-via.pdf`,
    `${RTC}/nt-005-se-cgnfse-novo-layout-rtc.pdf`,
    `${PR}/nt-004-se-cgnfse-novo-layout-rtc-v2-00-20251210.pdf`,
    `${RTC}/nt-003-1-2-se-cgnfse-novo-layout-rtc.pdf`,
    `${RTC}/nota-tecnica-001-se-cgnfse-novo-layout-rtc.pdf`,
  ],
};

const counts = { ok: 0, skip: 0, err: 0 };

for (const [categoria, urls] of Object.entries(DOCS)) {
  const dir = path.join(outRoot, categoria);
  await fs.mkdir(dir, { recursive: true });
  for (const url of urls) {
    const nome = decodeURIComponent(url.split('/').pop() ?? '');
    const dest = path.join(dir, nome);
    try {
      const stat = await fs.stat(dest).catch(() => null);
      if (stat && stat.size > 0) {
        counts.skip++;
        console.log(`  = [${categoria}] ${nome}`);
        continue;
      }
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      counts.ok++;
      console.log(`  + [${categoria}] ${nome}`);
    } catch (err) {
      counts.err++;
      console.error(`  ! [${categoria}] ${nome} — ${(err as Error).message}`);
    }
  }
}

console.log(`\nTOTAL: ${counts.ok} baixados, ${counts.skip} já existiam, ${counts.err} erros`);
