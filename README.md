# Open Fiscal

Open Fiscal e uma base operacional de documentacao e dados para documentos fiscais eletronicos brasileiros. O objetivo e transformar fontes oficiais dispersas - manuais, notas tecnicas, informes, schemas XML, tabelas auxiliares e endpoints - em conteudo navegavel, indices auditaveis e dados versionados.

O foco atual esta no ecossistema NF-e/NFC-e, incluindo os impactos da Reforma Tributaria e modelos relacionados publicados junto ao conjunto tecnico nacional.

## Escopo fiscal

O projeto cobre:

- NF-e modelo 55 e NFC-e modelo 65.
- MOC 7.0, anexos, eventos, contingencia, DANFE, assinatura, web services e rejeicoes.
- Notas Tecnicas e Informes Tecnicos vigentes e historicos relevantes.
- Schemas XML oficiais e pacotes de liberacao.
- Tabelas auxiliares usadas em validacao fiscal, como NCM, CFOP, meios de pagamento, combustiveis, classificacoes IBS/CBS e codigos relacionados.
- Autorizadores, ambientes, endpoints de web services e regras por UF.
- NFAg, NFGas e NF-e ABI quando aparecem no mesmo conjunto documental.

O site nao substitui a fonte oficial. Ele organiza a fonte oficial, registra proveniencia e deixa claro quais arquivos locais ou dados versionados embasam cada pagina.

## Fontes e saidas

```text
tmp/nfe-oficial/              Cache local dos documentos do Portal Nacional da NF-e
tmp/nfe-oficial/manuais/      PDFs de MOC, anexos e manuais
tmp/nfe-oficial/notas-tecnicas/
tmp/nfe-oficial/informes-tecnicos/
tmp/nfe-oficial/esquemas-xml/ ZIPs e XSDs dos pacotes de schema
tmp/nfe-oficial/diversos/     Tabelas auxiliares e arquivos complementares
data/nfe/index.tsv            Manifesto versionado dos documentos NF-e baixados
data/tabelas/*.tsv            Tabelas estruturadas extraidas dos snapshots oficiais
data/tabelas/checksums.tsv    Hashes para detectar alteracao de snapshots
data/endpoints/*.tsv          Autorizadores e web services
```

`tmp/` e cache local e nao entra no Git. `data/` e a saida versionada que pode ser revisada em diff.

## Operacoes de download

O fluxo principal para NF-e/NFC-e e:

```bash
bun run nfe:download
bun run nfe:check
bun run nfe:unzip-xsd nfe-oficial
bun run tabelas:build
bun run tabelas:check
```

- `bun run nfe:download` consulta o Portal Nacional da NF-e, baixa documentos vigentes para `tmp/nfe-oficial/` e atualiza `data/nfe/index.tsv`.
- `bun run nfe:check` compara o portal com o indice local e mostra novos documentos, novas versoes, mudancas de titulo, arquivos locais ausentes e itens arquivados.
- `bun run nfe:unzip-xsd nfe-oficial` descompacta recursivamente os pacotes `.zip` em `tmp/nfe-oficial/esquemas-xml`, sem sobrescrever arquivos existentes.
- `bun run tabelas:build` extrai snapshots de tabelas oficiais para TSVs em `data/tabelas/`.
- `bun run tabelas:check` valida campos obrigatorios, consistencia dos TSVs e checksums dos snapshots.

Tambem ha coletores auxiliares:

```bash
bun scripts/download-svrs.mjs
bun scripts/download-nfse.mjs
bun scripts/download-sped.mjs
```

O downloader SVRS cobre familias publicadas em `https://dfe-portal.svrs.rs.gov.br`, mas a rota `Nfe` foi removida do padrao para evitar duplicar a coleta oficial mantida em `tmp/nfe-oficial/`.

## Rotina recomendada

Para atualizar a base fiscal:

```bash
bun run nfe:download
bun run nfe:check
bun run nfe:unzip-xsd nfe-oficial
bun run tabelas:build
bun run tabelas:check
git diff -- data README.md content scripts
```

Depois disso, revise:

- Entradas novas ou alteradas em `data/nfe/index.tsv`.
- Mudancas em `data/tabelas/*.tsv` e `data/tabelas/checksums.tsv`.
- Pacotes de schema extraidos em `tmp/nfe-oficial/esquemas-xml/`, quando alguma pagina depender de XSD.
- Paginas em `content/docs/` que precisam refletir uma NT, IT, tabela ou schema novo.

## Conteudo publicado

O conteudo fica em `content/docs/` e e organizado por `meta.json`.

```text
content/docs/index.mdx                 Entrada da documentacao
content/docs/(nfe-nfce)/               NF-e, NFC-e e modelos relacionados
content/docs/reforma-tributaria/       IBS, CBS e Imposto Seletivo
content/docs/(nfe-nfce)/referencia/    Fontes, tabelas, glossario e proveniencia
content/docs/(nfe-nfce)/schemas/       Pacotes e leitura dos XSDs
content/docs/(nfe-nfce)/ufs/           Regras e operacao estadual
```

Ao criar ou renomear uma pagina MDX, atualize o `meta.json` da pasta para manter a navegacao correta.

## Dados versionados

Os arquivos em `data/` sao parte do contrato do projeto:

- `data/nfe/index.tsv` registra categoria, arquivo, status, URL, titulo, publicacao, versao, chave documental, tamanho e data de atualizacao.
- `data/tabelas/manifest.tsv` descreve as tabelas auxiliares conhecidas.
- `data/tabelas/checksums.tsv` detecta mudancas em snapshots oficiais.
- `data/endpoints/autorizadores.tsv` e `data/endpoints/webservices.tsv` consolidam autorizadores e URLs por ambiente.

Esses arquivos devem mudar somente quando houver nova coleta, nova extracao ou correcao de proveniencia.

## Desenvolvimento local

```bash
bun install
bun run dev
```

O site local usa a porta `3000`.

Comandos uteis:

```bash
bun run build
bun run test
bun run preview
bun run generate-routes
```

## Estrutura tecnica

```text
src/routes/          Rotas TanStack Start, incluindo docs e busca
src/lib/source.ts    Loader Fumadocs para content/docs
src/components/      Componentes MDX, incluindo Mermaid
scripts/             Operacoes fiscais e utilitarios de extracao
source.config.ts     Configuracao Fumadocs MDX
```

Stack principal: React, TanStack Start/Router, Fumadocs, MDX, Tailwind CSS, Vite, Vitest e Bun.

## Cuidados

- Alguns scripts dependem da disponibilidade dos portais oficiais.
- O portal pode manter documentos fora de vigencia; os scripts tentam separar vigentes, arquivados e fora de escopo.
- Nao versionar `tmp/`; use `data/` e `content/docs/` como superficie de revisao.
- Antes de atualizar uma pagina tecnica, confira a fonte em `tmp/nfe-oficial/` e a proveniencia em `data/nfe/index.tsv`.
