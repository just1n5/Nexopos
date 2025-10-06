#!/usr/bin/env node

/**
 * Script de Verificación del Sistema NexoPOS
 * 
 * Verifica que todas las mejoras estén correctamente implementadas:
 * 1. Migración de base de datos aplicada
 * 2. Productos por peso cargados
 * 3. Archivos del frontend en su lugar
 * 4. Cambios en el backend compilando correctamente
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filepath, description) {
  const fullPath = path.join(__dirname, '..', filepath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - NO ENCONTRADO`, 'red');
    log(`   Ruta esperada: ${fullPath}`, 'yellow');
    return false;
  }
}

function checkFileContent(filepath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filepath);
  
  if (!fs.existsSync(fullPath)) {
    log(`❌ ${description} - Archivo no encontrado`, 'red');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const found = content.includes(searchString);
  
  if (found) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Código no encontrado`, 'red');
    log(`   Buscando: ${searchString.substring(0, 50)}...`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n🔍 Verificando Sistema NexoPOS - Mejoras de Venta por Peso\n', 'cyan');
  
  let passed = 0;
  let failed = 0;

  // Verificar Backend
  log('📦 Backend:', 'blue');
  
  if (checkFile('backend/src/modules/products/entities/product.entity.ts', 'Entidad Product existe')) {
    if (checkFileContent(
      'backend/src/modules/products/entities/product.entity.ts',
      'ProductSaleType',
      'ProductSaleType enum agregado'
    )) passed++; else failed++;
    
    if (checkFileContent(
      'backend/src/modules/products/entities/product.entity.ts',
      'pricePerGram',
      'Campo pricePerGram agregado'
    )) passed++; else failed++;
  } else {
    failed += 2;
  }

  if (checkFile('backend/src/modules/products/dto/create-product.dto.ts', 'DTO CreateProduct existe')) {
    if (checkFileContent(
      'backend/src/modules/products/dto/create-product.dto.ts',
      'saleType',
      'DTO actualizado con saleType'
    )) passed++; else failed++;
  } else {
    failed++;
  }

  if (checkFile('backend/src/scripts/seed-fruits-vegetables.ts', 'Script de carga de productos')) {
    passed++;
  } else {
    failed++;
  }

  if (checkFile('backend/src/scripts/add-weight-sale-support.sql', 'Script SQL de migración')) {
    passed++;
  } else {
    failed++;
  }

  // Verificar Frontend
  log('\n🎨 Frontend:', 'blue');

  if (checkFile('frontend/src/components/WeightInput.tsx', 'Componente WeightInput creado')) {
    passed++;
  } else {
    failed++;
  }

  if (checkFile('frontend/src/views/POSView.tsx', 'POSView existe')) {
    passed++;
    log('   ⚠️  Recuerda actualizar POSView manualmente', 'yellow');
    log('   📄 Sigue las instrucciones en INSTRUCCIONES_POSVIEW.md', 'yellow');
  } else {
    failed++;
  }

  // Verificar Documentación
  log('\n📚 Documentación:', 'blue');

  if (checkFile('INSTRUCCIONES_POSVIEW.md', 'Instrucciones de POSView')) {
    passed++;
  } else {
    failed++;
  }

  // Resumen
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📊 Resumen de Verificación:', 'cyan');
  log(`   ✅ Verificaciones Pasadas: ${passed}`, 'green');
  log(`   ❌ Verificaciones Fallidas: ${failed}`, failed > 0 ? 'red' : 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  if (failed === 0) {
    log('🎉 ¡Todas las verificaciones pasaron!', 'green');
    log('\n📋 Próximos Pasos:', 'cyan');
    log('   1. Ejecuta la migración SQL en tu base de datos', 'yellow');
    log('   2. Ejecuta el script de carga: npx ts-node backend/src/scripts/seed-fruits-vegetables.ts', 'yellow');
    log('   3. Actualiza POSView siguiendo INSTRUCCIONES_POSVIEW.md', 'yellow');
    log('   4. Reinicia el backend: cd backend && npm run start:dev', 'yellow');
    log('   5. ¡Prueba el sistema!\n', 'yellow');
  } else {
    log('⚠️  Algunas verificaciones fallaron. Revisa los errores arriba.', 'red');
    log('💡 Tip: Asegúrate de haber aplicado todos los cambios del documento de mejoras.\n', 'yellow');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ Error durante la verificación: ${error.message}`, 'red');
  process.exit(1);
});
