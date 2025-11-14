const fs = require('fs');

// Leer el archivo SQL
const sqlContent = fs.readFileSync('nexopos_backup.sql', 'utf8');

// Líneas a eliminar/filtrar
const linesToSkip = [
  /^PGDMP/,
  /^--/,
  /CREATE DATABASE/,
  /DROP DATABASE/,
  /\\connect/,
  /^SET client_encoding/,
  /^SET standard_conforming_strings/,
  /SELECT pg_catalog\.set_config/,
  /COMMENT ON EXTENSION/,
  /^$/ // líneas vacías
];

// Procesar línea por línea
const lines = sqlContent.split('\n');
const cleanedLines = [];

for (const line of lines) {
  // Verificar si la línea debe ser omitida
  const shouldSkip = linesToSkip.some(pattern => pattern.test(line));

  if (!shouldSkip && line.trim()) {
    cleanedLines.push(line);
  }
}

// Unir las líneas
const cleanedSql = cleanedLines.join('\n');

// Guardar
fs.writeFileSync('nexopos_backup_clean.sql', cleanedSql, 'utf8');

console.log(`✅ SQL limpiado`);
console.log(`   Original: ${lines.length} líneas`);
console.log(`   Limpio: ${cleanedLines.length} líneas`);
console.log(`   Tamaño: ${(cleanedSql.length / 1024).toFixed(2)} KB`);
