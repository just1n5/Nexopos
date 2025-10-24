const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Obtener URLs de los backends
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`Starting server in ${NODE_ENV} mode...`);
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Port: ${PORT}`);

// Middleware para servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, 'frontend', 'dist');

// Verificar que el directorio del frontend existe
if (fs.existsSync(frontendPath)) {
  console.log(`✅ Frontend path found: ${frontendPath}`);
  app.use(express.static(frontendPath));
} else {
  console.warn(`⚠️  Frontend path not found: ${frontendPath}`);
}

// Proxy para /api
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(503).json({
      error: 'Backend service unavailable',
      message: err.message
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log de las llamadas al API
    console.log(`${req.method} ${req.path} -> ${proxyRes.statusCode}`);
  }
}));

// SPA Fallback: servir index.html para rutas no encontradas
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Not found',
      message: `Frontend files not found at ${frontendPath}`
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅ NexoPOS Server running on http://0.0.0.0:${PORT}
📦 Serving frontend from: ${frontendPath}
🔀 Proxying /api to: ${BACKEND_URL}
🔐 Environment: ${NODE_ENV}
  `);
});

// Manejo de errores
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
