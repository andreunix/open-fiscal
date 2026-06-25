# Plano de separacao por contexto e schema

Objetivo: reorganizar a documentacao para refletir a fronteira tecnica correta entre os documentos fiscais.
NF-e e NFC-e continuam no mesmo contexto porque compartilham a base de schema, servicos, eventos e regras
centrais do MOC. Documentos com schemas e manuais especificos deixam de ficar dentro de `NF-e e NFC-e` e
passam a ser topicos proprios na raiz de `content/docs`.

## Status de execucao

Concluido em 23/06/2026.

| Estagio | Status | Evidencia |
|---|---|---|
| 1 - Navegacao raiz e fronteira editorial | concluido | `content/docs/meta.json` lista `nfe-abi`, `nfag` e `nfgas`; `content/docs/(nfe-nfce)/meta.json` nao lista mais esses topicos. |
| 2 - Movimentacao dos conteudos | concluido | Pastas movidas para `content/docs/nfe-abi/`, `content/docs/nfag/` e `content/docs/nfgas/` com `git mv`. |
| 3 - Links internos e aliases | concluido | Busca nao encontrou URLs antigas do tipo `/docs/nfe-nfce/nfe-abi`, `/docs/nfe-nfce/nfag` ou `/docs/nfe-nfce/nfgas`; as URLs publicas continuam em `/docs/<topico>`. |
| 4 - Separacao dos schemas e fontes | concluido | README, indice raiz, indice NF-e/NFC-e, proveniencia e pacotes de schema atualizados para tratar os documentos especializados como topicos proprios. |
| 5 - Build e revisao de consistencia | concluido | `bun run build` passou em 23/06/2026. |

---

## Decisao de arquitetura

### Fica junto

`content/docs/(nfe-nfce)/`

Escopo: NF-e modelo 55 e NFC-e modelo 65.

Motivo: apesar de terem usos diferentes, NF-e e NFC-e compartilham o mesmo ecossistema tecnico: schema-base,
servicos de autorizacao/consulta/eventos, MOC, notas tecnicas, QR Code/DANFE relacionado, contingencia,
seguranca, rejeicoes e tabelas nacionais.

### Vira topico raiz

Novos topicos irmaos de `NF-e e NFC-e`:

```txt
content/docs/nfe-abi/
content/docs/nfag/
content/docs/nfgas/
```

Motivo: cada um tem manual, anexos, leiaute, regras de validacao, DANF* e/ou schema proprio. Devem poder
evoluir sem contaminar a navegacao principal de NF-e/NFC-e.

---

## Estado antes da execucao

Antes da execucao, os documentos especializados estavam publicados dentro de `content/docs/(nfe-nfce)/`:

```txt
content/docs/(nfe-nfce)/nfe-abi/
content/docs/(nfe-nfce)/nfag/
content/docs/(nfe-nfce)/nfgas/
```

Isso mistura dois niveis diferentes:

- contexto compartilhado NF-e/NFC-e;
- documentos fiscais derivados/especializados com schema proprio.

---

## Estrutura alvo

```txt
content/docs/
  meta.json
  index.mdx

  (nfe-nfce)/
    meta.json
    nfe-nfce.mdx
    comece-aqui/
    fundamentos/
    emissao-e-comunicacao/
    leiaute-e-rejeicoes/
    seguranca/
    eventos/
    danfe/
    contingencia/
    schemas/
    operacao/
    ufs/
    notas-tecnicas/
    informes-tecnicos/
    legislacao/
    exemplos/
    referencia/

  nfe-abi/
    meta.json
    index.mdx
    visao-geral.mdx
    leiaute-e-regras.mdx

  nfag/
    meta.json
    index.mdx
    visao-geral.mdx
    leiaute-e-regras.mdx
    danfag.mdx

  nfgas/
    meta.json
    index.mdx
    visao-geral.mdx
    leiaute-e-regras.mdx
    danfgas.mdx

  reforma-tributaria/
```

`content/docs/meta.json` deve listar os topicos de raiz, por exemplo:

```json
{
  "title": "Open Fiscal",
  "pages": [
    "index",
    "(nfe-nfce)",
    "nfe-abi",
    "nfag",
    "nfgas",
    "reforma-tributaria"
  ]
}
```

---

## Plano de execucao

## Estagio 1 - Navegacao raiz e fronteira editorial

Status: concluido em 23/06/2026.

Entregas:

- Remover `nfe-abi`, `nfag` e `nfgas` de `content/docs/(nfe-nfce)/meta.json`.
- Adicionar `nfe-abi`, `nfag` e `nfgas` em `content/docs/meta.json`.
- Atualizar `content/docs/index.mdx` para apresentar os documentos especializados como topicos proprios.
- Ajustar o texto da pagina inicial de NF-e/NFC-e para deixar claro que ela cobre modelos 55 e 65.

Critério de pronto: a navegacao de topo mostra NF-e/NFC-e, NF-e ABI, NFAg e NFGas como areas separadas.

## Estagio 2 - Movimentacao dos conteudos

Status: concluido em 23/06/2026.

Entregas:

- Mover `content/docs/(nfe-nfce)/nfe-abi/` para `content/docs/nfe-abi/`.
- Mover `content/docs/(nfe-nfce)/nfag/` para `content/docs/nfag/`.
- Mover `content/docs/(nfe-nfce)/nfgas/` para `content/docs/nfgas/`.
- Preservar historico quando possivel usando `git mv`.
- Conferir se cada `meta.json` continua valido depois da mudanca.

Critério de pronto: nenhum documento especializado permanece como subsecao de `NF-e e NFC-e`.

## Estagio 3 - Links internos e aliases

Status: concluido em 23/06/2026.

Entregas:

- Procurar referencias antigas para `/docs/nfe-abi`, `/docs/nfag`, `/docs/nfgas` e caminhos relativos antigos.
- Atualizar links para apontar para os novos topicos raiz.
- Criar uma estrategia para links antigos, se o roteador nao redirecionar automaticamente:
  - pagina curta de transicao no caminho antigo; ou
  - redirecionamento no roteamento; ou
  - aceite explicito de quebra de URL se o site ainda nao foi publicado.

Critério de pronto: busca por `nfe-abi`, `nfag` e `nfgas` nao revela links quebrados ou referencias com
contexto errado.

## Estagio 4 - Separacao dos schemas e fontes

Status: concluido em 23/06/2026.

Entregas:

- Em `nfe-abi/`, explicitar o pacote/schema proprio e o que ainda depende do ecossistema NF-e.
- Em `nfag/`, separar leiaute, regras de validacao e DANFAG como fonte propria.
- Em `nfgas/`, separar leiaute, regras de validacao e DANFGas como fonte propria.
- Manter links cruzados para NF-e/NFC-e somente quando houver dependencia real: assinatura, transporte,
  padroes XML, autorizadores ou tabelas reaproveitadas.

Critério de pronto: cada topico responde "qual schema/manual governa este documento?" sem depender da
leitura da secao NF-e/NFC-e.

## Estagio 5 - Build e revisao de consistencia

Status: concluido em 23/06/2026.

Entregas:

- Rodar `bun run build`.
- Rodar uma busca por links orfaos e rotas antigas.
- Revisar a ordem da raiz para manter a navegacao previsivel.
- Atualizar este plano com evidencias objetivas de conclusao.

Critério de pronto: build passa e a documentacao fica organizada por contexto tecnico, nao por proximidade
historica com NF-e/NFC-e.

---

## Regras para executar

1. Nao misturar reforma tributaria nessa separacao; ela ja e trilha transversal propria.
2. Nao duplicar conteudo compartilhado. Quando ABI, NFAg ou NFGas dependerem de conceitos comuns, linkar para
   a pagina dona em NF-e/NFC-e ou em referencia.
3. Nao transformar NF-e ABI, NFAg e NFGas em subtopicos genericos de "schemas"; eles sao documentos fiscais
   com ciclo proprio.
4. Toda pagina especializada deve ter `## Fonte` apontando para o manual/anexo/schema especifico.
5. Depois da movimentacao, qualquer novo documento com schema proprio deve nascer como topico raiz, salvo
   decisao explicita em contrario.
