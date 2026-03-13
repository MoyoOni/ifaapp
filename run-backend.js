#!/usr/bin/env node

/**
 * Production Backend Runner
 * Runs the pre-built NestJS backend on port 8080
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const backendDist = path.join(__dirname, 'backend', 'dist', 'backend', 'src', 'main.js');
const backendEnv = path.join(__dirname, 'backend', '.env');

// Check if backend dist exists
if (!fs.existsSync(backendDist)) {
  console.error('❌ Backend dist not found. Please run `npm run build` first.');
  process.exit(1);
}

// Check if backend .env exists
if (!fs.existsSync(backendEnv)) {
  console.error('❌ Backend .env not found at:', backendEnv);
  process.exit(1);
}

console.log(`✅ Starting backend from: ${backendDist}`);
console.log(`✅ Using environment: ${backendEnv}\n`);

// Load env variables
require('dotenv').config({ path: backendEnv });

// Set NODE_ENV if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Start the backend
const backend = spawn('node', [backendDist], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, 'backend')
});

backend.on('error', (err) => {
  console.error('❌ Backend process error:', err);
  process.exit(1);
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down...');
  backend.kill();
  process.exit(0);
});
