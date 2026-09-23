#!/usr/bin/env -S npx vite-node

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const environments = ['dev', 'prod'] as const;

type Environment = (typeof environments)[number];

const isEnvironment = (value: string): value is Environment =>
  environments.includes(value as Environment);

const env = (process.argv[2] ?? '').trim();

if (!isEnvironment(env)) {
  console.error(
    `Usage: ./scripts/build-edge-extension.mts <${environments.join(
      '|'
    )}> [version]`
  );
  process.exit(1);
}

const artifactsUrl = `http://vocably-${env}-artifacts.s3-website.eu-central-1.amazonaws.com`;

let version = (process.argv[3] ?? 'latest').trim().replace(/\./g, '_');

if (version !== 'latest' && !version.startsWith(`${env}_`)) {
  version = `${env}_${version}`;
}

const sourceUrl = `${artifactsUrl}/${version}.zip`;

const outputName = version === 'latest' ? `${env}_latest` : version;
const outputDir = `${rootDir}/tmp/edge`;
const outputPath = `${outputDir}/${outputName}.zip`;

const workingDir = mkdtempSync(`${tmpdir()}/vocably-edge-`);
const downloadPath = `${workingDir}/${version}.zip`;
const unpackedDir = `${workingDir}/unpacked`;

try {
  console.log(`Downloading ${sourceUrl}...`);
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `Unable to download ${sourceUrl}: ${response.status} ${response.statusText}`
    );
  }

  writeFileSync(downloadPath, new Uint8Array(await response.arrayBuffer()));

  console.log('Unpacking...');
  execFileSync('unzip', ['-q', downloadPath, '-d', unpackedDir], {
    stdio: 'inherit',
  });

  const manifestPath = `${unpackedDir}/manifest.json`;

  if (!existsSync(manifestPath)) {
    throw new Error(`The ${version}.zip archive doesn't contain manifest.json`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  if ('key' in manifest) {
    console.log('Removing the "key" param from manifest.json...');
    delete manifest.key;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  } else {
    console.log('The manifest.json doesn\'t contain the "key" param.');
  }

  mkdirSync(outputDir, { recursive: true });
  rmSync(outputPath, { force: true });

  console.log('Packing...');
  execFileSync('zip', ['-9', '-y', '-r', '-q', outputPath, '.'], {
    cwd: unpackedDir,
    stdio: 'inherit',
  });

  console.log(outputPath);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  rmSync(workingDir, { recursive: true, force: true });
}
