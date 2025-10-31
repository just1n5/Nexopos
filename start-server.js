#!/usr/bin/env node

// Script para iniciar el servidor de NestJS en producción
// Este script es usado por Dokku/Heroku para iniciar la aplicación

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting NexoPOS backend...');

const backendPath = path.join(__dirname, 'backend');
const mainPath = path.join(backendPath, 'dist', 'main.js');

console.log('Main file path:', mainPath);
console.log('File exists?', fs.existsSync(mainPath));

if (!fs.existsSync(mainPath)) {
  console.error('❌ main.js not found at:', mainPath);
  console.error('Backend path exists?', fs.existsSync(backendPath));
  console.error('Dist path exists?', fs.existsSync(path.join(backendPath, 'dist')));
  process.exit(1);
}

// Iniciar el servidor
console.log('✅ Starting server...');
const server = spawn('node', ['dist/main.js'], {
  cwd: backendPath,
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
  process.exit(code || 0);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});
