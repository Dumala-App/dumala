import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const REACT_SURFACE_PATHS = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components',
  'src/hooks'
];

const FORBIDDEN_IMPORTS = [
  '@supabase/supabase-js',
  '../cloud/client',
  '../cloud/config',
  '../cloud/database.types',
  './cloud/client',
  './cloud/config',
  './cloud/database.types',
  '@/src/cloud/client',
  '@/src/cloud/config',
  '@/src/cloud/database.types'
];

const IMPORT_SOURCE_PATTERN = /\bimport(?:[\s\S]*?\bfrom\s*)?['"]([^'"]+)['"]/g;

const collectSourceFiles = async (path: string): Promise<string[]> => {
  if (extname(path)) return [path];

  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const nextPath = join(path, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(nextPath);
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [nextPath] : [];
  }));

  return nested.flat();
};

describe('cloud architecture boundaries', () => {
  it('keeps low-level Supabase bootstrap imports out of React surfaces', async () => {
    const files = (await Promise.all(REACT_SURFACE_PATHS.map(collectSourceFiles))).flat();
    const violations: string[] = [];

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      for (const match of source.matchAll(IMPORT_SOURCE_PATTERN)) {
        const importSource = match[1];
        if (FORBIDDEN_IMPORTS.includes(importSource)) {
          violations.push(`${relative(process.cwd(), file).split(sep).join('/')}: ${importSource}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

