#!/usr/bin/env node

// Script para iniciar el servidor de NestJS en producción
// Este script es usado por Dokku/Heroku para iniciar la aplicación

const { spawn } = require('child_process');
const path = require('path');

const backendPath = path.join(__dirname, 'backend');
const mainPath = path.join(backendPath, 'dist', 'main.js');

console.log('🚀 Starting NexoPOS backend...');
console.log('Backend path:', backendPath);
console.log('Main file:', mainPath);

// Iniciar el servidor
const server = spawn('node', [mainPath], {
  cwd: backendPath,
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
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
