import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "..");
const defaultRoot = join(projectDir, "tmp", "nfe-oficial", "esquemas-xml");
const input = process.argv[2];
const root = resolveInput(input);
const maxPasses = Number(process.argv[3] ?? 10);

if (!existsSync(root)) {
  throw new Error(`diretorio nao encontrado: ${root}`);
}

let totalZipFiles = 0;

for (let pass = 1; pass <= maxPasses; pass += 1) {
  const zipFiles = await collectZipFiles(root);
  totalZipFiles = zipFiles.length;

  for (const zipFile of zipFiles) {
    const destDir = zipFile.slice(0, -4);
    await run("unzip", ["-n", "-q", zipFile, "-d", destDir]);
  }

  const nextZipCount = (await collectZipFiles(root)).length;
  if (nextZipCount === totalZipFiles) {
    console.log(`Passo ${pass}: nenhum novo .zip criado`);
    break;
  }
}

console.log(`Processados ${totalZipFiles} arquivos .zip em ${root}`);

async function collectZipFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  await walk(dir, result);
  return result.sort();
}

function resolveInput(value?: string): string {
  if (!value) return defaultRoot;

  const asGiven = resolve(value);
  if (existsSync(asGiven)) return asGiven;

  const inArchiveSchemas = join(projectDir, "tmp", value, "esquemas-xml");
  if (existsSync(inArchiveSchemas)) return inArchiveSchemas;

  return asGiven;
}

async function walk(dir: string, result: string[]): Promise<void> {
  for (const entry of await readdir(dir)) {
    const fullPath = join(dir, entry);
    const details = await stat(fullPath);
    if (details.isDirectory()) {
      await walk(fullPath, result);
      continue;
    }
    if (details.isFile() && entry.toLowerCase().endsWith(".zip")) {
      result.push(fullPath);
    }
  }
}
