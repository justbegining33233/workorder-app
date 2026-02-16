#!/usr/bin/env node
// Simple helper to decode a JWT token using the client's decode (no verification)
const jwt = require('jsonwebtoken');

const token = process.argv[2] || process.env.TEST_TOKEN;
if (!token) {
  console.error('Usage: node scripts/test-decode-token.js <token>');
  process.exit(1);
}

const payload = jwt.decode(token);
console.log('Decoded payload:', payload);
