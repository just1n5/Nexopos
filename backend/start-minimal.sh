#!/bin/bash
# Script para iniciar un backend mínimo pero funcional

echo "🔧 INICIANDO BACKEND MÍNIMO FUNCIONAL"
echo "======================================="

# 1. Instalar dependencias necesarias
echo "📦 Instalando dependencias..."
npm install @nestjs/serve-static @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt class-validator class-transformer

# 2. Compilar
echo "🔨 Compilando..."
npm run build

# 3. Iniciar
echo "🚀 Iniciando servidor..."
npm run start