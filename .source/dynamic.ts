// @ts-nocheck
/// <reference types="vite/client" />
import { dynamic } from 'fumadocs-mdx/runtime/dynamic';
import * as Config from '../source.config';

const create = await dynamic<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>(Config, {"configPath":"/Users/k1r4/hub/open-fiscal/source.config.ts","environment":"vite","outDir":"/Users/k1r4/hub/open-fiscal/.source"}, {"doc":{"passthroughs":["extractedReferences"]}});