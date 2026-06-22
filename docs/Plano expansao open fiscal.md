# Plano de Expansão — Open Fiscal

Mapa de trabalho para crescer a cobertura documental do projeto. Cada estágio é independente; a ordem reflete impacto × esforço.

---

## Legenda

| Marcador | Significado |
|---|---|
| ✅ Concluído | estágio entregue e integrado |
| 🔄 Em andamento | trabalho iniciado, não fechado |
| ⬜ Pendente | não iniciado |

---

## Estágio 1 — Notas Técnicas intermediárias ausentes (2014–2020)

**Status: ✅ Concluído**

NTs que existem em `tmp/nfe-oficial/notas-tecnicas/` mas não têm página em `content/docs/(nfe-nfce)/notas-tecnicas/`. São as que mais impactam quem lê a seção de NTs porque criam lacunas visíveis na linha do tempo.

| NT | Arquivo PDF | Página doc | Status |
|---|---|---|---|
| NT 2014.004 | `Nota Técnica 2014.004 - v.1.10 - Publicada em 11-08-2014.pdf` | `2014-004.mdx` | ✅ |
| NT 2015.002 | `Nota Técnica 2015.002 - v.1.41 - Publicada em 26-08-2016.pdf` | `2015-002.mdx` | ✅ |
| NT 2015.003 | `Nota Técnica 2015.003 - v.1.94 - Publicada em 23-06-2017.pdf` | `2015-003.mdx` | ✅ |
| NT 2016.001 | `Nota Técnica 2016.001 - v.1.40 - Publicada em 16-07-2018.pdf` | `2016-001.mdx` | ✅ |
| NT 2016.002 | `Nota Técnica 2016.002 - v.1.61 - Publicada em 10-09-2018.pdf` | `2016-002.mdx` | ✅ |
| NT 2017.001 | `Nota Técnica 2017.001 - v.1.50 - Publicada em 07-12-2018.pdf` | `2017-001.mdx` | ✅ |
| NT 2017.002 | `Nota Técnica 2017.002 - v.1.40 - Publicada em 15-01-2020.pdf` | `2017-002.mdx` | ✅ |
| NT 2018.001 | `Nota Técnica 2018.001 - v.1.10 - Publicada em 27-02-2020.pdf` | `2018-001.mdx` | ✅ |
| NT 2018.002 | `Nota Técnica 2018.002 - v.1.00 - Publicada em 23-04-2018.pdf` | `2018-002.mdx` | ✅ |
| NT 2018.003 | `Nota Técnica 2018.003 - v.1.01 - Publicada em 12-04-2019.pdf` | `2018-003.mdx` | ✅ |
| NT 2018.004 | `Nota Técnica 2018.004 - v.1.00 - Publicada em 21-12-2018.pdf` | `2018-004.mdx` | ✅ |
| NT 2020.003 | `Nota Técnica 2020.003 - v.1.00 - Publicada em 25-06-2020.pdf` | `2020-003.mdx` | ✅ |
| NT NFC-e 2014.001 | `Nota Técnica NFC-e 2014.001 - Publicada em 20-08-2014.pdf` | `nfce-2014-001.mdx` | ✅ |
| NT NFC-e 2014.003 | `Nota Técnica NFC-e 2014.003 - v.1.02 - Publicada em 12-01-2015.pdf` | `nfce-2014-003.mdx` | ✅ |

---

## Estágio 2 — Notas Técnicas históricas (2007–2013)

**Status: ✅ Concluído**

51 NTs de 2007 a 2013, em sua maioria pacotes de liberação de schemas (`PL_xxx`) e versões antigas do Manual de Integração, todas incorporadas ao MOC 7.0. Têm valor de rastreabilidade histórica, não de referência de implementação. Documentadas como **registros somente-leitura** (Resumo · Vigência · Fonte) com marcação `🕒 histórico`.

Arquivos de origem em `tmp/nfe-oficial/notas-tecnicas/`: `2007.001` a `2013.008`.

| Bloco | Páginas | Status |
|---|---|---|
| 2007 (`2007-001`…`2007-009`) | 9 | ✅ |
| 2008 (`2008-001`…`2008-006`) | 6 | ✅ |
| 2009 (`2009-001`…`2009-006`) | 6 | ✅ |
| 2010 (`2010-001`…`2010-010`) | 10 | ✅ |
| 2011 (`2011-001`…`2011-007`) | 7 | ✅ |
| 2012 (`2012-001`…`2012-005`) | 5 | ✅ |
| 2013 (`2013-001`…`2013-008`) | 8 | ✅ |

Todas registradas no `meta.json` da seção. O `index.mdx` de `notas-tecnicas/` ganhou o bloco **🕒 Registros históricos (compilados no MOC 7.0)** — que lista as 65 NTs compiladas (51 desta etapa + 14 do Estágio 1), separado dos 36 overlays pós-MOC. Build validado (`npm run build`).

> Follow-up opcional: na tabela "✅ Implementadas" de `referencia/notas-tecnicas.mdx`, os 65 itens ainda apontam só para o portal oficial; pode-se acrescentar uma coluna "Página" ligando às páginas internas, como já existe na lista de overlays.

---

## Estágio 3 — Completar leiaute dos documentos especializados

**Status: ⬜ Pendente**

As páginas de visão geral da NFGas, NFAg e NF-e ABI existem, mas as páginas de leiaute estão incompletas — faltam tabelas de campos, regras de validação e rejeições específicas extraídas dos Anexos I de cada manual.

| Seção | Fonte | Arquivo alvo | Status |
|---|---|---|---|
| NFGas — leiaute e regras | `MOC_NFGas_Anexo I_Leiaute e Regras de Validação_v1.00f.pdf` | `nfgas/leiaute-e-regras.mdx` | ⬜ |
| NFAg — leiaute e regras | `MOC_NFAg_Anexo I_Leiaute e Regras de Validação_v1.00k.pdf` | `nfag/leiaute-e-regras.mdx` | ⬜ |
| NF-e ABI — leiaute e regras | `MOC_NFeABI_Anexo I Leiaute e RV - v2.00.pdf` | `nfe-abi/leiaute-e-regras.mdx` | ⬜ |

---

## Estágio 4 — DANF* dos documentos especializados

**Status: ⬜ Pendente**

Páginas de DANFGas e DANFAG existem como esqueletos. Completar com especificações técnicas de layout, obrigatoriedade de campos por modo de emissão e QR Code.

| Seção | Fonte | Status |
|---|---|---|
| DANFGas | `MOC_NFGas_Anexo II_DANFGas_v1.00.pdf` | ⬜ |
| DANFAG | `MOC_NFAg_Anexo_II_DANFAG - V1.01.pdf` | ⬜ |

---

## Estágio 5 — Reconstrução detalhada do MOC 7.0

**Status: ⬜ Pendente**

Conforme o diagnóstico em `tmp/nfe-oficial/revisao-moc-7.0-visao-geral.md`, o conteúdo atual tem ~5,9 mil palavras contra 60,3 mil do PDF. Lacunas identificadas:

| Capítulo | Lacuna principal | Arquivo(s) alvo |
|---|---|---|
| Cap. 2 — Considerações iniciais | NFA-e, versões anteriores da chave, faixas de séries produtor rural, algoritmo completo hashCSRT, fluxo de autorização/distribuição | `fundamentos/conceitos.mdx`, `fundamentos/chave-de-acesso.mdx` (ampliar) |
| Cap. 3 — Eventos | Catálogo completo de eventos por autor (5 tabelas), fluxo EPEC detalhado, prorrogação ICMS, cancelamento por substituição NFC-e | `eventos/modelo-e-catalogo.mdx` (ampliar) |
| Cap. 4 — Arquitetura | Convenções de leiaute, recibo e protocolo, controle de uso indevido, versionamento de schemas e pacotes | `emissao-e-comunicacao/arquitetura.mdx` (ampliar) |
| Cap. 5 — Web Services | Tabelas de entrada/saída/validação/códigos para cada serviço (53 páginas → 746 palavras atualmente) | Uma página por serviço em `emissao-e-comunicacao/` |
| Cap. 6–7 — Distribuição e consulta | Separar `procNFe`, distribuição B2B e consulta por NSU | Repartir `emissao-e-comunicacao/distribuicao-dfe.mdx` |
| Cap. 8 — Tabelas e códigos | Estrutura, algoritmos, tabelas históricas anotadas | Nova seção em `referencia/` |
| Cap. 9 — Cálculo interestadual | Reproduzir matrizes históricas EC 87/2015 com fórmulas auditáveis | Nova página em `referencia/` |

---

## Estágio 6 — CT-e e MDF-e

**Status: ⬜ Pendente**

Documentos de transporte (CT-e modelo 57 e MDF-e modelo 58) estão arquivados em `tmp/arc` e fora da navegação publicada. Avaliar se cabem como nova seção de nível superior ou como subseção do índice atual antes de iniciar o conteúdo.

Pré-requisito: decidir escopo e estrutura de navegação.

---

## Critério de conclusão

Um estágio é marcado ✅ quando:
1. Todos os arquivos `.mdx` listados existem com conteúdo substantivo (não esqueleto).
2. Os arquivos estão registrados no `meta.json` correspondente.
3. Cada página tem a seção **Fonte** com rastreabilidade ao PDF de origem.
