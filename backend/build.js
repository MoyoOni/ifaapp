#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Delete RxJS from backend/node_modules to force use of root's RxJS
const rxjsPath = path.join(__dirname, 'node_modules/rxjs');
if (fs.existsSync(rxjsPath)) {
  console.log('Removing backend/node_modules/rxjs to use root version...');
  fs.rmSync(rxjsPath, { recursive: true, force: true });
}

// Set NODE_PATH to root node_modules
process.env.NODE_PATH = path.join(__dirname, '../node_modules');

// Run nest build with NODE_PATH set
execSync('npx nest build', {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname
});
