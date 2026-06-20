# Plano de consolidação das Notas Técnicas (não implementadas)

Objetivo: dobrar as **39 NTs não implementadas** de `lista.md` para dentro das páginas
já existentes em `content/docs/(nfe-nfce)/`, **sem encher o contexto**. A estratégia é
dividir o trabalho em **estágios isolados**: cada estágio roda em um contexto novo
(`/clear` ou nova sessão), lê **apenas** o seu lote de PDFs, aplica as edições, registra
o progresso e **para**. Este arquivo é a memória compartilhada entre estágios.

- Fonte dos PDFs: `tmp/nfe/notas-tecnicas/`
- Destino: páginas em `content/docs/(nfe-nfce)/`
- Checklist de progresso: `lista.md` (marque `[x]` ao concluir cada NT)
- Mapa de destino e proveniência: `content/docs/(nfe-nfce)/referencia/proveniencia.mdx`

---

## Princípios de consolidação (valem em todos os estágios)

1. **Não criar uma página por NT.** Cada NT é uma *camada incremental* dobrada na
   página de tema correspondente (ver Mapa de roteamento abaixo). A página
   `referencia/notas-tecnicas.mdx` continua sendo só o índice.
2. **Marque vigência com os ícones já usados no projeto:** 🔄 *atualizado por NT* ·
   🕒 *histórico* · 📍 *depende de UF* (legenda em `proveniencia.mdx`).
3. **Registre a fonte.** Onde a página tiver seção `## Fonte`, acrescente a NT
   (número, versão vigente, data). Onde não tiver, não invente seção nova sem motivo.
4. **Respeite a revisão vigente.** Use sempre a versão/data da revisão vigente da NT
   (a que está em `lista.md`), nunca a 1ª publicação. Preserve cronogramas de
   homologação/produção quando a NT os define.
5. **Revisões superadas: não ler.** Quando o `lista.md` traz duas revisões da mesma NT,
   consolide só a vigente e marque a antiga como *superada* (ver Estágio 0).
6. **Conteúdo, não transcrição.** Extraia regra de validação, campo, grupo XML, evento
   ou prazo. Não cole o PDF. Mantenha o estilo enxuto das páginas atuais (tabelas,
   mermaid, frases curtas, voz imperativa).
7. **Edição idempotente entre estágios.** Se uma página-alvo já foi tocada num estágio
   anterior, apenas acrescente/mescle — não reescreva o que já está lá.

---

## Estágio 0 — preparação (rápido, 1 contexto)

1. Marque as **revisões superadas** em `lista.md` (texto `— superada por vX`, sem `[x]`,
   para não serem lidas):
   - `NT 2016.003 v3.62` → superada por **v3.70**
   - `NT 2025.002 v1.36` → superada por **v1.50**
   - `NT 2025.002 v1.40` → superada por **v1.50**
2. Confirme que `proveniencia.mdx` tem a legenda de vigência (já tem) e adicione uma
   linha de seção “Notas Técnicas dobradas” onde cada estágio anexará as NTs aplicadas.
3. Não leia PDF aqui. Encerre.

Restam **36 NTs** a ler (~814 páginas), distribuídas nos estágios 1–10.

---

## Protocolo de cada estágio (1–10)

Repita, em **contexto novo**, para o lote do estágio:

1. Leia este arquivo e a seção do estágio (só ela).
2. Para cada NT do lote:
   a. `Read` o PDF (use `pages` se for grande; leia em janelas de ≤20 páginas).
   b. Identifique tema(s) e confirme a **página-alvo** (coluna “Destino provável” é
      palpite — confirme pelo conteúdo).
   c. Aplique as edições com `Edit` na(s) página(s)-alvo: regra/campo/evento + marca 🔄.
   d. Acrescente a NT na seção `## Fonte` da página e em `proveniencia.mdx`.
   e. Marque `[x]` no `lista.md`.
3. Ao fim do lote, anote nas “Notas de execução” abaixo qualquer NT que mudou de
   destino ou que exigiu nova subseção.
4. **Pare.** Não comece o próximo estágio no mesmo contexto.

Orçamento alvo: ~100 páginas de PDF por estágio.

---

## Estágios e lotes

> “Destino provável” = melhor palpite de roteamento, **a confirmar na leitura**.
> Algumas NTs tocam mais de uma página.

### Estágio 1 — ~96 p (6 NTs)
| NT | p | Destino provável |
|---|--:|---|
| 2020.005 v1.21 | 24 | `leiaute-e-rejeicoes/itens-e-produtos`, `fundamentos/gtin-e-ccg` |
| 2022.001 v1.00 | 11 | a confirmar — `leiaute-e-rejeicoes/*` ou `eventos/*` |
| 2014.001 v1.30 | 22 | a confirmar — `emissao-e-comunicacao/*` |
| 2021.001 v1.01 | 14 | a confirmar — `leiaute-e-rejeicoes/*` |
| 2020.002 v1.01 | 12 | a confirmar — `leiaute-e-rejeicoes/totais-e-fechamento` |
| 2020.006 v1.31 | 13 | `leiaute-e-rejeicoes/identificacao-e-atores` (intermediador/marketplace) |

### Estágio 2 — ~85 p (6 NTs)
| NT | p | Destino provável |
|---|--:|---|
| 2021.004 v1.35 | 20 | a confirmar |
| 2022.003 v1.11 | 15 | a confirmar |
| 2022.004 v1.10 | 7 | a confirmar |
| 2016.003 v3.70 | 11 | a confirmar (consolidar só a v3.70; v3.62 superada) |
| 2023.005 v1.02 | 16 | a confirmar |
| 2024.002 v1.00 | 16 | a confirmar |

### Estágio 3 — ~69 p (6 NTs)
| NT | p | Destino provável |
|---|--:|---|
| 2020.007 v1.40 | 13 | a confirmar |
| 2020.004 v1.10 | 5 | a confirmar |
| 2024.001 v1.20 | 18 | a confirmar |
| 2023.004 v1.20 | 16 | a confirmar |
| 2023.003 v1.20 | 9 | a confirmar |
| 2022.005 v1.11 | 8 | a confirmar |

### Estágio 4 — ~82 p (2 NTs)
| NT | p | Destino provável |
|---|--:|---|
| 2015.001 v1.30 | 60 | a confirmar (NT extensa — ler em janelas) |
| 2021.002 v1.12 | 22 | a confirmar |

### Estágio 5 — ~61 p (2 NTs)
| NT | p | Destino provável |
|---|--:|---|
| 2021.003 v1.40 | 46 | a confirmar (ler em janelas) |
| Conjunta 2025.001 | 15 | a confirmar (reforma IBS/CBS — `leiaute-e-rejeicoes/tributos`) |

### Estágio 6 — ~74 p (2 NTs)
| NT | p | Destino provável |
|---|--:|---|
| 2023.001 v1.60 | 46 | a confirmar (ler em janelas) |
| 2018.005 v1.52 | 28 | a confirmar |

### Estágio 7 — ~70 p (4 NTs, concluído)
| NT | p | Destino provável |
|---|--:|---|
| 2019.001 v1.70 | 26 | leiaute-e-rejeicoes/* · eventos/epec |
| 2025.001 v1.03 (corrigido) | 15 | emissao-e-comunicacao/autorizacao · leiaute-e-rejeicoes/* · danfe/danfe-nfce-qrcode |
| 2023.002 v1.01 | 11 | fundamentos/* · identificacao-e-atores · autorizacao · eventos/cancelamento |
| 2014.002 v1.30 | 18 | emissao-e-comunicacao/distribuicao-dfe · recibo-e-uso-indevido |

### Estágio 8 — ~64 p (4 NTs, concluído)
| NT | p | Destino provável |
|---|--:|---|
| 2022.002 v1.30a | 13 | identificacao-e-atores · tributos · totais-e-fechamento |
| 2026.001 v1.00 | 18 | arquitetura · series-e-numeracao · identificacao-e-atores · grupos-finais · eventos/cancelamento |
| 2020.001 v1.60 | 19 | eventos/manifestacao-do-destinatario |
| 2024.003 v1.10 | 14 | identificacao-e-atores · tributos · grupos-finais · codigos-de-retorno |

### Estágio 9 — ~61 p (3 NTs)
| NT | p | Destino provável |
|---|--:|---|
| 2026.002 v1.00 | 22 | a confirmar |
| 2026.003 v1.00 | 25 | a confirmar |
| 2026.004 v1.01 | 14 | a confirmar |

### Estágio 10 — ~97 p (1 NT)
| NT | p | Destino provável |
|---|--:|---|
| 2025.002 v1.50 | 97 | a confirmar (vigente; v1.36 e v1.40 superadas — não ler). Ler em janelas de ≤20 p |

---

## Estágio 11 — fechamento (1 contexto)

1. Confira que as 36 NTs ativas estão `[x]` em `lista.md` e as 3 superadas marcadas.
2. Atualize a tabela de contagem em `referencia/notas-tecnicas.mdx` se o critério mudou
   (hoje: 65 implementadas / 39 não implementadas).
3. Revise `proveniencia.mdx`: todas as NTs dobradas listadas, com versão e data vigentes.
4. `pnpm`/build de docs (ver `package.json`) para validar MDX/links. Corrija quebras.
5. Relate divergências de roteamento nas “Notas de execução”.

---

## Mapa de roteamento por tema (referência rápida)

Para decidir o destino ao ler cada NT, use as páginas existentes:

- **Fundamentos:** chave-de-acesso, conceitos, gtin-e-ccg, responsavel-tecnico,
  series-e-numeracao, cadastros-e-beneficios
- **Emissão/comunicação:** autorizacao, ret-autorizacao, status-servico,
  consulta-protocolo, consulta-cadastro, inutilizacao, distribuicao-dfe, web-services
- **Leiaute/rejeições:** identificacao-e-atores, itens-e-produtos, tributos,
  totais-e-fechamento, grupos-finais, codigos-de-retorno, mapa-do-xml,
  pipeline-de-validacao
- **Eventos:** cancelamento, carta-de-correcao, epec, manifestacao-do-destinatario,
  ator-interessado, modelo-e-catalogo, prorrogacao-icms
- **DANFE:** danfe-nfe, danfe-nfce-qrcode, codigo-de-barras, simplificado-e-contingencia
- **Contingência:** nfe, nfce-offline, escolha-da-modalidade, recuperacao-e-conciliacao
- **Operação:** autorizadoras-e-ambientes, servicos-por-uf, testes-e-homologacao,
  versionamento, boas-praticas-nfce
- **Referência:** tabelas-e-codigos, calculo-interestadual, glossario, notas-tecnicas
- Documentos novos (modelos 75/76/77): `nfag/`, `nfgas/`, `nfe-abi/`

---

## Notas de execução (preencher durante os estágios)

### Aprendizado de método (importante)

- **Use `pdftotext -layout "arquivo.pdf" -` para ler as NTs**, não `Read` de imagem. A
  leitura por imagem consome contexto de forma desproporcional; o texto extraído é
  suficiente para roteamento e consolidação. (Confirmado: `/opt/homebrew/bin/pdftotext`
  disponível.) Use `grep -iE` sobre a saída para isolar campos/códigos/regras.
- Padronizou-se a seção **`## Overlay de NTs`** nas páginas de leiaute (tabela
  `NT (vigente) | Delta`). Estágios futuros **acrescentam linha** nessa tabela quando
  ela já existe, em vez de criar seção nova.
- Cada página tocada recebe sufixo `Overlay: NT XXXX.YYY vZ (data)` na seção `## Fonte`.

### Estágio 1 — roteamento efetivo (concluído)

- **2020.005 v1.21** → itens-e-produtos (cBarra, tpViaTransp, DUImp, cAgreg) ·
  tributos (ICMS-ST deson., FCP dif. CST51, modBCST=6, indSomaPIS/COFINSST) ·
  totais-e-fechamento (W16-10) · codigos-de-retorno (242/446/452/939/940/307) ·
  calculo-interestadual (NA15-10/NA17-10).
- **2022.001 v1.00** → gtin-e-ccg (novo WS de Consulta GTIN).
- **2014.001 v1.30** → eventos/epec (EPEC PF, tolerância 5 min, consulta Portal).
- **2021.001 v1.01** → eventos/modelo-e-catalogo (eventos 110130/110131 Comprovante de Entrega).
- **2020.002 v1.01** → tributos (IPI) · tabelas-e-codigos (cEnq 163-165; tPag externa).
- **2020.006 v1.31** → identificacao-e-atores (indIntermed B25c) · grupos-finais (infIntermed YB, YA05).

### Estágio 2 — roteamento efetivo (concluído)

- **2021.004 v1.35** → tributos (FCP-ST no grupo de Partilha N10a: N23.1/vBCFCPST/pFCPST/vFCPST;
  ISSQN cListServ U06-10) · itens-e-produtos (grupo `obsItem` VA; veículos tpVeic/espVeic
  J19-10/J20-10/J20-20; medicamentos K01-20 + rastro, K01-10 suspensa, cProdANVISA 11 dígitos) ·
  totais-e-fechamento (transporte X03-30, X04-30…X04-100) · grupos-finais (tpAto em procRef/infAdic
  + Z13-10; infAdFisco Z02-10/Z02-20 SC, impl. futura). NT toca 4 páginas.
- **2022.003 v1.11** → identificacao-e-atores (refNFeSig BA02a, NFref 500→999, C02a emitente PF,
  7C21-10 CRT) · tributos (N17c-30 FCP só CE) · codigos-de-retorno (474, 475, 951, 952, 953).
- **2022.004 v1.10** → tributos/ISSQN (U01-20, parametrização 0/1/2 por UF, rejeição 592).
- **2016.003 v3.70** → itens-e-produtos (nova Tabela de NCM/Utrib vigente 01/04/2024,
  Res. Gecex 547/2023; +57/−17 NCM). Roteado para itens, não tabelas-e-codigos (NCM é do item).
- **2023.005 v1.02** → eventos/modelo-e-catalogo (110192/110193 Insucesso na Entrega, só mod. 55,
  WS SVRS) · codigos-de-retorno (460, 821–826).
- **2024.002 v1.00** → eventos/modelo-e-catalogo (110750/110751 ECONF, grupo detPag) ·
  codigos-de-retorno (657, 961, 437, 618).
- Desvio: o grupo de Transporte (X) mora em `totais-e-fechamento` (não em grupos-finais);
  `grupos-finais` ganhou sua 1ª seção `## Overlay de NTs`.

### Estágio 3 — roteamento efetivo (concluído)

- **2020.007 v1.40** → eventos/ator-interessado (tpAutor 1/2/3, tpAutorizacao+xCondUso,
  prazo 6 meses, RV 4P24-10 exige autorizado emitente de CT-e) · codigos-de-retorno
  (371/421/422/423/448/449/585/827–831).
- **2020.004 v1.10** → danfe/simplificado-e-contingencia (DANFE Simplificado – Etiqueta:
  papel ≥55 mm, chave no canto superior direito, fonte ≥6 pt, campos obrigatórios;
  **valor total da NF-e pode ser suprimido** desde a v1.10 — §15-A Ajuste SINIEF 07/05).
  Página de DANFE não tem `## Overlay de NTs`; consolidado no corpo + Vigência/Fonte.
- **2024.001 v1.20** → identificacao-e-atores (CRT=4 MEI no C21; ICMSSN102/900 p/ CRT 1 ou 4;
  7C21-10) · tributos (orig N11-10/966; CSOSN MEI N12a-80/81/782; N12-20/N12a-10; vigência
  01/04/2025) · itens-e-produtos (GTIN facult. I03-30/I12-60; NCM facult. interna I05-10;
  CFOP MEI N12a-90/91/337 e devolução I08-140; CFOP 5.910 na NFC-e I08-150) ·
  codigos-de-retorno (337/590/591/781/782/966 + **fim da denegação no modelo 55**:
  1C17-40 excluída, 1C17-50→307, 5E17-40→302, 5E17-60→303, Ajuste SINIEF 43/23).
  Desvio: a exclusão da `N17c-30` (CE) foi anotada na linha de overlay da NT 2022.003 em
  `tributos` (idempotência — a regra fora dobrada no Estágio 2).
- **2023.004 v1.20** → grupos-finais (YA: dPag/CNPJPag/UFPag/CNPJReceb/idTermPag;
  YA04-20/963; **vTroco até R$ 300.000** YA09-20/965) · tributos (indDeduzDeson N28b;
  N28-12/652 SUFRAMA) · itens-e-produtos (importação CPF I23d1) · totais-e-fechamento
  (W16-10 exceção indDeduzDeson; X03-10/X03-20 desabilitadas) · codigos-de-retorno
  (652/796/963/965; 657 e 961 já existiam pela NT 2024.002 — não duplicados). ECONF saiu
  desta NT (já dobrado pela 2024.002 no Estágio 2).
- **2023.003 v1.20** → tributos (CFOP 5.949 na NFC-e por UF: SP gorjeta CST40/CSOSN900,
  RS, CE 5.403/5.405; N12-40/382, N12a-40/386, I08-150/725, N12-70/508). Códigos
  382/386/508/725 já são do MOC/anteriores — sem linha nova em codigos-de-retorno.
- **2022.005 v1.11** → calculo-interestadual (reativa NA01-20/694 ICMSUFDest; destino =
  UF de entrada física, AJ SINIEF 18/2022) · totais-e-fechamento (devolução 3BA02-50/54/58/64/68,
  545/546/566/567/581, tolerância R$ 1,00, exceção comércio exterior idDest=3) ·
  codigos-de-retorno (545/546/566/567/581/694). Desvio: regras 3BA02 (NF-e referenciada)
  consolidadas em `totais-e-fechamento` por tratarem de comparação de totais (vNF/vICMS/vFCP),
  e não em `identificacao-e-atores`.

### Estágio 4 — roteamento efetivo (concluído)

- **2015.001 v1.30** → eventos/prorrogacao-icms (modos **solicitação parcial** SP × **completa**
  MG — novidade da v1.30, MG em produção 06/01/2025; `justStatus` P25 1–10 e P29 1–5; vínculo
  por `idPedido` P19; `nSeqEvento` sequencial por tipo; ordem de cancelamento 2º antes do 1º;
  limite de pedidos pendentes `P13-14` parametrizável 20→1 por UF; distribuição DF-e:
  pedido/cancelamento só ao destinatário, resposta do Fisco a ambos) · codigos-de-retorno
  (638/639/808/809/810/811). NT extensa, mas o **conteúdo novo** (deltas v1.20/v1.30) cabe numa
  página — a maior parte do PDF é leiaute de WS e exemplos de fluxo já cobertos pelo MOC.
- **2021.002 v1.12** (NFF — Nota Fiscal Fácil, `tpEmis=3`) → series-e-numeracao (faixa NFF
  000–999, `procEmi=3`, lei de formação da chave: série não distingue CPF/CNPJ → 5º dígito do
  `nNF` `1`=CNPJ/`2`=CPF) · contingencia/escolha-da-modalidade (nota: `tpEmis=3` não é
  contingência — ex-SCAN reaproveitado) · identificacao-e-atores (cert. só SVRS F03/F03B/A08;
  ZD, 1C17-*, 5E17-*, C02a-*, E04-20 não se aplicam à NFF) · itens-e-produtos (grupos `infProdNFF`
  I86 e `infProdEmb` I87) · grupos-finais (grupo `infSolicNFF` ZE, JSON do app) · codigos-de-retorno
  (818/819/820/832/833/834). NT toca 6 páginas.
- Desvio: a chave NFF foi consolidada em **series-e-numeracao** (lar das faixas de série e da lei
  de formação), com referência cruzada a partir de identificacao-e-atores e escolha-da-modalidade,
  em vez de inflar a página de chave-de-acesso.

### Estágio 5 — roteamento efetivo (concluído)

- **2021.003 v1.40** (Validação de GTIN; substitui a NT 2017.001, já no MOC 7.0) → gtin-e-ccg
  (nova subseção "Ativação da validação no CCG por grupo de NCM": grupos I–IV; **delta v1.40 =
  grupo IV** = NCM com redução/zero de IBS/CBS da LC 214/2025, teste 01/07/2025 / produção
  01/10/2025; RVs 9I03-10/9I12-10 etapa 1, 9I03-20/9I12-20 etapa 2, CEST futuro) ·
  codigos-de-retorno (890/891/894/895 — só as 4 rejeições de CCG; 611/612/882–889 já vêm do
  MOC 7.0 via NT 2017.001, não duplicadas). Quase todo o PDF (46 p) é Anexo I/II (listas de
  NCM e CFOP) — o conteúdo novo cabe na tabela de grupos.
- **Conjunta 2025.001 v1.00** (CNPJ Alfanumérico — **não** era IBS/CBS como o palpite dizia) →
  fundamentos/chave-de-acesso (CNPJ 12 primeiras posições `[A-Z0-9]`; regex campo
  `[A-Z0-9]{12}[0-9]{2}` e chave `[0-9]{6}[A-Z0-9]{12}[0-9]{26}`; **DV módulo 11 com cada
  caractere por ASCII−48**, A=17…, numérico atual = caso particular; DV da chave converte os 44;
  letras I/O/U/Q/F vedadas a confirmar; homol. 06/04/2026 / prod. 06/07/2026; IN RFB 2229/2024) ·
  danfe/codigo-de-barras (padrão **híbrido 128C + 128A**, troca via código 100/Code A; largura
  não impacto sobe p/ 11,5 cm; até 539 posições).
- Desvio de palpite: a "Conjunta 2025.001" do plano não trata de Reforma IBS/CBS, e sim de CNPJ
  Alfa — roteada para chave-de-acesso + código-de-barras, não para tributos. (Cuidado: existe
  outra **NT 2025.001 v1.03** distinta no Estágio 7.) A ligação IBS/CBS apareceu, isso sim, no
  **grupo IV da NT 2021.003**.

### Estágio 6 — roteamento efetivo (concluído)

- **2023.001 v1.60** (Tributação Monofásica sobre Combustíveis — Conv. ICMS 199/2022, Ajuste
  SINIEF 01/2023) → tributos (novos CST **02/15/53/61**; imposto **ad rem**: qBCMono/adRemICMS/
  vICMSMono N37a/N38/N39, retenção qBCMonoReten/adRemICMSReten/vICMSMonoReten, retido ant.
  vICMSMonoRet; diferimento CST 53 pDif/vICMSMonoDif; pRedAdRem N47/motRedAdRem N48; regras
  N12-20/30/70, N12-100/110, N37a-10/N39a-10/N43a-10, N38/40/44-10 revogadas+recriadas,
  N39/41/45-10; v1.60 ajusta N41-10/N41-20 p/ refinaria de diesel B) · itens-e-produtos (grupo
  `comb`/LA: cProdANP/descANP → Tabela ANP; I13-20 uTrib rej. 854; pBio LA17; grupo origComb
  LA18 com indImport/cUFOrig/pOrig; LA17-10/20, LA18-10/20/30, LA21-10/20; **LA18-10 ativada
  01/10/2025**; LA03d-10 excluída) · totais-e-fechamento (vICMSMono/vICMSMonoReten/vICMSMonoRet +
  qBC* no grupo W; W16-10 soma vICMSMonoReten; W06c/d/e-10 e W06b.1/c.1/d.1-10 tol. R$ 0,01) ·
  codigos-de-retorno (700/723/744/747/767/768/769/854/907/908/909/958–969). A maior parte das
  46 p é a "Tabela de Combustíveis Sujeitos à Trib. Monofásica" (parametrizada por Informe
  Técnico, não transcrita).
- **2018.005 v1.52** (Alteração de Leiaute NF-e/NFC-e — Responsável Técnico/CSRT, Local de
  Retirada/Entrega, Repasse ICMS-ST) → fundamentos/responsavel-tecnico (página já existia; delta
  v1.52 = **cronograma PR** ZD07-10 idCSRT/hashCSRT obrigatórios em prod até 23/02/2026, demais
  regras CSRT de implementação futura; rej. 972–978) · identificacao-e-atores (grupos **F (local
  de retirada)** e **G (local de entrega)** com CNPJ/CPF, xNome, CEP, cPais/xPais, fone, email,
  IE; F11-10/G11-10 rej. 970, F15-10/G15-10 rej. 971) · tributos (campos pST N26a/vICMSSubstituto
  N26b ocorrência 0-1 nos grupos CST 60/Repasse ICMS-ST/CSOSN 500; Complemento/Restituição do
  ICMS-ST combustíveis; N12-81/82, N12a-50/60 rej. 938/906; N33-10 eliminada; N12-81/N12a-50 não
  no mod. 65) · danfe/danfe-nfe (exibição de local de retirada/entrega + Modalidade do Frete) ·
  codigos-de-retorno (906/938/970–978).
- **Colisão de código 966:** a NT 2024.001 (origem da mercadoria) e a regra N45-10 da NT 2023.001
  (Valor do ICMS retido anteriormente difere do calculado) usam o mesmo `cStat` 966. Mantido o
  966 existente na tabela de codigos-de-retorno e adicionada nota de aviso (não duplicada a linha).
- Desvio: o conteúdo de CSRT já estava em `fundamentos/responsavel-tecnico` (criada antes da
  consolidação) — apenas acrescentado o delta v1.52, sem duplicar o algoritmo SHA-1/Base64.

### Estágio 7 — roteamento efetivo (concluído)

- **2019.001 v1.70** → identificacao-e-atores (cNF, documentos referenciados, destinatário e
  validações no CCC) · itens-e-produtos (ordem de `nItem`, crédito presumido e `cBenefRBC`) ·
  tributos (`cBenef` × CST, crédito presumido, diferimento, ST por MVA e ZFM) ·
  totais-e-fechamento (limite da base de cálculo do ICMS) · eventos/epec (validações do
  destinatário no CCC sem denegação).
- **2025.001 v1.03 (corrigido)** → autorizacao (sincronismo do lote e atraso da emissão) ·
  identificacao-e-atores (`indIEDest`) · grupos-finais (conciliação e `tPag=91`) ·
  totais-e-fechamento (vencimento das duplicatas) · danfe/danfe-nfce-qrcode (regras `ZX02-*`).
- **2023.002 v1.01** → chave-de-acesso e series-e-numeracao (NFC-e de produtor rural PF) ·
  identificacao-e-atores (emitente CPF, NFA de SC e fim da denegação na NFC-e) · autorizacao
  (lote síncrono do modelo 65) · eventos/cancelamento (chave e autor em CPF).
- **2014.002 v1.30** → distribuicao-dfe (evolução do serviço, NSU e documentos distribuídos) ·
  recibo-e-uso-indevido (rejeição 656, limites, bloqueio e retomada).
- Desvio: as quatro NTs tocaram mais de uma página; não foi necessário criar nova página.

### Estágio 8 — roteamento efetivo (concluído)

- **2022.002 v1.30a** → identificacao-e-atores (exceções de exterior para CFOP 7.667,
  7.552 e 7.501; `refNFeSig` em ajuste) · tributos (desoneração PCD no CST 20 e
  diferimento opcional no CST 90) · totais-e-fechamento (dispensa de transportador no
  abastecimento equiparado à exportação).
- **2026.001 v1.00** → arquitetura (fluxo, vínculo e assinatura do PAA) ·
  series-e-numeracao (`procEmi=4`, séries 970–979) · identificacao-e-atores (elegibilidade
  por CRT) · grupos-finais (`infPAA`, assinatura RSA e RV ZG) · eventos/cancelamento
  (`infPAA` no evento) · codigos-de-retorno (1178–1184).
- **2020.001 v1.60** → eventos/manifestacao-do-destinatario (CPF, até dois eventos
  conclusivos por tipo, última manifestação vigente, prazos de 10/90 dias, obrigação e WS).
- **2024.003 v1.10** → grupos-finais (grupo agropecuário ZF, receituário e guias) ·
  tributos (exceção MEI para ativo imobilizado) · identificacao-e-atores (remoção da
  `I08-94`) · codigos-de-retorno (308–312 e 835–839).
- Desvio: a NT 2026.001 exigiu o maior espalhamento do lote por introduzir um novo ator e
  um novo processo de emissão. A NT 2024.003 usa grupo raiz ZF, por isso foi consolidada
  em grupos-finais, e não em itens-e-produtos.

### Notas de execução dos próximos estágios

- _(cada estágio anota aqui desvios de roteamento, NTs sem alvo claro, etc.)_
