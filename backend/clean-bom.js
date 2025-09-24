const fs = require('fs');
const path = require('path');

// Script para limpiar BOM de todos los archivos TypeScript y JSON
function removeBOM(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const cleanContent = content.replace(/^\uFEFF/, '');
  
  if (content !== cleanContent) {
    fs.writeFileSync(filePath, cleanContent, 'utf8');
    console.log(`✓ Cleaned BOM from: ${filePath}`);
    return true;
  }
  return false;
}

function processDirectory(dirPath) {
  let cleaned = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
      cleaned += processDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.json'))) {
      if (removeBOM(fullPath)) {
        cleaned++;
      }
    }
  });
  
  return cleaned;
}

console.log('🧹 Cleaning BOM from all TypeScript and JSON files...\n');

const srcPath = path.join(__dirname, 'src');
const rootPath = __dirname;

// Clean src directory
let cleanedCount = 0;
if (fs.existsSync(srcPath)) {
  cleanedCount += processDirectory(srcPath);
}

// Clean root JSON files
const rootFiles = ['nest-cli.json', 'tsconfig.json', 'tsconfig.build.json', 'package.json'];
rootFiles.forEach(file => {
  const filePath = path.join(rootPath, file);
  if (fs.existsSync(filePath) && removeBOM(filePath)) {
    cleanedCount++;
  }
});

console.log(`\n✨ Cleaning complete! ${cleanedCount} files cleaned.`);

if (cleanedCount === 0) {
  console.log('   All files were already clean!');
}