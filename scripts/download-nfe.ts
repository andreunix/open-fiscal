import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  CATEGORIES,
  LEGACY_INDEX,
  OUT_DIR,
  VERSIONED_INDEX,
  fetchFile,
  filenameFromResponse,
  listPortalCategorySnapshot,
  localKey,
  OUT_OF_SCOPE_STATUS,
  portalItemIdentity,
  readIndex,
  reconcileWithLocalFiles,
  relativePath,
  scanLocalFiles,
  type IndexEntry,
  type PortalItem,
  writeDownloadedFile,
  writeIndex,
} from "./nfe-portal";

const now = new Date().toISOString();
const rebuildFromLegacy = process.argv.includes("--from-legacy");
const existingEntries = await readIndex(rebuildFromLegacy ? LEGACY_INDEX : undefined);
const localFiles = await scanLocalFiles();
const localByKey = new Map(localFiles.map((file) => [localKey(file.category, file.filename), file]));
const entriesByUrl = new Map<string, IndexEntry>();
const updatedEntries = new Map<string, IndexEntry>();
const processedUrls = new Set<string>();
const outOfScopeByUrl = new Map<string, PortalItem>();
const outOfScopeByIdentity = new Map<string, PortalItem>();

for (const entry of existingEntries) {
  if (!entry.url) continue;
  const current = entriesByUrl.get(entry.url);
  const entryHasLocal = Boolean(localByKey.get(localKey(entry.category, entry.filename)));
  const currentHasLocal = current ? Boolean(localByKey.get(localKey(current.category, current.filename))) : false;
  if (!current || (entryHasLocal && !currentHasLocal)) {
    entriesByUrl.set(entry.url, entry);
  }
}

for (const entry of existingEntries) {
  updatedEntries.set(entry.url || localKey(entry.category, entry.filename), entry);
}

let downloaded = 0;
let skipped = 0;
let failed = 0;
let newVersions = 0;
let outOfScope = 0;

for (const category of CATEGORIES) {
  console.error(`\n[${category.slug}]`);
  const snapshot = await listPortalCategorySnapshot(category);
  const items = snapshot.current;
  for (const item of snapshot.outOfScope) {
    outOfScopeByUrl.set(item.url, item);
    outOfScopeByIdentity.set(portalItemIdentity(item), item);
  }

  for (const item of items) {
    if (processedUrls.has(item.url)) {
      skipped += 1;
      console.error(`  SKIP  duplicado em ${item.category}: ${item.title}`);
      continue;
    }
    processedUrls.add(item.url);

    const existing = entriesByUrl.get(item.url);
    if (existing && existing.filename) {
      const local = localByKey.get(localKey(existing.category, existing.filename));
      if (local && existsSync(local.path)) {
        skipped += 1;
        updatedEntries.set(item.url, {
          ...existing,
          ...item,
          status: "OK",
          size: String(local.size),
          updatedAt: existing.updatedAt || now,
        });
        console.error(`  SKIP  ${existing.filename}`);
        continue;
      }
    }

    try {
      const { response, bytes } = await fetchFile(item.url);
      const filename = existing?.filename || filenameFromResponse(response, item);
      if (!filename) throw new Error("nome vazio");

      const target = join(OUT_DIR, item.category, filename);
      await writeDownloadedFile(target, bytes);

      if (existing && existing.docKey === item.docKey && existing.version !== item.version) {
        newVersions += 1;
      }

      downloaded += 1;
      updatedEntries.set(item.url, {
        ...item,
        filename,
        status: "OK",
        size: String(bytes.byteLength),
        updatedAt: now,
      });
      console.error(`  OK    ${filename}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      const filename = existing?.filename || "";
      updatedEntries.set(item.url, {
        ...item,
        filename,
        status: "FAIL",
        size: existing?.size ?? "",
        updatedAt: now,
      });
      console.error(`  FAIL  ${item.title} (${message})`);
    }
  }
}

for (const [key, entry] of updatedEntries) {
  if (!entry.url || processedUrls.has(entry.url) || entry.status === "FAIL") continue;
  const outOfScopeItem = outOfScopeByUrl.get(entry.url) ?? outOfScopeByIdentity.get(portalItemIdentity(entry));
  if (outOfScopeItem) outOfScope += 1;
  updatedEntries.set(key, {
    ...entry,
    ...(outOfScopeItem ?? {}),
    status: outOfScopeItem ? OUT_OF_SCOPE_STATUS : "ARCHIVED",
    updatedAt: entry.updatedAt || now,
  });
}

const reconciled = await reconcileWithLocalFiles([...updatedEntries.values()]);
await writeIndex(reconciled);

console.error(`\nIndice versionado: ${relativePath(VERSIONED_INDEX)}`);
console.error(`Baixados: ${downloaded}`);
console.error(`Pulados: ${skipped}`);
console.error(`Novas versoes detectadas durante download: ${newVersions}`);
console.error(`Fora de vigencia desconsiderados: ${outOfScope}`);
console.error(`Falhas: ${failed}`);

if (failed > 0) {
  process.exitCode = 1;
}
