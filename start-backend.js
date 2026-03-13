#!/usr/bin/env node

// Load environment variables before anything else
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Now start the backend
require('./backend/dist/backend/src/main.js');
