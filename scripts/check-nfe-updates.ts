import {
  localKey,
  readIndex,
  scanLocalFiles,
  listPortalItemsSnapshot,
  OUT_OF_SCOPE_STATUS,
  portalItemIdentity,
  compareDates,
  compareVersions,
  type IndexEntry,
  type PortalItem,
} from "./nfe-portal";

const failOnChange = process.argv.includes("--fail-on-change");
const indexEntries = await readIndex();
const portalSnapshot = await listPortalItemsSnapshot();
const portalItems = portalSnapshot.current;
const localFiles = await scanLocalFiles();

const indexedByUrl = new Map(indexEntries.filter((entry) => entry.url).map((entry) => [entry.url, entry]));
const indexedByDocKey = groupBy(indexEntries.filter((entry) => entry.docKey), (entry) => entry.docKey);
const portalByUrl = new Map(portalItems.map((item) => [item.url, item]));
const outOfScopeByUrl = new Map(portalSnapshot.outOfScope.map((item) => [item.url, item]));
const outOfScopeByIdentity = new Map(portalSnapshot.outOfScope.map((item) => [portalItemIdentity(item), item]));
const localByKey = new Set(localFiles.map((file) => localKey(file.category, file.filename)));
const indexedLocalKeys = new Set(indexEntries.filter((entry) => entry.filename).map((entry) => localKey(entry.category, entry.filename)));

const newItems: PortalItem[] = [];
const newVersions: Array<{ item: PortalItem; previous: IndexEntry }> = [];
const changedTitles: Array<{ item: PortalItem; previous: IndexEntry }> = [];
const removedFromPortal: IndexEntry[] = [];
const movedOutOfScope: Array<{ item: PortalItem; previous: IndexEntry }> = [];
const missingLocal: IndexEntry[] = [];
const localOnly = localFiles.filter((file) => !indexedLocalKeys.has(localKey(file.category, file.filename)));

for (const item of portalItems) {
  const previous = indexedByUrl.get(item.url);
  if (!previous) {
    const latestForKey = latestEntry(indexedByDocKey.get(item.docKey) ?? []);
    if (latestForKey) {
      newVersions.push({ item, previous: latestForKey });
    } else {
      newItems.push(item);
    }
    continue;
  }

  if (previous.title && previous.title !== item.title) {
    changedTitles.push({ item, previous });
  }
}

for (const entry of indexEntries) {
  if (entry.url && !portalByUrl.has(entry.url) && entry.status !== "LOCAL_ONLY") {
    const outOfScope = outOfScopeByUrl.get(entry.url) ?? outOfScopeByIdentity.get(portalItemIdentity(entry));
    if (outOfScope) {
      movedOutOfScope.push({ item: outOfScope, previous: entry });
    } else if (entry.status !== "ARCHIVED" && entry.status !== OUT_OF_SCOPE_STATUS) {
      removedFromPortal.push(entry);
    }
  }
  if (
    entry.filename &&
    entry.status !== "LOCAL_ONLY" &&
    entry.status !== "ARCHIVED" &&
    entry.status !== OUT_OF_SCOPE_STATUS &&
    !localByKey.has(localKey(entry.category, entry.filename))
  ) {
    missingLocal.push(entry);
  }
}

printSection("Novos itens no portal", newItems, formatPortalItem);
printSection("Novas versoes/publicacoes", newVersions, ({ item, previous }) => {
  const previousLabel = [previous.version && `v${previous.version}`, previous.published].filter(Boolean).join(" ");
  const nextLabel = [item.version && `v${item.version}`, item.published].filter(Boolean).join(" ");
  return `${item.category}\t${item.title}\tantes: ${previousLabel || previous.title}\tagora: ${nextLabel || item.title}`;
});
printSection("Titulos alterados para a mesma URL", changedTitles, ({ item, previous }) => {
  return `${item.category}\t${previous.title}\t=> ${item.title}`;
});
printSection("Movidos para fora da area de vigencia (desconsiderados)", movedOutOfScope, ({ item, previous }) => {
  return `${item.category}\t${previous.filename || item.title}\t${item.url}`;
});
printSection("No indice, mas fora da lista vigente do portal", removedFromPortal, formatIndexEntry);
printSection("No indice, mas sem arquivo local", missingLocal, formatIndexEntry);
printSection("Arquivo local fora do indice", localOnly, (file) => `${file.category}\t${file.filename}`);

const totalChanges =
  newItems.length + newVersions.length + changedTitles.length + removedFromPortal.length + missingLocal.length + localOnly.length;

console.log("");
console.log(`Resumo: ${totalChanges} diferencas encontradas.`);
console.log(`Fora de vigencia desconsiderados: ${movedOutOfScope.length}.`);
console.log(`Portal: ${portalItems.length} itens vigentes.`);
console.log(`Portal: ${portalSnapshot.outOfScope.length} itens fora de vigencia.`);
console.log(`Indice: ${indexEntries.length} entradas.`);
console.log(`Arquivos locais: ${localFiles.length}.`);

if (failOnChange && totalChanges > 0) {
  process.exitCode = 1;
}

function printSection<T>(title: string, rows: T[], format: (row: T) => string): void {
  console.log("");
  console.log(`## ${title} (${rows.length})`);
  if (rows.length === 0) {
    console.log("nenhum");
    return;
  }
  for (const row of rows) {
    console.log(`- ${format(row)}`);
  }
}

function formatPortalItem(item: PortalItem): string {
  return `${item.category}\t${item.title}\t${item.url}`;
}

function formatIndexEntry(entry: IndexEntry): string {
  return `${entry.category}\t${entry.filename || entry.title}\t${entry.url}`;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const value = key(item);
    const group = map.get(value) ?? [];
    group.push(item);
    map.set(value, group);
  }
  return map;
}

function latestEntry(entries: IndexEntry[]): IndexEntry | undefined {
  return [...entries].sort((a, b) => {
    const version = compareVersions(b.version, a.version);
    if (version !== 0) return version;
    return compareDates(b.published, a.published);
  })[0];
}
