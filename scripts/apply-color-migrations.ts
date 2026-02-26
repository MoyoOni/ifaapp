#!/usr/bin/env tsx
/**
 * Script to apply color migrations to a specific file
 * Usage: npx tsx scripts/apply-color-migrations.ts <filename>
 */

import * as fs from 'fs/promises';
import { ReplaceHardcodedColorsUtil } from '../frontend/src/utils/replace-hardcoded-colors.util';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Please provide a filename to migrate');
    console.log('Usage: npx tsx scripts/apply-color-migrations.ts <filename>');
    process.exit(1);
  }
  
  const fileName = args[0];
  const filePath = fileName.startsWith('/') ? fileName : `./${fileName}`;
  
  try {
    console.log(`🔍 Reading file: ${filePath}`);
    
    const originalContent = await fs.readFile(filePath, 'utf-8');
    console.log(`📄 File loaded, ${originalContent.split('\n').length} lines`);
    
    const colorsToReplace = ReplaceHardcodedColorsUtil.findHardcodedColors(originalContent);
    console.log(`🎨 Found ${colorsToReplace.length} hardcoded color classes to replace`);
    
    if (colorsToReplace.length === 0) {
      console.log('✅ No hardcoded colors found in this file');
      return;
    }
    
    console.log('📋 Color mappings to apply:');
    colorsToReplace.forEach(color => {
      console.log(`   ${color.from} → ${color.to}`);
    });
    
    const updatedContent = ReplaceHardcodedColorsUtil.replaceColorsInJSX(originalContent);
    
    // Generate report
    const report = ReplaceHardcodedColorsUtil.generateReport(originalContent, updatedContent);
    console.log(`\n📊 Migration report: ${report.summary}`);
    
    // Write updated content back to file
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    console.log(`💾 Updated file written to ${filePath}`);
    
    // Show diff summary
    const originalLines = originalContent.split('\n');
    const updatedLines = updatedContent.split('\n');
    
    if (originalLines.length === updatedLines.length) {
      const changedLines = originalLines
        .map((line, idx) => ({ line, idx }))
        .filter(({ line }, idx) => line !== updatedLines[idx])
        .map(item => item.idx + 1);
        
      if (changedLines.length > 0) {
        console.log(`📝 Lines changed: ${changedLines.slice(0, 10).join(', ')}${changedLines.length > 10 ? '...' : ''}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error processing file: ${error.message}`);
    process.exit(1);
  }
}

main();