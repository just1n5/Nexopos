const fs = require('fs');

// Leer el backup
const sql = fs.readFileSync('nexopos_backup.sql', 'utf8');

// Dividir en secciones
const lines = sql.split('\n');

let currentSection = '';
let sectionNumber = 1;
let sectionLines = [];
let lineCount = 0;

const saveSection = (name) => {
  if (sectionLines.length > 0) {
    const content = sectionLines.join('\n');
    fs.writeFileSync(`migration_${sectionNumber.toString().padStart(2, '0')}_${name}.sql`, content, 'utf8');
    console.log(`✅ Sección ${sectionNumber}: ${name} (${sectionLines.length} líneas)`);
    sectionNumber++;
    sectionLines = [];
  }
};

for (const line of lines) {
  lineCount++;

  // Detectar inicio de nueva sección
  if (line.includes('CREATE TYPE')) {
    if (currentSection !== 'types') {
      saveSection(currentSection || 'header');
      currentSection = 'types';
    }
  } else if (line.includes('CREATE TABLE')) {
    if (currentSection !== 'tables') {
      saveSection(currentSection);
      currentSection = 'tables';
    }
  } else if (line.includes('ALTER TABLE') && line.includes('ADD CONSTRAINT')) {
    if (currentSection !== 'constraints') {
      saveSection(currentSection);
      currentSection = 'constraints';
    }
  } else if (line.includes('CREATE INDEX')) {
    if (currentSection !== 'indexes') {
      saveSection(currentSection);
      currentSection = 'indexes';
    }
  } else if (line.includes('COPY ') || (line.match(/^[a-f0-9]{8}-/) && currentSection === 'data')) {
    if (currentSection !== 'data') {
      saveSection(currentSection);
      currentSection = 'data';
    }
  }

  // Agregar línea a la sección actual
  sectionLines.push(line);

  // Si la sección es muy grande (>200 líneas), dividirla
  if (sectionLines.length >= 200 && (currentSection === 'tables' || currentSection === 'types')) {
    saveSection(currentSection + '_part');
  }
}

// Guardar última sección
saveSection(currentSection || 'final');

console.log(`\n✨ Total: ${sectionNumber - 1} secciones creadas`);
console.log(`📝 Total de líneas procesadas: ${lineCount}`);
