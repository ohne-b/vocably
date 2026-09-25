#!/usr/bin/env -S npx vite-node

/**
 * Improves grammar and style of a localized HTML or JSON file while keeping
 * its format intact.
 *
 * Usage:
 *   ./grammar-and-style.mts <path/to/file.(html|json)> [GoogleLanguage]
 *
 * When the language is omitted, it is inferred from the file name
 * (e.g. uk.json, pt-PT.html, pt_BR.json -> pt).
 */

import {
  GoogleLanguage,
  GoogleLanguages,
  isGoogleLanguage,
  languageList,
} from '@vocably/model';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { timeout } from '@vocably/sulna';

const scriptDir = dirname(fileURLToPath(import.meta.url));
// loadEnvFile is available in Node 20.12+, but the installed @types/node lags behind.
(process as unknown as { loadEnvFile(path: string): void }).loadEnvFile(
  join(scriptDir, '.env.local')
);

const BASE_URL = 'https://hemmingway.io/v1';
const MODEL = 'hemmingway-27b';
const JSON_CHUNK_SIZE = 80;
const REQUEST_TIMEOUT_MS = 90_000;

const [filePathArg, languageArg] = process.argv.slice(2);

if (!filePathArg) {
  console.error(
    'Usage: grammar-and-style.mts <path/to/file.(html|json)> [GoogleLanguage]'
  );
  process.exit(1);
}

const inferLanguage = (filePath: string): GoogleLanguage | undefined => {
  const name = basename(filePath, extname(filePath));
  const candidates = [name, name.split(/[.]/)[0]];

  for (const candidate of candidates) {
    const match = GoogleLanguages.find(
      (language) => language.toLowerCase() === candidate.toLowerCase()
    );
    if (match) {
      return match;
    }
  }
};

const language = languageArg ?? inferLanguage(filePathArg);

if (!language) {
  console.error(
    `Unable to infer the language from "${basename(
      filePathArg
    )}". Pass it as the second parameter.`
  );
  process.exit(1);
}

if (!isGoogleLanguage(language)) {
  console.error(`"${language}" is not a valid GoogleLanguage.`);
  process.exit(1);
}

const apiKey = process.env.HEMMINGWAY_API_KEY;
if (!apiKey) {
  console.error('HEMMINGWAY_API_KEY is missing in scripts/.env.local');
  process.exit(1);
}

const filePath = resolve(process.cwd(), filePathArg);
const extension = extname(filePath).toLowerCase();

if (extension !== '.html' && extension !== '.json') {
  console.error(`Unsupported file type "${extension}". Use .html or .json.`);
  process.exit(1);
}

const openai = new OpenAI({ apiKey, baseURL: BASE_URL });

const getInstructions = (language: GoogleLanguage) => {
  const languageName = languageList[language];

  return [
    `You are a professional ${languageName} editor and native speaker.`,
    `Improve the grammar, spelling, punctuation and style of the ${languageName} text so it reads naturally, clearly and concisely, like it was written by a native speaker.`,
    'Preserve the meaning and tone. Do not add or remove information.',
    'Do not translate brand or product names (e.g. Vocably) and keep any placeholders such as {name}, {{name}}, %s, %d, $1 exactly as they are.',
    'Keep text that is intentionally in another language (e.g. example words in the language being learned) unchanged.',
  ].join('\n');
};

const scriptStartedAt = Date.now();

const secondsSince = (startedAt: number) =>
  `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;

// Shows a live elapsed time counter while the promise is pending.
const withElapsedTime = async <T,>(label: string, promise: Promise<T>) => {
  const startedAt = Date.now();
  const interval = process.stdout.isTTY
    ? setInterval(
        () => process.stdout.write(`\r${label} ${secondsSince(startedAt)}`),
        100
      )
    : undefined;

  try {
    return await promise;
  } finally {
    clearInterval(interval);
    const line = `${label} ${secondsSince(startedAt)}`;
    process.stdout.isTTY
      ? process.stdout.write(`\r${line}\n`)
      : console.log(line);
  }
};

const complete = async (system: string, user: string, json: boolean) => {
  const abortController = new AbortController();
  const response = await withElapsedTime(
    'Waiting for Hemmingway...',
    timeout(
      openai.chat.completions.create(
        {
          model: MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          ...(json
            ? { response_format: { type: 'json_object' as const } }
            : {}),
        },
        { signal: abortController.signal }
      ),
      abortController,
      REQUEST_TIMEOUT_MS
    )
  ).catch((error) => {
    if (abortController.signal.aborted) {
      throw new Error(
        `Hemmingway did not respond within ${REQUEST_TIMEOUT_MS / 1000}s.`
      );
    }
    throw error;
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from the API.');
  }

  return content;
};

// ---------- JSON ----------

const collectStrings = (value: unknown, result: Set<string> = new Set()) => {
  if (typeof value === 'string') {
    if (value.trim() !== '') {
      result.add(value);
    }
  } else if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, result));
  }

  return result;
};

// Replaces string values (not keys) directly in the source text,
// so the original formatting of the file stays untouched.
const replaceJsonValues = (
  content: string,
  replacements: Map<string, string>
): string =>
  content.replace(
    /"(?:[^"\\]|\\.)*"(?=(\s*:)?)/g,
    (literal, isKey: string | undefined) => {
      if (isKey) {
        return literal;
      }
      const replacement = replacements.get(JSON.parse(literal));
      return replacement === undefined ? literal : JSON.stringify(replacement);
    }
  );

const improveJson = async (content: string): Promise<string> => {
  const strings = [...collectStrings(JSON.parse(content))];
  const replacements = new Map<string, string>();

  const system = [
    getInstructions(language),
    'You will receive a JSON object where each value is a separate text.',
    'Return a JSON object with exactly the same keys, where each value is the improved text.',
    'Keep any HTML tags, markdown, line breaks and leading/trailing whitespace inside the values intact.',
  ].join('\n');

  for (let start = 0; start < strings.length; start += JSON_CHUNK_SIZE) {
    const chunk = strings.slice(start, start + JSON_CHUNK_SIZE);
    const payload = Object.fromEntries(
      chunk.map((text, index) => [String(index), text])
    );

    console.log(
      `Processing strings ${start + 1}-${start + chunk.length} of ${
        strings.length
      }...`
    );

    const improved = JSON.parse(
      await complete(system, JSON.stringify(payload, null, 2), true)
    );

    chunk.forEach((text, index) => {
      const value = improved[String(index)];
      if (typeof value !== 'string') {
        console.warn(`Missing improved value for "${text}", kept original.`);
        return;
      }
      if (value !== text) {
        replacements.set(text, value);
      }
    });
  }

  const result = replaceJsonValues(content, replacements);
  JSON.parse(result);
  return result;
};

// ---------- HTML ----------

const getTags = (html: string) => html.match(/<[^>]+>/g) ?? [];

const improveHtml = async (content: string): Promise<string> => {
  const system = [
    getInstructions(language),
    'You will receive an HTML document. Edit only the human-readable text content and the values of the alt, title, placeholder and aria-label attributes (plus the content of meta description tags).',
    'Every tag, attribute, class, id, URL, script, style, comment, and all whitespace and indentation must stay exactly the same.',
    'Return only the complete resulting HTML, without code fences or any commentary.',
  ].join('\n');

  const improved = (await complete(system, content, false))
    .replace(/^```(?:html)?\s*\n/, '')
    .replace(/\n```\s*$/, '\n')
    .trim();

  const originalTags = getTags(content);
  const improvedTags = getTags(improved);
  const tagNames = (tags: string[]) =>
    tags.map((tag) => tag.match(/^<\/?[!\w-]+/)?.[0]).join();

  if (tagNames(originalTags) !== tagNames(improvedTags)) {
    throw new Error(
      'HTML structure was changed by the API. The file was left untouched.'
    );
  }

  const leadingWhitespace = content.match(/^\s*/)![0];
  const trailingWhitespace = content.match(/\s*$/)![0];

  return leadingWhitespace + improved + trailingWhitespace;
};

// ---------- Main ----------

const content = readFileSync(filePath, 'utf-8');

console.log(
  `Improving ${languageList[language]} grammar and style of ${filePath}...`
);

const result =
  extension === '.json'
    ? await improveJson(content)
    : await improveHtml(content);

if (result === content) {
  console.log(`No changes. Total time: ${secondsSince(scriptStartedAt)}`);
} else {
  writeFileSync(filePath, result);
  console.log(`Saved. Total time: ${secondsSince(scriptStartedAt)}`);
}
