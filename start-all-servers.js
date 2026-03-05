#!/usr/bin/env node

/**
 * @file start-all-servers.js
 * @description Start both frontend and backend servers for development
 * Frontend: http://localhost:8100
 * Backend: http://localhost:8080
 * Demo Credentials: demo_client@example.com / demo123
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const projectRoot = __dirname;

console.log('🚀 Starting Ìlú Àṣẹ Platform (Both Services)...\n');

// Kill any existing processes on ports 8100 and 8080
if (isWindows) {
  try {
    require('child_process').execSync('netstat -ano | findstr "8100" | findstr "LISTENING" | for /f "tokens=5" %a in (\'more\') do taskkill /pid %a /f', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors if processes don't exist
  }
  try {
    require('child_process').execSync('netstat -ano | findstr "8080" | findstr "LISTENING" | for /f "tokens=5" %a in (\'more\') do taskkill /pid %a /f', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors if processes don't exist
  }
}

// Start frontend server
console.log('📱 Starting Frontend Server (Port 8100)...');
const frontendProcess = spawn(isWindows ? 'node.exe' : 'node', ['combined-server.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: isWindows
});

// Start backend server after a short delay
setTimeout(() => {
  console.log('\n⚙️  Starting Backend Server (Port 8080)...');
  const backendEnv = {
    ...process.env,
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://ilease:change-me-in-production@localhost:5432/ilease?schema=public&connection_limit=10&pool_timeout=10',
    JWT_SECRET: 'this_is_a_test_secret_that_is_at_least_32_characters_long',
    PORT: '8080'
  };

  const backendProcess = spawn(isWindows ? 'node.exe' : 'node', ['dist/backend/src/main.js'], {
    cwd: path.join(projectRoot, 'backend'),
    stdio: 'inherit',
    shell: isWindows,
    env: backendEnv
  });

  // Handle exits
  backendProcess.on('exit', (code) => {
    console.log(`\n❌ Backend Process exited with code ${code}`);
    process.exit(code);
  });
}, 2000);

// Handle frontend exit
frontendProcess.on('exit', (code) => {
  console.log(`\n❌ Frontend Process exited with code ${code}`);
  process.exit(code);
});

// Handle signals
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down servers...');
  frontendProcess.kill();
  process.exit(0);
});

// Display ready message
setTimeout(() => {
  console.log('\n✅ All servers are running!');
  console.log('━'.repeat(60));
  console.log('🌐 Frontend: http://localhost:8100');
  console.log('🔗 Backend:  http://localhost:8080');
  console.log('🎭 Demo Login: demo_client@example.com / demo123');
  console.log('━'.repeat(60));
  console.log('\nPress CTRL+C to stop all servers\n');
}, 4000);
