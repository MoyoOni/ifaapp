#!/usr/bin/env tsx
/**
 * Script to find hardcoded colors in the codebase
 * Usage: npx tsx scripts/find-hardcoded-colors.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface ColorMatch {
  file: string;
  line: number;
  content: string;
  color: string;
}

const hardcodedColorPatterns = [
  // Hex colors
  /#[0-9a-fA-F]{3,6}/g,
  // RGB/RGBA/HSL/HSLA functions
  /rgba?\([^)]+\)/g,
  /hsla?\([^)]+\)/g,
  // Common hardcoded Tailwind color classes
  /\b(bg|text|border|ring|divide)-(red|green|blue|yellow|purple|pink|indigo|orange|amber|emerald|teal|sky|violet|fuchsia|rose|lime|cyan|stone|gray|slate|zinc)-[1-9]00\b/g,
  /\b(bg|text|border|ring|divide)-(red|green|blue|yellow|purple|pink|indigo|orange|amber|emerald|teal|sky|violet|fuchsia|rose|lime|cyan)-(50|100|200|300|400|500|600|700|800|900)\b/g,
];

async function findFiles(dir: string, ext: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? findFiles(res, ext) : (res.endsWith(ext) ? [res] : []);
  }));
  return files.flat();
}

async function scanFileForColors(filePath: string): Promise<ColorMatch[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches: ColorMatch[] = [];

  lines.forEach((line, index) => {
    hardcodedColorPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.source, `${pattern.flags}g`);
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          color: match[0]
        });
      }
    });
  });

  return matches;
}

async function main() {
  console.log('🔍 Scanning for hardcoded colors in the codebase...\n');

  const files = await findFiles('./frontend', '.tsx');
  const allMatches: ColorMatch[] = [];

  for (const file of files) {
    const matches = await scanFileForColors(file);
    allMatches.push(...matches);
  }

  if (allMatches.length === 0) {
    console.log('✅ No hardcoded colors found!');
    return;
  }

  console.log(`⚠️ Found ${allMatches.length} hardcoded colors in ${new Set(allMatches.map(m => m.file)).size} files:\n`);

  // Group by file
  const groupedByFile: Record<string, ColorMatch[]> = {};
  allMatches.forEach(match => {
    if (!groupedByFile[match.file]) {
      groupedByFile[match.file] = [];
    }
    groupedByFile[match.file].push(match);
  });

  Object.entries(groupedByFile).forEach(([file, matches]) => {
    console.log(`📁 ${file}:`);
    matches.forEach(match => {
      console.log(`  Line ${match.line}: ${match.color}`);
      console.log(`    ${match.content}`);
    });
    console.log('');
  });

  console.log(`\n💡 Found ${allMatches.length} total hardcoded color instances in ${files.length} files.`);
  console.log('To fix these, replace with design tokens from designTokens object.');
}

main().catch(console.error);