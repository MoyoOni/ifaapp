/**
 * Healthcheck script for Docker HEALTHCHECK
 * Checks if the application is responding to health endpoints
 */
const http = require('http');

const HOSTNAME = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 8080;
const TIMEOUT = 5000; // 5 seconds

const options = {
  host: HOSTNAME,
  port: PORT,
  path: '/api/health',
  timeout: TIMEOUT,
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed: Server responded with status 200');
    process.exit(0);
  } else {
    console.error(`Health check failed: Server responded with status ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('Health check failed: Could not connect to server');
  console.error(err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error(`Health check failed: Request timed out after ${TIMEOUT}ms`);
  request.destroy();
  process.exit(1);
});

request.end();