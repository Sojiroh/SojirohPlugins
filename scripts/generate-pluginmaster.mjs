#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const requiredKeys = [
  'Author',
  'Name',
  'Description',
  'InternalName',
  'AssemblyVersion',
  'RepoUrl',
  'ApplicableVersion',
  'DalamudApiLevel',
  'Punchline',
  'DownloadLinkInstall',
  'DownloadLinkUpdate',
  'LastUpdate',
];

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  const value = process.argv[i + 1];
  if (!key?.startsWith('--') || value === undefined) {
    throw new Error(`Invalid argument near '${key ?? ''}'. Expected --key value.`);
  }
  args.set(key.slice(2), value);
}

const entriesDir = path.resolve(args.get('entries') ?? 'entries');
const outputPath = path.resolve(args.get('output') ?? 'pluginmaster.json');

function normalizeEntry(entry) {
  return {
    ...entry,
    DalamudApiLevel: Number(entry.DalamudApiLevel),
    LastUpdate: Number(entry.LastUpdate),
  };
}

function validateEntry(entry, seenInternalNames) {
  for (const key of requiredKeys) {
    if (entry[key] === undefined || entry[key] === null || entry[key] === '') {
      throw new Error(`${entry.InternalName ?? entry.Name ?? 'Unknown entry'} is missing required key '${key}'.`);
    }
  }

  if (seenInternalNames.has(entry.InternalName)) {
    throw new Error(`Duplicate InternalName '${entry.InternalName}'.`);
  }
  seenInternalNames.add(entry.InternalName);

  if (!Number.isInteger(entry.LastUpdate) || entry.LastUpdate < 0) {
    throw new Error(`${entry.InternalName} has invalid LastUpdate '${entry.LastUpdate}'. Expected a Unix timestamp number.`);
  }

  if (!Number.isInteger(entry.DalamudApiLevel) || entry.DalamudApiLevel <= 0) {
    throw new Error(`${entry.InternalName} has invalid DalamudApiLevel '${entry.DalamudApiLevel}'. Expected a positive integer.`);
  }

  if (!/^\d+\.\d+\.\d+(\.\d+)?$/.test(entry.AssemblyVersion)) {
    throw new Error(`${entry.InternalName} has invalid AssemblyVersion '${entry.AssemblyVersion}'.`);
  }

  for (const linkKey of ['RepoUrl', 'DownloadLinkInstall', 'DownloadLinkUpdate']) {
    try {
      const url = new URL(entry[linkKey]);
      if (url.protocol !== 'https:') {
        throw new Error('URL must use https:');
      }
    } catch {
      throw new Error(`${entry.InternalName} has invalid HTTPS URL in '${linkKey}'.`);
    }
  }
}

const files = (await readdir(entriesDir))
  .filter(file => file.endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, 'en'));

if (files.length === 0) {
  throw new Error(`No plugin entries found in ${entriesDir}.`);
}

const entries = [];
for (const file of files) {
  const fullPath = path.join(entriesDir, file);
  const entry = normalizeEntry(JSON.parse(await readFile(fullPath, 'utf8')));
  entries.push(entry);
}

entries.sort((a, b) => a.Name.localeCompare(b.Name, 'en'));

const seenInternalNames = new Set();
for (const entry of entries) {
  validateEntry(entry, seenInternalNames);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');

console.log(`Generated ${outputPath} with ${entries.length} plugin entr${entries.length === 1 ? 'y' : 'ies'}.`);
