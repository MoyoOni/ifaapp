#!/usr/bin/env ts-node

/**
 * Script to remove the spiritual journey feature as per project specification
 * This addresses the requirement in the project specification to remove this feature
 */

import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = join(dirname(__dirname));

// Paths to remove
const FRONTEND_SPIRITUAL_JOURNEY_PATH = join(ROOT_PATH, 'frontend', 'src', 'features', 'spiritual-journey');
const BACKEND_SPIRITUAL_JOURNEY_PATH = join(ROOT_PATH, 'backend', 'src', 'spiritual-journey');

// Files that might need to be checked for imports/usage
const CHECK_FILES = [
  join(ROOT_PATH, 'frontend', 'src', 'App.tsx'),
  join(ROOT_PATH, 'backend', 'src', 'app.module.ts'),
];

function removeDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    console.log(`Removing directory: ${dirPath}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✓ Removed directory: ${dirPath}`);
  } else {
    console.log(`Directory does not exist, skipping: ${dirPath}`);
  }
}

function checkAndCleanImports(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist, skipping: ${filePath}`);
    return;
  }

  console.log(`Checking file for spiritual journey references: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check for any references to spiritual journey
  const spiritualJourneyRegex = /spiritual-journey/gi;
  if (spiritualJourneyRegex.test(content)) {
    console.log(`Found spiritual journey reference in ${filePath}, removing...`);
    
    // Remove import statements
    const importRegex = /^[ \t]*import\s+.*(?:spiritual-journey|spiritual_journey)[^'"]*['"][^'"]*['"];?\s*$(\n|\r\n)?/gm;
    content = content.replace(importRegex, '');
    
    // Remove route definitions
    const routeRegex = /[^\n\S]*(?:path|route).*['"`][^'"`]*spiritual[^'"`]*['"`][^\n]*\s*\n?/gi;
    content = content.replace(routeRegex, '');
    
    // Remove module declarations
    const moduleRegex = /[^\n\S]*\w*:\s*.*Spiritual.*Journey.*Module[,\n]/g;
    content = content.replace(moduleRegex, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Cleaned spiritual journey references from ${filePath}`);
  } else {
    console.log(`No spiritual journey references found in ${filePath}`);
  }
}

function main(): void {
  console.log('Starting spiritual journey feature cleanup...');
  
  // Remove frontend directory
  removeDirectory(FRONTEND_SPIRITUAL_JOURNEY_PATH);
  
  // Remove backend directory
  removeDirectory(BACKEND_SPIRITUAL_JOURNEY_PATH);
  
  // Check and clean important files
  CHECK_FILES.forEach(checkAndCleanImports);
  
  console.log('\nSpiritual journey feature cleanup completed!');
  console.log('Note: You may need to manually check:');
  console.log('- Other routing files');
  console.log('- Other module files');
  console.log('- Any other files that might reference spiritual journey');
  console.log('- Run tests to ensure no functionality is broken');
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}