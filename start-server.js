#!/usr/bin/env node

// Script para iniciar el servidor de NestJS en producción
// Este script es usado por Dokku/Heroku para iniciar la aplicación

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting NexoPOS backend...');
console.log('Current directory:', __dirname);
console.log('Environment:', process.env.NODE_ENV);

// Debug: listar archivos en el directorio actual
console.log('\n📁 Files in root:');
try {
  const rootFiles = execSync('ls -la', { encoding: 'utf-8' });
  console.log(rootFiles);
} catch (e) {
  console.error('Could not list root files:', e.message);
}

// Debug: listar archivos en backend
console.log('\n📁 Files in backend:');
const backendPath = path.join(__dirname, 'backend');
if (fs.existsSync(backendPath)) {
  try {
    const backendFiles = execSync('ls -la backend/', { encoding: 'utf-8' });
    console.log(backendFiles);
  } catch (e) {
    console.error('Could not list backend files:', e.message);
  }
} else {
  console.error('❌ Backend directory does not exist!');
}

// Debug: listar archivos en backend/dist
console.log('\n📁 Files in backend/dist:');
const distPath = path.join(backendPath, 'dist');
if (fs.existsSync(distPath)) {
  try {
    const distFiles = execSync('ls -la backend/dist/', { encoding: 'utf-8' });
    console.log(distFiles);
  } catch (e) {
    console.error('Could not list backend/dist files:', e.message);
  }
} else {
  console.error('❌ Backend/dist directory does not exist!');
}

const mainPath = path.join(distPath, 'main.js');
console.log('\n🔍 Looking for main.js at:', mainPath);
console.log('Main.js exists?', fs.existsSync(mainPath));

if (!fs.existsSync(mainPath)) {
  console.error('❌ main.js not found! Cannot start server.');
  process.exit(1);
}

// Iniciar el servidor
console.log('\n✅ Starting server from:', mainPath);
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
