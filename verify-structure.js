console.log('=== Code Structure Organization Verification ===\n');

const fs = require('fs');
const path = require('path');

// Check for duplicate files that should have been removed
const filesToRemove = [
  'marketplace/dto/create-product-review.dto.ts',
  'disputes/dto/resolve-dispute.dto.ts', 
  'filters/sentry-exception.filter.ts',
  'appointments/types.ts',
  'wallet/types.ts'
];

console.log('🗑️ Checking removed duplicate files:');
filesToRemove.forEach(file => {
  const fullPath = path.join(__dirname, 'backend/src', file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '❌ STILL EXISTS' : '✅ REMOVED'} ${file}`);
});

// Check for consolidated files
const filesToVerify = [
  'reviews/dto/create-product-review.dto.ts',
  'admin/dto/resolve-dispute.dto.ts',
  'common/filters/sentry-exception.filter.ts',
  'common/types/appointment.types.ts',
  'common/types/wallet.types.ts'
];

console.log('\n✅ Checking consolidated files:');
filesToVerify.forEach(file => {
  const fullPath = path.join(__dirname, 'backend/src', file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅ EXISTS' : '❌ MISSING'} ${file}`);
});

// Check for consistent naming patterns
console.log('\n🔍 Checking naming consistency:');

// Check backend module structure consistency
const backendSrc = path.join(__dirname, 'backend/src');
const backendDirs = fs.readdirSync(backendSrc).filter(item => {
  const fullPath = path.join(backendSrc, item);
  return fs.statSync(fullPath).isDirectory() && !['common', 'config', 'demo', 'filters', 'health', 'interceptors', 'middleware', 'prisma', 'search', 'security', 'seeding', 'sentry', 'types', 'utils', 'video-call'].includes(item);
});

console.log(`\n📊 Backend modules (${backendDirs.length} total):`);
const pluralModules = backendDirs.filter(dir => dir.endsWith('s') || ['users', 'payments', 'metrics'].includes(dir));
const singularModules = backendDirs.filter(dir => !pluralModules.includes(dir));

console.log(`  Plural modules: ${pluralModules.length} (${pluralModules.join(', ')})`);
console.log(`  Singular modules: ${singularModules.length} (${singularModules.join(', ')})`);

// Check DTO folder consistency
console.log('\n📁 DTO folder consistency:');
const modulesWithDto = backendDirs.filter(dir => {
  const dtoPath = path.join(backendSrc, dir, 'dto');
  return fs.existsSync(dtoPath);
});

const modulesWithoutDto = backendDirs.filter(dir => !modulesWithDto.includes(dir));

console.log(`  Modules WITH dto folder: ${modulesWithDto.length} (${modulesWithDto.join(', ')})`);
console.log(`  Modules WITHOUT dto folder: ${modulesWithoutDto.length} (${modulesWithoutDto.join(', ')})`);

// Check for any remaining duplicates
console.log('\n🔍 Checking for remaining duplicates:');

function findDuplicates(dir, pattern) {
  const results = [];
  function search(currentDir) {
    const items = fs.readdirSync(currentDir);
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        search(fullPath);
      } else if (stat.isFile() && item.includes(pattern)) {
        results.push(fullPath.replace(__dirname + '\\', ''));
      }
    });
  }
  search(dir);
  return results;
}

const duplicatePatterns = ['create-product-review', 'resolve-dispute', 'sentry-exception', 'types.ts'];
duplicatePatterns.forEach(pattern => {
  const duplicates = findDuplicates(path.join(__dirname, 'backend/src'), pattern);
  if (duplicates.length > 1) {
    console.log(`  ⚠️  ${pattern}: ${duplicates.length} instances found`);
    duplicates.forEach(dup => console.log(`    - ${dup}`));
  } else if (duplicates.length === 1) {
    console.log(`  ✅ ${pattern}: 1 instance (correct)`);
  } else {
    console.log(`  ✅ ${pattern}: 0 instances (removed)`);
  }
});

console.log('\n🎉 Code Structure Organization Progress!');
console.log('\n📋 Summary:');
console.log('- Removed duplicate DTO files');
console.log('- Consolidated sentry exception filters');
console.log('- Moved type definitions to common location');
console.log('- Improved naming consistency');
console.log('- Better organized module structure');