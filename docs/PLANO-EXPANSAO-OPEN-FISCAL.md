# Plano de expansao do Open Fiscal

Este arquivo registra o plano de continuidade para permitir limpar o contexto e retomar o trabalho por partes.

Data do checkpoint: 2026-06-21.

## Marcador de progresso

Use este bloco como ponto de retomada depois de limpar o contexto. Execute **uma parte por vez**, atualize a tabela abaixo, rode a verificacao aplicavel e entao pare ou avance para a proxima parte explicitamente solicitada.

Status:

- `[ ]` pendente
- `[~]` em andamento
- `[x]` concluida
- `[!]` bloqueada ou precisa decisao

| Parte | Status | Ultima atualizacao | Evidencia / observacao |
|---:|:---:|---|---|
| 0 | `[x]` | 2026-06-21 | Desconsiderada por decisao: os planos de Notas Tecnicas e Informes Tecnicos ja foram executados; nao usar esta parte como bloqueio de retomada. |
| 1 | `[x]` | 2026-06-21 | `## Fonte` padronizado em 129 paginas MDX; criada `content/docs/(nfe-nfce)/referencia/fontes-oficiais.mdx`; `bun run build` passou. Planos de Notas Tecnicas e Informes Tecnicos ja executados. |
| 2 | `[ ]` | 2026-06-21 | Legislacao nacional ainda nao criada. |
| 3 | `[ ]` | 2026-06-21 | Matriz estadual por UF ainda nao criada. |
| 4 | `[ ]` | 2026-06-21 | Trilha de seguranca e assinatura ainda nao criada. |
| 5 | `[ ]` | 2026-06-21 | Trilha propria de Reforma Tributaria ainda nao criada. |
| 6 | `[ ]` | 2026-06-21 | Exemplos XML e casos de teste ainda nao criados. |
| 7 | `[ ]` | 2026-06-21 | Dados versionados consumiveis por codigo ainda nao criados. |
| 8 | `[ ]` | 2026-06-21 | Revisao final depende das partes anteriores. |

Proxima parte recomendada para retomar: **Parte 2 - Legislacao nacional**.

Ao iniciar uma nova sessao, leia este marcador, execute somente a parte pedida pelo usuario e atualize:

- status da parte;
- data da ultima atualizacao;
- evidencia objetiva, como arquivo criado, contagem validada, comando de build/check ou bloqueio.

## Estado observado

O repositório já está mais avançado do que o diagnóstico inicial publicado. A navegação de `content/docs/(nfe-nfce)/meta.json` já inclui:

- comece-aqui
- fundamentos
- emissao-e-comunicacao
- leiaute-e-rejeicoes
- eventos
- danfe
- contingencia
- nfe-abi
- nfag
- nfgas
- schemas
- operacao
- notas-tecnicas
- informes-tecnicos
- referencia

Já existem páginas ou seções relevantes para:

- DANFE NFC-e e QR Code: `content/docs/(nfe-nfce)/danfe/danfe-nfce-qrcode.mdx`
- schemas XSD: `content/docs/(nfe-nfce)/schemas/`
- web services e arquitetura: `content/docs/(nfe-nfce)/emissao-e-comunicacao/`
- contingencia: `content/docs/(nfe-nfce)/contingencia/`
- eventos: `content/docs/(nfe-nfce)/eventos/`
- Notas Tecnicas pos-MOC: `content/docs/(nfe-nfce)/notas-tecnicas/`
- Informes Tecnicos: `content/docs/(nfe-nfce)/informes-tecnicos/`
- tabelas e codigos: `content/docs/(nfe-nfce)/referencia/tabelas-e-codigos.mdx`
- proveniencia das fontes: `content/docs/(nfe-nfce)/referencia/proveniencia.mdx`
- servicos por UF: `content/docs/(nfe-nfce)/operacao/servicos-por-uf.mdx`

As lacunas principais restantes nao sao "criar tudo", mas fechar camadas que ainda nao tem dono proprio:

- legislacao nacional
- regras estaduais por UF como matriz fiscal, separada de endpoints
- seguranca, assinatura, TLS e XMLDSig como capitulo dedicado
- Reforma Tributaria como trilha propria
- exemplos XML e casos de teste
- padrao uniforme de fonte oficial por pagina
- dados versionados consumiveis por codigo

## Risco operacional registrado

Registro historico do checkpoint anterior. Nao usar como bloqueio para a sequencia atual, pois a Parte 0 foi desconsiderada por decisao.

O `git status` mostrava muitas alteracoes nao commitadas e um rename em andamento:

```txt
RD tmp/nfe/notas-tecnicas/PLANO-CONSOLIDACAO.md -> docs/PLANO-CONSOLIDACAO.md
```

No checkpoint, `docs/` existia, mas estava vazio antes da criacao deste arquivo. Se o rename aparecer novamente no `git status`, tratar como manutencao de worktree, nao como etapa obrigatoria do plano de expansao.

## Parte 0 - Estabilizar a base

Status: **desconsiderada por decisao**. Os planos de Notas Tecnicas e Informes Tecnicos ja foram executados; esta parte fica apenas como registro historico do risco observado.

Objetivo: fechar o estado atual antes de expandir conteudo.

Entregaveis:

- Resolver o rename quebrado de `docs/PLANO-CONSOLIDACAO.md`.
- Conferir se `content/docs/(nfe-nfce)/meta.json` reflete todas as secoes novas.
- Rodar build/check do projeto.
- Fazer um commit ou checkpoint antes de novas expansoes.

Criterio de pronto:

- Navegacao sem paginas orfas.
- Build/check passando.
- Worktree compreensivel, sem rename quebrado.

## Parte 1 - Matriz de fontes oficiais

Objetivo: transformar rastreabilidade editorial em padrao obrigatorio.

Entregaveis:

- Padronizar o bloco `## Fonte` em todas as paginas.
- Criar metadado minimo por pagina:
  - documento
  - versao
  - data
  - paginas ou capitulo
  - NT relacionada
  - schema ou tabela relacionada
  - status
- Criar uma pagina indice de fontes oficiais por camada:
  - MOC
  - Anexos
  - Notas Tecnicas
  - Informes Tecnicos
  - XSD
  - legislacao nacional
  - legislacao estadual

Criterio de pronto:

- Qualquer pagina permite rastrear de onde veio cada afirmacao tecnica relevante.
- Divergencias entre MOC, NT, IT e XSD ficam explicitas, nao corrigidas silenciosamente.

## Parte 2 - Legislacao nacional

Objetivo: separar base juridica de especificacao tecnica.

Nova secao sugerida:

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

Prioridade:

- Ajuste SINIEF 07/05: base da NF-e modelo 55.
- Ajuste SINIEF 19/16: base da NFC-e modelo 65 e DANFE NFC-e.
- Ato COTEPE/ICMS 69/20: especificacoes tecnicas da NF-e, DANFE e Web Services.
- Lei Complementar 214/2025: Reforma Tributaria do Consumo, IBS, CBS e IS.

Criterio de pronto:

- Paginas tecnicas conseguem linkar para a base legal sem misturar lei com leiaute.
- Cada norma tem resumo de impacto para implementacao, nao apenas transcricao.

## Parte 3 - UFs e regras estaduais

Objetivo: separar "endpoint por UF" de "regra fiscal estadual por UF".

Hoje existe `content/docs/(nfe-nfce)/operacao/servicos-por-uf.mdx`, mas ele e tecnico-operacional. Falta matriz fiscal estadual.

Nova secao sugerida:

```txt
content/docs/(nfe-nfce)/ufs/
  index.mdx
  matriz-estadual.mdx
  acre.mdx
  alagoas.mdx
  ...
  sao-paulo.mdx
  rondonia.mdx
  meta.json
```

Campos minimos por UF:

- credenciamento NF-e/NFC-e
- NFC-e ativa ou nao
- contingencia offline NFC-e
- EPEC para NFC-e, quando aceito
- CSC/token e URLs de QR Code
- prazos de cancelamento
- prazos e regras de inutilizacao
- cBenef x CST
- particularidades SAT/ECF onde existirem
- autorizador e endpoints
- regras facultativas ativadas pela UF
- fonte oficial e data da captura

Criterio de pronto:

- Um emissor consegue resolver configuracao por `(modelo, UF, ambiente, servico, data)`.
- Informacao estadual tem fonte e data, pois muda com frequencia.

## Parte 4 - Seguranca e assinatura

Objetivo: tirar certificado, TLS e XMLDSig de paginas dispersas e criar uma trilha operacional propria.

Nova secao sugerida:

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

Base inicial ja existe em:

- `content/docs/(nfe-nfce)/emissao-e-comunicacao/arquitetura.mdx`
- `content/docs/(nfe-nfce)/emissao-e-comunicacao/web-services.mdx`
- `content/docs/(nfe-nfce)/leiaute-e-rejeicoes/grupos-finais.mdx`

Criterio de pronto:

- Um implementador consegue assinar, transmitir e diagnosticar rejeicao de assinatura sem procurar informacao em varias paginas.
- Algoritmos historicos do MOC 7.0 ficam marcados como historicos quando aplicavel.

## Parte 5 - Reforma Tributaria como trilha propria

Objetivo: manter IBS/CBS/IS como overlay transversal, mas tambem navegavel como tema independente.

Nova secao sugerida:

```txt
content/docs/reforma-tributaria/
  index.mdx
  lc-214-2025.mdx
  nt-2025-002.mdx
  ibs.mdx
  cbs.mdx
  imposto-seletivo.mdx
  campos-nfe-nfce.mdx
  tabelas-rtc.mdx
  eventos-rtc.mdx
  cronograma.mdx
  exemplos-xml.mdx
  meta.json
```

Conteudo ja espalhado para reaproveitar:

- `content/docs/(nfe-nfce)/notas-tecnicas/2025-002.mdx`
- `content/docs/(nfe-nfce)/schemas/cronograma.mdx`
- `content/docs/(nfe-nfce)/leiaute-e-rejeicoes/tributos.mdx`
- `content/docs/(nfe-nfce)/leiaute-e-rejeicoes/totais-e-fechamento.mdx`
- `content/docs/(nfe-nfce)/eventos/modelo-e-catalogo.mdx`
- `content/docs/(nfe-nfce)/referencia/tabelas-e-codigos.mdx`

Criterio de pronto:

- Quem implementa RTC consegue seguir uma trilha unica, sem perder links para leiaute, totais, tributos, eventos e tabelas.
- A trilha deixa claro o que e LC, NT, IT, XSD e cronograma.

## Parte 6 - Exemplos XML e casos de teste

Objetivo: transformar regra em implementacao verificavel.

Nova secao sugerida:

```txt
content/docs/(nfe-nfce)/exemplos/
  index.mdx
  nfe-normal.mdx
  nfce-normal.mdx
  nfe-devolucao.mdx
  nfe-complementar.mdx
  nfe-ajuste.mdx
  nfe-exportacao.mdx
  nfe-importacao.mdx
  combustivel.mdx
  medicamento.mdx
  nfce-contingencia-offline.mdx
  epec.mdx
  cancelamento.mdx
  carta-correcao.mdx
  inutilizacao.mdx
  distribuicao-dfe.mdx
  meta.json
```

Padrao de cada exemplo:

- contexto fiscal
- XML minimo ou trecho principal
- campos criticos
- validacoes esperadas
- rejeicoes comuns
- fonte oficial
- NTs e schemas relacionados

Criterio de pronto:

- Cada exemplo ajuda a montar um caso completo, nao apenas entender um campo isolado.
- Exemplos deixam claro quando valores sao ficticios.

## Parte 7 - Dados versionados

Objetivo: deixar tabelas e endpoints consumiveis por codigo, nao so por texto.

Entregaveis:

- Catalogo estruturado para CFOP, NCM, ANP, FCP, `tPag`, municipios, `cClassTrib`, `cBenef` quando disponivel.
- Catalogo de endpoints por UF, servico e ambiente.
- Campo de vigencia e fonte em todos os registros.
- Script de verificacao para detectar tabela vencida ou alterada.

Criterio de pronto:

- Documentacao e ferramenta podem consumir a mesma fonte versionada.
- Tabelas grandes nao ficam embutidas manualmente nas paginas MDX.

## Parte 8 - Revisao final de produto

Objetivo: garantir que a documentacao vire base pratica de implementacao.

Checklist:

- Nenhuma pagina relevante sem `## Fonte`.
- Nenhuma regra estadual tratada como nacional.
- Nenhuma NT pos-MOC apenas listada quando deveria estar dobrada em tema.
- Nenhum schema citado sem pacote e versao.
- Exemplos cobrindo emissao, eventos, contingencia e consulta.
- Busca local retornando paginas uteis por `cStat`, campo XML, NT e UF.
- Navegacao revisada em desktop e mobile.

Criterio de pronto:

- O Open Fiscal deixa de ser apenas guia do MOC e passa a ser uma base operacional para implementacao NF-e/NFC-e.

## Ordem recomendada

1. Parte 1 - padronizar fontes. `[x]`
2. Parte 2 - legislacao nacional.
3. Parte 3 - UFs.
4. Parte 4 - seguranca.
5. Parte 5 - Reforma Tributaria.
6. Parte 6 - exemplos XML.
7. Parte 7 - dados versionados.
8. Parte 8 - revisao final.

## Proxima acao sugerida

Retomar pela Parte 2:

1. Criar `content/docs/(nfe-nfce)/legislacao/`.
2. Adicionar paginas para Ajuste SINIEF 07/05, Ajuste SINIEF 19/16, Ato COTEPE/ICMS 69/20 e LC 214/2025.
3. Atualizar `content/docs/(nfe-nfce)/meta.json`.
4. Rodar build/check.
5. Atualizar o marcador de progresso.
