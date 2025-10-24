import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Obtener URL del backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`
🚀 NexoPOS Frontend Server starting...
📍 Environment: ${NODE_ENV}
🔀 Backend URL: ${BACKEND_URL}
🎯 Port: ${PORT}
`);

// Ruta al directorio de archivos compilados del frontend
const distPath = path.join(__dirname, 'dist');

// Verificar que el directorio dist existe
if (!fs.existsSync(distPath)) {
  console.error(`❌ Error: Frontend build directory not found at ${distPath}`);
  console.error('   Run: npm run build');
  process.exit(1);
}

console.log(`✅ Frontend directory found: ${distPath}`);

// Middleware para servir archivos estáticos
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: false
}));

// Proxy para /api - redirige todas las llamadas a la API al backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  logLevel: 'warn',
  onError: (err, req, res) => {
    console.error(`❌ Proxy error: ${err.message}`);
    res.status(503).json({
      error: 'API service unavailable',
      message: 'Unable to connect to backend service',
      details: err.message
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['X-Proxied-By'] = 'NexoPOS-Frontend';
  }
}));

// SPA Fallback: Servir index.html para todas las rutas no encontradas
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');

  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Not found',
      message: 'Frontend files not found. Please build the application.'
    });
  }
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅ NexoPOS Frontend Server is running!

📍 Frontend: http://0.0.0.0:${PORT}
🔀 API Proxy: http://0.0.0.0:${PORT}/api → ${BACKEND_URL}/api
🌐 Frontend Directory: ${distPath}

📝 Configuration:
   - NODE_ENV: ${NODE_ENV}
   - BACKEND_URL: ${BACKEND_URL}
   - PORT: ${PORT}
  `);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
