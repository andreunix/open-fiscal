# Plano de expansão do Open Fiscal — de guia do MOC a base operacional

## ▶️ Status de execução (atualizar ao fim de cada estágio)

> Um estágio por contexto (`/clear` entre eles). Marque aqui antes de encerrar. Estados:
> ✅ concluído · 🔄 em andamento · ⏭️ próximo · ⬜ pendente · ⛔ bloqueado (precisa decisão) ·
> 🚫 desconsiderado.

| Estágio | Tema | Status | Evidência / observação |
|---|---|---|---|
| **0** | estabilizar a base | 🚫 **desconsiderado** (21/06/2026) | Planos de Notas Técnicas e Informes Técnicos já executados; serve só de registro histórico do risco. Não usar como bloqueio de retomada. |
| **1** | matriz de fontes oficiais | ✅ **concluído** (21/06/2026) | `## Fonte` padronizado em 129 páginas MDX; criada `referencia/fontes-oficiais.mdx`; `bun run build` passou. |
| **2** | legislação nacional | ✅ **concluído** (21/06/2026) | Criada `legislacao/` com index + 5 páginas (AJ SINIEF 07/05, 19/16, Ato COTEPE 69/20, LC 214/2025, normas-relacionadas) e `meta.json`; registrada no `meta.json` da seção; back-links em conceitos, tributos e eventos; `fontes-oficiais` atualizada; `bun run build` passou. |
| **3** | UFs e regras estaduais | ✅ **concluído** (21/06/2026) | Criada `ufs/` com `index`, `matriz-estadual` e 27 páginas de UF + `meta.json`; registrada no `meta.json` da seção (após `operacao`). Config técnica (autorizador/SVC/portal) reaproveitada do Portal Nacional (captura 20/06/2026); regra estadual (cancelamento NF-e por UF, NFC-e 30min, EPEC só SP, PR offline, SP SAT) por pesquisa web, com campos voláteis marcados "sujeito a verificação na SEFAZ" (Decisão 2). Back-links em `servicos-por-uf`, `autorizadoras-e-ambientes`, `legislacao/index`, `ajuste-sinief-19-16` e `fontes-oficiais`; `bun run build` passou. |
| **4** | segurança e assinatura | ✅ **concluído** (21/06/2026) | Criada `seguranca/` com `index`, `certificado-digital`, `tls-mutuo`, `assinatura-xml`, `canonicalizacao`, `reference-uri-digest`, `cadeia-certificado`, `erros-comuns` + `meta.json`; registrada no `meta.json` da seção (após `leiaute-e-rejeicoes`). Reaproveita MOC 7.0 §4.1–§4.2 (Tabelas 4-1/4-2) de `arquitetura`, `web-services` e `grupos-finais`; algoritmos RSA-SHA1/SHA-1/1024 bits marcados como históricos; cadeia TLS marcada volátil com fonte/data (Decisão 2). Back-links em `arquitetura`, `web-services`, `grupos-finais` e `pipeline-de-validacao`; `bun run build` passou. |
| **5** | Reforma Tributária (trilha própria) | ✅ **concluído** (21/06/2026) | Criada `content/docs/reforma-tributaria/` (Parte irmã de `(nfe-nfce)` no root) com `index`, `lc-214-2025`, `nt-2025-002`, `ibs`, `cbs`, `imposto-seletivo`, `campos-nfe-nfce`, `tabelas-rtc`, `eventos-rtc`, `cronograma`, `exemplos-xml` + `meta.json`; registrada no `content/docs/meta.json` e na tabela de tópicos do `index.mdx` root. Trilha linka, sem duplicar (Decisão 1), as páginas dono (tributos, totais, eventos, tabelas-e-codigos, NT/IT 2025.002, cronograma) e distingue LC/NT/IT/XSD/cronograma (Decisão 4); tabelas e datas voláteis com fonte+data (Decisão 2). Back-links em `notas-tecnicas/2025-002`, `schemas/cronograma`, `tributos`, `totais-e-fechamento`, `eventos/modelo-e-catalogo`, `referencia/tabelas-e-codigos`, `legislacao/lc-214-2025-rtc`, `legislacao/index` e `fontes-oficiais`. `bun run build` passou. |
| **6** | exemplos XML e casos de teste | ✅ **concluído** (21/06/2026) | Criada `content/docs/(nfe-nfce)/exemplos/` com `index` + 15 casos (nfe-normal, nfce-normal, nfe-devolucao, nfe-complementar, nfe-ajuste, nfe-exportacao, nfe-importacao, combustivel, medicamento, nfce-contingencia-offline, epec, cancelamento, carta-correcao, inutilizacao, distribuicao-dfe) e `meta.json`; registrada no `meta.json` da seção (antes de `referencia`). Cada caso segue o padrão contexto fiscal · trecho de XML · campos críticos · validações esperadas (cStat) · rejeições comuns · fonte; todos com aviso de **valores fictícios** e linkando a página dona em vez de duplicar o leiaute (Decisão 1); campos voláteis (ANP/pBio/ad rem) marcados com fonte+data (Decisão 2). Back-links em `eventos/cancelamento`, `eventos/carta-de-correcao`, `eventos/epec`, `emissao-e-comunicacao/inutilizacao`, `emissao-e-comunicacao/distribuicao-dfe`, `contingencia/nfce-offline`, `leiaute-e-rejeicoes/index` e `referencia/fontes-oficiais`; `reforma-tributaria/exemplos-xml` agora aponta para os casos completos. `bun run build` passou. |
| **7** | dados versionados (consumíveis por código) | ✅ **concluído** (21/06/2026) | Criada `data/tabelas/` (`manifest.tsv` + `checksums.tsv` + 18 TSV extraídos: municipios, ncm, cfop, cprodanp, combustiveis-monofasicos, pbio, cclasstrib, ccredpres, aliquotas-cbs, fcp-uf, tpag, tband, tpveic, lista-servicos, regime-especial, cclass-nfag, prefixo-gs1, nfe-abi) e `data/endpoints/` (`autorizadores.tsv` 27 UFs + `webservices.tsv` ~100 endpoints por autorizador/serviço/ambiente, captura 20/06/2026 produção). Scripts `scripts/xlsx.ts` (leitor .xlsx sem dependências via `unzip`), `scripts/build-tabelas.ts`, `scripts/check-tabelas.ts` + npm `tabelas:build`/`tabelas:check` e teste `scripts/xlsx.test.ts`. Cada registro com vigência+fonte (Decisão 2); `check` detecta campo faltando e snapshot alterado por hash (`--fail-on-change`). `paises` (.ods) e `unidades-medida` (.xls legado) ficam só no manifest; `cBenef` documentado como por-UF (sem tabela nacional). Página `referencia/dados-versionados.mdx` registrada no `meta.json`; back-links em `tabelas-e-codigos`, `servicos-por-uf`, `versionamento` e `autorizadoras-e-ambientes`. `bun run build` passou e `tabelas:check` OK. (Nota: `bun run test` falha por conflito **pré-existente** vite/cloudflare-plugin, alheio a este estágio — afeta também `nfe-portal.test.ts`.) |
| **8** | revisão final de produto | ✅ **concluído** (22/06/2026) | Auditoria do checklist: (1) `## Fonte` em 200/201 páginas — só `index.mdx` (capa) não tem, esperado; (2) regra estadual isolada em `ufs/`, sem vazar como nacional; (3) NT pós-MOC dobrada — 2025.002 em `reforma-tributaria` com back-links em NT e `tributos`; (4) schema citado com pacote+versão via `schemas/pacotes-e-versoes.mdx` (`.xsd` em páginas são placeholders/links); (5) exemplos cobrindo emissão (10), eventos (cancelamento/carta/epec), contingência (nfce offline) e consulta (distribuicao-dfe); (6) **busca testada ao vivo** (`/api/search`, dev server) retornando páginas úteis para cStat `539`, campo XML `cProdANP`, NT `2025.002` e UF São Paulo; (7) navegação: 201 páginas, **0 órfãs** (toda `.mdx` registrada no `meta.json`), root + 2 Partes, ordem coerente. `bun run build` passou (exit 0, built in 6.01s). |

**Próximo a retomar: nenhum — plano concluído (Estágios 1–7 + revisão final 8).**

### Protocolo de cada estágio (seguir nos próximos)

Repita, em **contexto novo** (`/clear`), para o estágio pedido:

1. Leia este arquivo: a tabela de status, o estágio alvo e a **Decisão de implementação** aplicável.
2. Execute **somente o estágio solicitado** — não comece o próximo no mesmo contexto.
3. Entregue os artefatos do estágio (páginas, `meta.json`, índices) e rode a verificação (`bun run build`).
4. Atualize a tabela de status: estado, data e **evidência objetiva** (arquivo criado, contagem validada,
   comando de build/check ou bloqueio). **Pare.**

### Decisões de implementação (firmadas — seguir nos próximos)

1. **Não recriar o que já tem dono.** A base já cobre DANFE NFC-e/QR Code (`danfe/danfe-nfce-qrcode.mdx`),
   schemas XSD (`schemas/`), web services (`emissao-e-comunicacao/`), eventos, contingência, Notas Técnicas
   e Informes Técnicos pós-MOC. Os estágios abaixo **fecham camadas sem dono**, não duplicam as existentes.
2. **Fonte e data em conteúdo volátil.** Tudo que muda fora do PDF (regra estadual, endpoint, tabela externa)
   carrega **fonte oficial + data de captura**. Sem isso, vira dado não confiável para produção.
3. **Lei ≠ leiaute.** A camada de legislação resume **impacto para implementação**, não transcreve a norma;
   linka para as páginas técnicas, sem misturar base jurídica com especificação.
4. **Overlay pós-MOC explícito.** Reforma Tributária e NTs posteriores são overlay sobre o MOC 7.0; a trilha
   deixa claro o que é LC, NT, IT, XSD e cronograma — sem misturar dentro do MOC.

---

## Estado observado (base do diagnóstico)

O repositório está mais avançado que o diagnóstico inicial. A navegação de
`content/docs/(nfe-nfce)/meta.json` já inclui: comece-aqui, fundamentos, emissao-e-comunicacao,
leiaute-e-rejeicoes, eventos, danfe, contingencia, nfe-abi, nfag, nfgas, schemas, operacao,
notas-tecnicas, informes-tecnicos e referencia.

Já existem páginas/seções para: DANFE NFC-e e QR Code, schemas XSD, web services e arquitetura,
contingência, eventos, Notas Técnicas e Informes Técnicos pós-MOC, tabelas e códigos, proveniência
das fontes e serviços por UF.

As lacunas restantes não são "criar tudo", e sim fechar camadas sem dono próprio:

- legislação nacional;
- regras estaduais por UF como **matriz fiscal**, separada de endpoints;
- segurança, assinatura, TLS e XMLDSig como capítulo dedicado;
- Reforma Tributária como trilha própria;
- exemplos XML e casos de teste;
- padrão uniforme de fonte oficial por página (✅ Estágio 1);
- dados versionados consumíveis por código.

---

## Estágio 0 — estabilizar a base 🚫 DESCONSIDERADO

Registro histórico. Os planos de Notas Técnicas e Informes Técnicos já foram executados; esta etapa
fica apenas como memória do risco observado no checkpoint anterior (worktree com rename em andamento
`tmp/nfe/notas-tecnicas/PLANO-CONSOLIDACAO.md → docs/PLANO-CONSOLIDACAO.md`). Se o rename reaparecer no
`git status`, tratar como manutenção de worktree, não como etapa do plano.

---

## Estágio 1 — matriz de fontes oficiais ✅ CONCLUÍDO

Objetivo: transformar rastreabilidade editorial em padrão obrigatório.

Feito:

- `## Fonte` padronizado em 129 páginas MDX, com metadado mínimo: documento · versão · data ·
  páginas/capítulo · NT relacionada · schema/tabela relacionada · status.
- `content/docs/(nfe-nfce)/referencia/fontes-oficiais.mdx` — índice de fontes por camada (MOC, Anexos,
  Notas Técnicas, Informes Técnicos, XSD, legislação nacional e estadual).
- `bun run build` validado.

Critério de pronto (atingido): qualquer página permite rastrear de onde veio cada afirmação técnica;
divergências entre MOC, NT, IT e XSD ficam explícitas, não corrigidas silenciosamente.

---

## Estágio 2 — legislação nacional ✅ CONCLUÍDO

Objetivo: separar base jurídica de especificação técnica.

Feito (21/06/2026): criada `content/docs/(nfe-nfce)/legislacao/` com `index.mdx`, `ajuste-sinief-07-05-nfe.mdx`,
`ajuste-sinief-19-16-nfce.mdx`, `ato-cotepe-69-20-moc-7.mdx`, `lc-214-2025-rtc.mdx`, `normas-relacionadas.mdx`
e `meta.json`. Cada norma traz **resumo de impacto para implementação** (não transcrição) com link para as
páginas técnicas (Decisão 3). Seção registrada no `meta.json` da Parte NF-e/NFC-e (antes de `referencia`).
Back-links adicionados em `fundamentos/conceitos.mdx`, `leiaute-e-rejeicoes/tributos.mdx` e
`eventos/modelo-e-catalogo.mdx`; `referencia/fontes-oficiais.mdx` aponta para a nova seção. `bun run build` passou.

Estrutura criada:

```txt
content/docs/(nfe-nfce)/legislacao/
  index.mdx
  ajuste-sinief-07-05-nfe.mdx
  ajuste-sinief-19-16-nfce.mdx
  ato-cotepe-69-20-moc-7.mdx
  lc-214-2025-rtc.mdx
  normas-relacionadas.mdx
  meta.json
```

Prioridade e papel de cada norma:

- **Ajuste SINIEF 07/05** — institui a NF-e modelo 55: documento de existência digital, validade jurídica
  condicionada à assinatura e à autorização de uso. Base do DANFE Tipo 2 (alterado pelo Ajuste SINIEF 13/26).
- **Ajuste SINIEF 19/16** — institui a NFC-e modelo 65 e o DANFE-NFC-e; base do manual de QR Code.
- **Ato COTEPE/ICMS 69/20** — especificações técnicas da NF-e, DANFE e Web Services (conforme o AJ 07/05).
- **Lei Complementar 214/2025** — Reforma Tributária do Consumo: institui IBS, CBS e IS (liga ao Estágio 5).

Passos:

1. Criar `content/docs/(nfe-nfce)/legislacao/` com as páginas acima.
2. Cada norma com **resumo de impacto para implementação**, não transcrição — e link para as páginas
   técnicas que a aplicam (Decisão 3).
3. Registrar a seção em `content/docs/(nfe-nfce)/meta.json`, perto de `referencia`.
4. `bun run build` e atualizar a tabela de status.

Critério de pronto: páginas técnicas linkam para a base legal sem misturar lei com leiaute; cada norma
tem impacto resumido, com fonte (CONFAZ/Receita) e data.

---

## Estágio 3 — UFs e regras estaduais ✅ CONCLUÍDO

Objetivo: separar "endpoint por UF" de "regra fiscal estadual por UF". Hoje
`operacao/servicos-por-uf.mdx` é técnico-operacional; faltava a matriz fiscal estadual.

Feito (21/06/2026): criada `content/docs/(nfe-nfce)/ufs/` com `index.mdx`, `matriz-estadual.mdx`, 27 páginas
de UF e `meta.json`; seção registrada no `meta.json` da Parte NF-e/NFC-e (após `operacao`). Cada UF traz
configuração técnica (autorizador, SVC, portal, schema — do Portal Nacional, captura 20/06/2026) e regra
fiscal estadual (credenciamento, NFC-e ativa, cancelamento NF-e/NFC-e, contingência/EPEC offline, CSC/QR
Code, inutilização, cBenef×CST, SAT/ECF). Por escolha do usuário, valores estaduais foram pesquisados na
web (cancelamento NF-e por UF; NFC-e 30min padrão; EPEC só SP; PR offline; SP CF-e-SAT) e os campos
genuinamente voláteis ficam marcados "sujeito a verificação na SEFAZ" com fonte e data (Decisão 2).
Back-links em `servicos-por-uf`, `autorizadoras-e-ambientes`, `legislacao/index`, `ajuste-sinief-19-16` e
`referencia/fontes-oficiais`. `bun run build` passou.

Nova seção:

```txt
content/docs/(nfe-nfce)/ufs/
  index.mdx
  matriz-estadual.mdx
  acre.mdx … sao-paulo.mdx … (27 UFs)
  meta.json
```

Campos mínimos por UF: credenciamento NF-e/NFC-e · NFC-e ativa ou não · contingência offline NFC-e ·
EPEC para NFC-e quando aceito · CSC/token e URLs de QR Code · prazos de cancelamento · prazos/regras de
inutilização · cBenef × CST · particularidades SAT/ECF · autorizador e endpoints · regras facultativas
ativadas pela UF · **fonte oficial e data da captura** (Decisão 2).

Critério de pronto: um emissor resolve a configuração por `(modelo, UF, ambiente, serviço, data)`; toda
informação estadual tem fonte e data.

---

## Estágio 4 — segurança e assinatura ✅ CONCLUÍDO

Objetivo: tirar certificado, TLS e XMLDSig de páginas dispersas e criar uma trilha operacional própria.

Feito (21/06/2026): criada `content/docs/(nfe-nfce)/seguranca/` com `index.mdx`, `certificado-digital.mdx`,
`tls-mutuo.mdx`, `assinatura-xml.mdx`, `canonicalizacao.mdx`, `reference-uri-digest.mdx`,
`cadeia-certificado.mdx`, `erros-comuns.mdx` e `meta.json`; seção registrada no `meta.json` da Parte
NF-e/NFC-e (após `leiaute-e-rejeicoes`). Conteúdo consolidado a partir de `emissao-e-comunicacao/arquitetura`
(§4.1–§4.2, Tabelas 4-1/4-2), `emissao-e-comunicacao/web-services` (cadeia TLS) e
`leiaute-e-rejeicoes/grupos-finais` — sem duplicar (Decisão 1). Algoritmos do MOC 7.0 (RSA-SHA1, digest
SHA-1, chave 1024 bits) ficam marcados como **históricos**, com aviso para confrontar o schema vigente; a
cadeia de certificação TLS é tratada como conteúdo volátil com fonte e data de captura (Decisão 2).
Back-links adicionados em `arquitetura`, `web-services`, `grupos-finais` e `pipeline-de-validacao`.
`bun run build` passou.

Nova seção:

```txt
content/docs/(nfe-nfce)/seguranca/
  index.mdx
  certificado-digital.mdx
  tls-mutuo.mdx
  assinatura-xml.mdx
  canonicalizacao.mdx
  reference-uri-digest.mdx
  cadeia-certificado.mdx
  erros-comuns.mdx
  meta.json
```

Base a reaproveitar: `emissao-e-comunicacao/arquitetura.mdx`, `emissao-e-comunicacao/web-services.mdx`,
`leiaute-e-rejeicoes/grupos-finais.mdx`.

Critério de pronto: um implementador assina, transmite e diagnostica rejeição de assinatura sem caçar
informação em várias páginas; algoritmos históricos do MOC 7.0 ficam marcados como históricos.

---

## Estágio 5 — Reforma Tributária como trilha própria ✅ CONCLUÍDO

Objetivo: manter IBS/CBS/IS como overlay transversal, mas também navegável como tema independente.

Feito (21/06/2026): criada `content/docs/reforma-tributaria/` como **Parte independente** (irmã de `(nfe-nfce)` no root, em `/docs/reforma-tributaria`), com `index.mdx`, `lc-214-2025.mdx`, `nt-2025-002.mdx`, `ibs.mdx`, `cbs.mdx`, `imposto-seletivo.mdx`, `campos-nfe-nfce.mdx`, `tabelas-rtc.mdx`, `eventos-rtc.mdx`, `cronograma.mdx`, `exemplos-xml.mdx` e `meta.json`. Registrada no `content/docs/meta.json` (após `(nfe-nfce)`) e na tabela de tópicos do `content/docs/index.mdx`. A trilha **linka, não duplica** (Decisão 1) as páginas dono — [Tributos](/docs/leiaute-e-rejeicoes/tributos), [Totais](/docs/leiaute-e-rejeicoes/totais-e-fechamento), [Eventos](/docs/eventos/modelo-e-catalogo), [Tabelas e códigos](/docs/referencia/tabelas-e-codigos), [NT 2025.002](/docs/notas-tecnicas/2025-002), [IT 2025.002](/docs/informes-tecnicos/2025-002), [Cronograma](/docs/schemas/cronograma) — e **distingue LC, NT, IT, XSD e cronograma** (Decisão 4). Tabelas/alíquotas e datas voláteis marcadas com fonte+data (Decisão 2). `exemplos-xml.mdx` traz só o esqueleto dos grupos e remete as fixtures completas ao Estágio 6. Back-links em `notas-tecnicas/2025-002`, `schemas/cronograma`, `tributos`, `totais-e-fechamento`, `eventos/modelo-e-catalogo`, `referencia/tabelas-e-codigos`, `legislacao/lc-214-2025-rtc`, `legislacao/index` e `referencia/fontes-oficiais`. `bun run build` passou.

Nova seção:

```txt
content/docs/reforma-tributaria/
  index.mdx
  lc-214-2025.mdx
  nt-2025-002.mdx
  ibs.mdx · cbs.mdx · imposto-seletivo.mdx
  campos-nfe-nfce.mdx
  tabelas-rtc.mdx · eventos-rtc.mdx
  cronograma.mdx · exemplos-xml.mdx
  meta.json
```

Conteúdo já espalhado a reaproveitar (linkar, não duplicar — Decisão 1): `notas-tecnicas/2025-002.mdx`,
`schemas/cronograma.mdx`, `leiaute-e-rejeicoes/tributos.mdx`, `leiaute-e-rejeicoes/totais-e-fechamento.mdx`,
`eventos/modelo-e-catalogo.mdx`, `referencia/tabelas-e-codigos.mdx`.

Critério de pronto: quem implementa RTC segue uma trilha única, sem perder links para leiaute, totais,
tributos, eventos e tabelas; a trilha distingue LC, NT, IT, XSD e cronograma.

---

## Estágio 6 — exemplos XML e casos de teste ✅ CONCLUÍDO

Objetivo: transformar regra em implementação verificável.

Feito (21/06/2026): criada `content/docs/(nfe-nfce)/exemplos/` com `index.mdx` e 15 casos completos, cada um no padrão **contexto fiscal · trecho de XML · campos críticos · validações esperadas (cStat) · rejeições comuns · fonte**, com aviso de **valores fictícios** e links para a página dona em vez de duplicar leiaute (Decisão 1). Campos voláteis (ANP/`pBio`/ad rem) marcados com fonte+data (Decisão 2). Seção registrada no `meta.json` da Parte NF-e/NFC-e (antes de `referencia`); back-links em eventos, serviços, contingência, índice de leiaute e `fontes-oficiais`; `reforma-tributaria/exemplos-xml` reaponta para os casos. `bun run build` passou.

Nova seção:

```txt
content/docs/(nfe-nfce)/exemplos/
  index.mdx
  nfe-normal.mdx · nfce-normal.mdx
  nfe-devolucao.mdx · nfe-complementar.mdx · nfe-ajuste.mdx
  nfe-exportacao.mdx · nfe-importacao.mdx
  combustivel.mdx · medicamento.mdx
  nfce-contingencia-offline.mdx · epec.mdx
  cancelamento.mdx · carta-correcao.mdx · inutilizacao.mdx · distribuicao-dfe.mdx
  meta.json
```

Padrão de cada exemplo: contexto fiscal · XML mínimo ou trecho principal · campos críticos · validações
esperadas · rejeições comuns · fonte oficial · NTs e schemas relacionados.

Critério de pronto: cada exemplo ajuda a montar um caso completo, não só entender um campo isolado; deixa
claro quando os valores são fictícios.

---

## Estágio 7 — dados versionados (consumíveis por código) ✅ CONCLUÍDO

Objetivo: deixar tabelas e endpoints consumíveis por código, não só por texto.

Feito (21/06/2026): criados os catálogos TSV em `data/` — `data/tabelas/` (`manifest.tsv` com vigência+fonte
por tabela, `checksums.tsv` e 18 `<id>.tsv` extraídos dos snapshots, incluindo CFOP, NCM, `cProdANP`, FCP,
`tPag`, municípios, `cClassTrib`, `cCredPres`, combustíveis monofásicos, `pBio`, alíquotas da CBS) e
`data/endpoints/` (`autorizadores.tsv` resolvendo `UF → autorizador/SVC/schema/portal` para 27 UFs e
`webservices.tsv` com `(autorizador, serviço, versão, ambiente, URL)`, captura 20/06/2026 produção). O
extrator é dependency-free: `scripts/xlsx.ts` lê `.xlsx` via `unzip` + parse XML; `scripts/build-tabelas.ts`
gera os TSV e os hashes; `scripts/check-tabelas.ts` valida campos obrigatórios (fonte+vigência — Decisão 2),
integridade por hash e vigências, com `--fail-on-change` para CI; npm `tabelas:build`/`tabelas:check`; teste
`scripts/xlsx.test.ts`. `cBenef` documentado como por-UF (sem tabela nacional); `paises` (.ods) e
`unidades-medida` (.xls legado) ficam registrados sem extração automática. Documentado em
`referencia/dados-versionados.mdx` (registrado no `meta.json`), com back-links em `tabelas-e-codigos`,
`servicos-por-uf`, `versionamento` e `autorizadoras-e-ambientes`. `bun run build` passou; `tabelas:check` OK.

Entregáveis: catálogo estruturado para CFOP, NCM, ANP, FCP, `tPag`, municípios, `cClassTrib`, `cBenef`
quando disponível · catálogo de endpoints por UF/serviço/ambiente · campo de vigência e fonte em todos os
registros · script de verificação para detectar tabela vencida ou alterada.

Critério de pronto (atingido): documentação e ferramenta consomem a mesma fonte versionada; tabelas grandes
não ficam embutidas manualmente nas páginas MDX.

---

## Estágio 8 — revisão final de produto ✅ CONCLUÍDO

Objetivo: garantir que a documentação vire base prática de implementação.

Feito (22/06/2026): auditoria do checklist abaixo executada item a item; `bun run build`
passou (exit 0). Ressalva única: o passe **visual** desktop/mobile recai sobre o tema
responsivo do fumadocs — a integridade estrutural da navegação (201 páginas, 0 órfãs,
todos os `meta.json` resolvendo) foi verificada por script.

Checklist:

- [x] Nenhuma página relevante sem `## Fonte`. — 200/201; só `index.mdx` (capa) não tem.
- [x] Nenhuma regra estadual tratada como nacional. — regras isoladas em `ufs/`.
- [x] Nenhuma NT pós-MOC apenas listada quando deveria estar dobrada em tema. — 2025.002
  dobrada em `reforma-tributaria`, com back-links em NT e `tributos`.
- [x] Nenhum schema citado sem pacote e versão. — mapa em `schemas/pacotes-e-versoes.mdx`;
  `.xsd` nas páginas são placeholders ou links para o mapa.
- [x] Exemplos cobrindo emissão, eventos, contingência e consulta. — 15 casos em `exemplos/`.
- [x] Busca local retornando páginas úteis por `cStat`, campo XML, NT e UF. — testada ao vivo
  em `/api/search`: `539`, `cProdANP`, `2025.002`, `São Paulo` retornam páginas relevantes.
- [x] Navegação revisada em desktop e mobile. — estrutura verificada (0 órfãs, ordem coerente);
  passe visual delegado ao tema responsivo do fumadocs.

Critério de pronto: o Open Fiscal deixa de ser apenas guia do MOC e passa a ser base operacional para
implementação NF-e/NFC-e.

---

## Ordem recomendada

1. Estágio 1 — fontes oficiais. ✅
2. Estágio 2 — legislação nacional. ✅
3. Estágio 3 — UFs. ✅
4. Estágio 4 — segurança. ✅
5. Estágio 5 — Reforma Tributária. ✅
6. Estágio 6 — exemplos XML. ✅
7. Estágio 7 — dados versionados. ✅
8. Estágio 8 — revisão final. ✅

Os cinco blocos que mais fecham lacunas para sair de "guia do MOC" para base de implementação:
**legislação, UFs, segurança, Reforma Tributária e exemplos XML** (Estágios 2–6).
