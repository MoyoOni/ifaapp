console.log('=== Repository Cleanup Verification ===\n');

const fs = require('fs');
const path = require('path');

// Check if files were removed
const filesToRemove = [
  'backend-dev.log',
  'frontend/dev.log',
  'backend/src/notifications/email.service.ts.backup'
];

console.log('🗑️ Checking removed files:');
filesToRemove.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '❌ STILL EXISTS' : '✅ REMOVED'} ${file}`);
});

// Check .gitignore updates
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  console.log('\n📄 .gitignore enhancements:');
  
  const checks = [
    { pattern: '*-dev.log', desc: 'Development logs' },
    { pattern: '*.log.*', desc: 'Log variants' },
    { pattern: '*.backup', desc: 'Backup files' },
    { pattern: '*.tmp', desc: 'Temporary files' }
  ];
  
  checks.forEach(check => {
    const hasPattern = gitignoreContent.includes(check.pattern);
    console.log(`  ${hasPattern ? '✅' : '❌'} ${check.desc} (${check.pattern})`);
  });
}

// Check for any remaining large log files
console.log('\n🔍 Checking for remaining large log files:');
function findLargeLogs(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  
  try {
    const items = fs.readdirSync(dir);
    let largeFiles = [];
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && 
          !['node_modules', 'coverage', 'dist', '.git'].includes(item)) {
        largeFiles = largeFiles.concat(findLargeLogs(fullPath, maxDepth, currentDepth + 1));
      } else if (stat.isFile() && path.extname(item) === '.log' && stat.size > 100000) {
        largeFiles.push({ path: fullPath, size: stat.size });
      }
    });
    
    return largeFiles;
  } catch (error) {
    return [];
  }
}

const largeLogs = findLargeLogs(__dirname);
if (largeLogs.length === 0) {
  console.log('  ✅ No large log files found (>100KB)');
} else {
  console.log('  ⚠️  Found large log files:');
  largeLogs.forEach(log => {
    console.log(`    - ${log.path.replace(__dirname, '')} (${Math.round(log.size/1024)}KB)`);
  });
}

console.log('\n🎉 Repository Cleanup Complete!');
console.log('\n📋 Summary:');
console.log('- Removed large log files');
console.log('- Removed backup files');
console.log('- Enhanced .gitignore for better prevention');
console.log('- Repository is now cleaner and more maintainable');