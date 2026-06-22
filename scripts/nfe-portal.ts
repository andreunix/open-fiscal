import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type PortalCategory = {
  slug: string;
  contentId: string;
  stopMarker?: string;
};

export type PortalItem = {
  category: string;
  title: string;
  url: string;
  published: string;
  version: string;
  docKey: string;
};

export type PortalCategorySnapshot = {
  current: PortalItem[];
  outOfScope: PortalItem[];
};

export type PortalSnapshot = PortalCategorySnapshot;

export type IndexEntry = PortalItem & {
  filename: string;
  status: string;
  size: string;
  updatedAt: string;
};

export type LocalFile = {
  category: string;
  filename: string;
  path: string;
  size: number;
};

export const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const OUT_DIR = join(PROJECT_DIR, "tmp", "nfe-oficial");
export const VERSIONED_INDEX = join(PROJECT_DIR, "data", "nfe", "index.tsv");
export const LEGACY_INDEX = join(OUT_DIR, "index.tsv");
export const BASE_URL = "https://www.nfe.fazenda.gov.br/portal";
export const OUT_OF_SCOPE_STATUS = "OUT_OF_SCOPE";

export const CATEGORIES: PortalCategory[] = [
  { slug: "manuais", contentId: "ndIjl+iEFdE=" },
  { slug: "esquemas-xml", contentId: "BMPFMBoln3w=", stopMarker: "VERSOES PARA TESTES" },
  { slug: "notas-tecnicas", contentId: "04BIflQt1aY=", stopMarker: "Documentos nao vigentes" },
  { slug: "informes-tecnicos", contentId: "hXzemuyNHW4=", stopMarker: "Documentos nao vigentes" },
  { slug: "diversos", contentId: "/NJarYc9nus=", stopMarker: "Vigencia expirada" },
];

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
const COOKIE = "AspxAutoDetectCookieSupport=1";
const INDEX_COLUMNS = [
  "category",
  "filename",
  "status",
  "url",
  "title",
  "published",
  "version",
  "doc_key",
  "size",
  "updated_at",
] as const;

export function categoryOrder(category: string): number {
  const index = CATEGORIES.findIndex((item) => item.slug === category);
  return index === -1 ? CATEGORIES.length : index;
}

export async function fetchPortalText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: COOKIE,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const charset = contentType.match(/charset=([^;\s]+)/i)?.[1]?.trim();
  const bytes = await response.arrayBuffer();

  for (const encoding of [charset, "windows-1252", "utf-8"].filter(Boolean) as string[]) {
    try {
      return new TextDecoder(encoding).decode(bytes);
    } catch {
      continue;
    }
  }

  return new TextDecoder().decode(bytes);
}

export async function fetchFile(url: string): Promise<{ response: Response; bytes: ArrayBuffer }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: COOKIE,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html")) {
    throw new Error("resposta HTML");
  }

  return { response, bytes: await response.arrayBuffer() };
}

export async function listPortalCategory(category: PortalCategory): Promise<PortalItem[]> {
  const url = `${BASE_URL}/listaConteudo.aspx?tipoConteudo=${encodeURIComponent(category.contentId)}`;
  const html = await fetchPortalText(url);
  return parsePortalCategoryHtml(category, html).current;
}

export async function listPortalCategorySnapshot(category: PortalCategory): Promise<PortalCategorySnapshot> {
  const url = `${BASE_URL}/listaConteudo.aspx?tipoConteudo=${encodeURIComponent(category.contentId)}`;
  const html = await fetchPortalText(url);
  return parsePortalCategoryHtml(category, html);
}

export function parsePortalCategoryHtml(category: PortalCategory, html: string): PortalCategorySnapshot {
  const markerIndex = category.stopMarker ? findNormalizedTextIndex(html, category.stopMarker) : -1;
  const itemsByUrl = new Map<string, { item: PortalItem; outOfScope: boolean }>();
  const linkPattern = /<a\b[^>]*href="([^"]*exibirArquivo\.aspx\?conteudo=[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = decodeHtml(match[1]).trim().replace(/\s+/g, "%20").replace(/&amp;/g, "&");
    const body = match[2];
    const span = body.match(/<span\b[^>]*class="tituloConteudo"[^>]*>([\s\S]*?)<\/span>/i);
    const title = cleanTitle(span?.[1] ?? body);
    if (!title) continue;

    const absoluteUrl = new URL(href.replace(/^\.\//, ""), `${BASE_URL}/`).toString();
    const metadata = metadataFromTitle(title);
    const item = {
      category: category.slug,
      title,
      url: absoluteUrl,
      published: metadata.published,
      version: metadata.version,
      docKey: metadata.docKey,
    };
    const outOfScope = markerIndex >= 0 && (match.index ?? 0) > markerIndex;
    const previous = itemsByUrl.get(absoluteUrl);
    if (!previous || (previous.outOfScope && !outOfScope)) {
      itemsByUrl.set(absoluteUrl, { item, outOfScope });
    }
  }

  const current: PortalItem[] = [];
  const outOfScope: PortalItem[] = [];
  for (const entry of itemsByUrl.values()) {
    (entry.outOfScope ? outOfScope : current).push(entry.item);
  }

  return {
    current: current.sort((a, b) => a.url.localeCompare(b.url)),
    outOfScope: outOfScope.sort((a, b) => a.url.localeCompare(b.url)),
  };
}

export async function listPortalItems(): Promise<PortalItem[]> {
  return (await listPortalItemsSnapshot()).current;
}

export async function listPortalItemsSnapshot(): Promise<PortalSnapshot> {
  const currentByUrl = new Map<string, PortalItem>();
  const outOfScopeByUrl = new Map<string, PortalItem>();

  for (const category of CATEGORIES) {
    const snapshot = await listPortalCategorySnapshot(category);
    for (const item of snapshot.current) {
      currentByUrl.set(item.url, item);
      outOfScopeByUrl.delete(item.url);
    }
    for (const item of snapshot.outOfScope) {
      if (!currentByUrl.has(item.url)) {
        outOfScopeByUrl.set(item.url, item);
      }
    }
  }

  return {
    current: [...currentByUrl.values()],
    outOfScope: [...outOfScopeByUrl.values()],
  };
}

export function cleanTitle(value: string): string {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\r|\n|&#xD;|&#xA;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeFilename(value: string): string {
  return cleanTitle(value)
    .replace(/\//g, "-")
    .replace(/:/g, " -")
    .replace(/\s+/g, " ")
    .trim();
}

export function metadataFromTitle(title: string): { published: string; version: string; docKey: string } {
  const clean = title.replace(/\.[a-z0-9]{1,8}$/i, "");
  const published = clean.match(/Publicada em\s*(\d{2}[/-]\d{2}[/-]\d{4})/i)?.[1]?.replace(/\//g, "-") ?? "";
  const version = clean.match(/\bv\.?\s*([0-9]+(?:\.[0-9]+)*(?:[a-z])?)/i)?.[1] ?? "";
  return { published, version, docKey: docKeyFromTitle(clean) };
}

export function docKeyFromTitle(title: string): string {
  const normalized = normalizeText(title);
  const note = normalized.match(/nota tecnica\s+((?:conjunta)\s+)?((?:nfc[- ]?e)\s+)?(\d{4}\.\d{3})/i);
  if (note) {
    const parts = ["nota-tecnica"];
    if (note[1]) parts.push("conjunta");
    if (note[2]) parts.push("nfce");
    parts.push(note[3]);
    return parts.join(":");
  }

  return normalized
    .replace(/\.[a-z0-9]{1,8}$/i, "")
    .replace(/\bpublicada em\s*\d{2}[/-]\d{2}[/-]\d{4}\b/gi, "")
    .replace(/\bv\.?\s*[0-9]+(?:\.[0-9]+)*(?:[a-z])?\b/gi, "")
    .replace(/\bcorrigido\b/gi, "")
    .replace(/\b\d{2}[/-]\d{2}[/-]\d{4}\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\u00a0/g, " ")
    .replace(/\uFFFD/g, "")
    .toLowerCase();
}

export function findNormalizedTextIndex(value: string, search: string): number {
  let normalized = "";
  const sourceIndexes: number[] = [];

  for (let index = 0; index < value.length; ) {
    const codePoint = value.codePointAt(index);
    if (codePoint === undefined) break;
    const character = String.fromCodePoint(codePoint);
    const normalizedCharacter = normalizeText(character);
    normalized += normalizedCharacter;
    for (let offset = 0; offset < normalizedCharacter.length; offset += 1) {
      sourceIndexes.push(index);
    }
    index += character.length;
  }

  const normalizedIndex = normalized.indexOf(normalizeText(search));
  return normalizedIndex < 0 ? -1 : sourceIndexes[normalizedIndex] ?? -1;
}

export function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number.parseInt(num, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

export function filenameFromResponse(response: Response, item: PortalItem): string {
  const disposition = response.headers.get("content-disposition") ?? "";
  const contentType = response.headers.get("content-type") ?? "";
  const headerFilename = filenameFromContentDisposition(disposition);
  const extension = filenameExtension(headerFilename) || extensionFromContentType(contentType) || filenameExtension(item.url);

  if (item.category === "notas-tecnicas") {
    return sanitizeFilename(`${item.title}${extension}`);
  }

  if (headerFilename) {
    return sanitizeFilename(headerFilename);
  }

  return sanitizeFilename(`${item.title}${extension}`);
}

export function filenameFromContentDisposition(disposition: string): string {
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      return utf8;
    }
  }

  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "";
}

export function filenameExtension(value: string): string {
  const pathname = value.split("?")[0]?.split("/").pop() ?? "";
  const extension = pathname.match(/(\.[a-z0-9]{1,8})$/i)?.[1] ?? "";
  return extension;
}

export function extensionFromContentType(contentType: string): string {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase();
  switch (normalized) {
    case "application/pdf":
      return ".pdf";
    case "application/zip":
      return ".zip";
    case "application/xml":
    case "text/xml":
      return ".xml";
    case "application/vnd.ms-excel":
      return ".xls";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return ".xlsx";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    default:
      return "";
  }
}

export async function readIndex(path = existsSync(VERSIONED_INDEX) ? VERSIONED_INDEX : LEGACY_INDEX): Promise<IndexEntry[]> {
  if (!existsSync(path)) return [];

  const content = await readFile(path, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].split("\t");
  const rows = lines.slice(1);
  const indexOf = (name: string) => header.indexOf(name);
  const entries: IndexEntry[] = [];

  for (const line of rows) {
    const cells = line.split("\t");
    const read = (name: string, fallback = "") => {
      const index = indexOf(name);
      return index >= 0 ? cells[index] ?? fallback : fallback;
    };

    const category = read("category");
    const filename = read("filename");
    const status = read("status");
    const url = normalizeManifestUrl(read("url"));
    if (!category && !filename && !url) continue;

    const title = read("title", filename.replace(/\.[a-z0-9]{1,8}$/i, ""));
    const metadata = metadataFromTitle(title || filename);
    entries.push({
      category,
      filename,
      status,
      url,
      title,
      published: read("published", metadata.published),
      version: read("version", metadata.version),
      docKey: read("doc_key", metadata.docKey),
      size: read("size"),
      updatedAt: read("updated_at"),
    });
  }

  return entries;
}

export function normalizeManifestUrl(url: string): string {
  return url
    .replace("/portal/%20exibirArquivo.aspx", "/portal/exibirArquivo.aspx")
    .replace(/(conteudo=[^\t]+?=)(?:manuais|esquemas-xml|notas-tecnicas|informes-tecnicos|diversos)$/i, "$1");
}

export async function writeIndex(entries: IndexEntry[]): Promise<void> {
  await mkdir(dirname(VERSIONED_INDEX), { recursive: true });
  const sorted = [...entries].sort(compareEntries);
  const lines = [
    INDEX_COLUMNS.join("\t"),
    ...sorted.map((entry) =>
      [
        entry.category,
        entry.filename,
        entry.status,
        entry.url,
        entry.title,
        entry.published,
        entry.version,
        entry.docKey,
        entry.size,
        entry.updatedAt,
      ]
        .map(tsvCell)
        .join("\t"),
    ),
  ];
  await writeFile(VERSIONED_INDEX, `${lines.join("\n")}\n`);
}

export async function scanLocalFiles(): Promise<LocalFile[]> {
  const files: LocalFile[] = [];
  for (const category of CATEGORIES) {
    const categoryDir = join(OUT_DIR, category.slug);
    if (!existsSync(categoryDir)) continue;

    for (const filename of await readdir(categoryDir)) {
      if (filename.startsWith(".")) continue;
      const path = join(categoryDir, filename);
      const details = await stat(path);
      if (!details.isFile()) continue;
      files.push({ category: category.slug, filename, path, size: details.size });
    }
  }
  return files;
}

export async function reconcileWithLocalFiles(entries: IndexEntry[]): Promise<IndexEntry[]> {
  const files = await scanLocalFiles();
  const localByKey = new Map(files.map((file) => [localKey(file.category, file.filename), file]));
  const indexedKeys = new Set<string>();
  const now = new Date().toISOString();
  const output: IndexEntry[] = [];

  for (const entry of entries) {
    const file = localByKey.get(localKey(entry.category, entry.filename));
    indexedKeys.add(localKey(entry.category, entry.filename));
    output.push({
      ...entry,
      status: reconcileStatus(entry.status, Boolean(file)),
      size: file ? String(file.size) : entry.size,
    });
  }

  for (const file of files) {
    if (indexedKeys.has(localKey(file.category, file.filename))) continue;
    const title = file.filename.replace(/\.[a-z0-9]{1,8}$/i, "");
    const metadata = metadataFromTitle(title);
    output.push({
      category: file.category,
      filename: file.filename,
      status: "LOCAL_ONLY",
      url: "",
      title,
      published: metadata.published,
      version: metadata.version,
      docKey: metadata.docKey,
      size: String(file.size),
      updatedAt: now,
    });
  }

  return output;
}

export function reconcileStatus(status: string, hasLocalFile: boolean): string {
  if (hasLocalFile || status === "FAIL" || status === "ARCHIVED" || status === OUT_OF_SCOPE_STATUS) {
    return status;
  }
  return "MISSING";
}

export function localKey(category: string, filename: string): string {
  return `${category}\0${filename}`;
}

export function portalItemIdentity(item: PortalItem): string {
  return [item.category, item.docKey, item.version, item.published].join("\0");
}

export function compareEntries(a: IndexEntry, b: IndexEntry): number {
  return (
    categoryOrder(a.category) - categoryOrder(b.category) ||
    a.docKey.localeCompare(b.docKey) ||
    compareDates(a.published, b.published) ||
    compareVersions(a.version, b.version) ||
    a.filename.localeCompare(b.filename) ||
    a.url.localeCompare(b.url)
  );
}

export function compareDates(a: string, b: string): number {
  return dateValue(a) - dateValue(b);
}

export function dateValue(value: string): number {
  const match = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) return 0;
  return Number(`${match[3]}${match[2]}${match[1]}`);
}

export function compareVersions(a: string, b: string): number {
  const left = tokenizeVersion(a);
  const right = tokenizeVersion(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const currentLeft = left[index] ?? 0;
    const currentRight = right[index] ?? 0;
    if (currentLeft === currentRight) continue;
    if (typeof currentLeft === "number" && typeof currentRight === "number") {
      return currentLeft - currentRight;
    }
    return String(currentLeft).localeCompare(String(currentRight));
  }
  return 0;
}

export function tokenizeVersion(value: string): Array<number | string> {
  return (value.match(/\d+|[a-z]+/gi) ?? []).map((part) => {
    const number = Number(part);
    return Number.isNaN(number) ? part.toLowerCase() : number;
  });
}

export function relativePath(path: string): string {
  return relative(PROJECT_DIR, path);
}

export async function writeDownloadedFile(path: string, bytes: ArrayBuffer): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.part`;
  await unlink(tempPath).catch(() => undefined);
  await writeFile(tempPath, Buffer.from(bytes));
  await rename(tempPath, path);
}

function tsvCell(value: string): string {
  return value.replace(/\t|\r|\n/g, " ").trim();
}
