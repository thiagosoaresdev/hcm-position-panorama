#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting test execution...');
console.log('Working directory:', process.cwd());

// Run vitest with explicit configuration
const vitestProcess = spawn('node', [
  './node_modules/vitest/dist/cli.js',
  '--run',
  '--reporter=verbose',
  '--config=vite.config.ts'
], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

vitestProcess.on('close', (code) => {
  console.log(`\nTest process completed with exit code: ${code}`);
  process.exit(code);
});

vitestProcess.on('error', (error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});