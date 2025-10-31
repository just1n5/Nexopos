#!/usr/bin/env node

// Script para iniciar el servidor de NestJS en producción
// Este script es usado por Dokku/Heroku para iniciar la aplicación

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting NexoPOS backend...');

const backendPath = path.join(__dirname, 'backend');
const mainPath = path.join(backendPath, 'dist', 'main.js');

console.log('Main file path:', mainPath);
console.log('File exists?', fs.existsSync(mainPath));

// Si el archivo compilado no existe, compilar ahora
if (!fs.existsSync(mainPath)) {
  console.log('⚠️  Compiled files not found. Compiling backend now...');
  try {
    execSync('npm run build', {
      cwd: backendPath,
      stdio: 'inherit'
    });
    console.log('✅ Backend compiled successfully');
  } catch (error) {
    console.error('❌ Failed to compile backend:', error.message);
    process.exit(1);
  }
}

// Verificar nuevamente si el archivo existe
if (!fs.existsSync(mainPath)) {
  console.error('❌ main.js still not found after compilation!');
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
