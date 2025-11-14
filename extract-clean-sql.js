const fs = require('fs');

// Leer el backup
const sql = fs.readFileSync('nexopos_backup.sql', 'utf8');

// Expresiones regulares para capturar comandos SQL completos
const typeRegex = /CREATE TYPE[^;]+;/g;
const tableRegex = /CREATE TABLE[^;]+\([^)]+\);/gs;
const constraintRegex = /ALTER TABLE ONLY[^;]+ADD CONSTRAINT[^;]+;/g;
const pkRegex = /ALTER TABLE ONLY[^;]+ADD CONSTRAINT[^;]+PRIMARY KEY[^;]+;/g;
const fkRegex = /ALTER TABLE ONLY[^;]+ADD CONSTRAINT[^;]+FOREIGN KEY[^;]+;/g;
const indexRegex = /CREATE INDEX[^;]+;/g;
const sequenceRegex = /CREATE SEQUENCE[^;]+;/gs;
const sequenceOwnerRegex = /ALTER SEQUENCE[^;]+OWNED BY[^;]+;/g;
const sequenceSetvalRegex = /SELECT pg_catalog\.setval[^;]+;/g;
const copyRegex = /COPY [^\n]+\n(.*?\n\\\.\n)/gs;

// Extraer comandos
const types = sql.match(typeRegex) || [];
const tables = sql.match(tableRegex) || [];
const sequences = sql.match(sequenceRegex) || [];
const sequenceOwners = sql.match(sequenceOwnerRegex) || [];
const primaryKeys = sql.match(pkRegex) || [];
const foreignKeys = sql.match(fkRegex) || [];
const indexes = sql.match(indexRegex) || [];
const copyCommands = sql.match(copyRegex) || [];
const setvals = sql.match(sequenceSetvalRegex) || [];

console.log('📊 Análisis del backup SQL:\n');
console.log(`  - Tipos ENUM: ${types.length}`);
console.log(`  - Tablas: ${tables.length}`);
console.log(`  - Secuencias: ${sequences.length}`);
console.log(`  - Primary Keys: ${primaryKeys.length}`);
console.log(`  - Foreign Keys: ${foreignKeys.length}`);
console.log(`  - Índices: ${indexes.length}`);
console.log(`  - COPY (datos): ${copyCommands.length}`);
console.log(`  - Setvals: ${setvals.length}\n`);

// Función para limpiar SQL
const cleanSQL = (sql) => {
  return sql
    .replace(/^\s+/gm, '') // Eliminar espacios al inicio
    .replace(/\n+/g, '\n') // Normalizar saltos de línea
    .trim();
};

// Guardar cada sección
const sections = [
  { name: '01_extension', content: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' },
  { name: '02_types', content: types.map(cleanSQL).join('\n\n') },
  { name: '03_sequences', content: sequences.map(cleanSQL).join('\n\n') },
  { name: '04_tables', content: tables.map(cleanSQL).join('\n\n') },
  { name: '05_sequence_owners', content: sequenceOwners.map(cleanSQL).join('\n') },
  { name: '06_primary_keys', content: primaryKeys.map(cleanSQL).join('\n') },
  { name: '07_foreign_keys', content: foreignKeys.map(cleanSQL).join('\n') },
  { name: '08_indexes', content: indexes.map(cleanSQL).join('\n') },
  { name: '09_data', content: copyCommands.join('\n') },
  { name: '10_setvals', content: setvals.join('\n') }
];

sections.forEach(section => {
  if (section.content && section.content.trim()) {
    fs.writeFileSync(`sql_${section.name}.sql`, section.content, 'utf8');
    console.log(`✅ ${section.name}.sql creado`);
  }
});

console.log('\n✨ Archivos SQL limpios generados!');
