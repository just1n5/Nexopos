# Script PowerShell para reiniciar el backend con configuración mínima
Write-Host "🔧 REINICIANDO BACKEND CON CONFIGURACIÓN MÍNIMA" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# 1. Instalar dependencias faltantes
Write-Host "`n📦 Instalando dependencias necesarias..." -ForegroundColor Yellow
npm install @nestjs/serve-static @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt class-validator class-transformer

# 2. Limpiar compilación anterior
Write-Host "`n🧹 Limpiando compilación anterior..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
}

# 3. Compilar
Write-Host "`n🔨 Compilando proyecto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Compilación exitosa!" -ForegroundColor Green
    
    # 4. Iniciar servidor
    Write-Host "`n🚀 Iniciando servidor..." -ForegroundColor Cyan
    npm run start
} else {
    Write-Host "`n❌ Error en la compilación. Verificando problemas..." -ForegroundColor Red
    Write-Host "Intenta ejecutar: npm run build" -ForegroundColor Yellow
}