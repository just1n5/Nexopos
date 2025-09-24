const fs = require('fs');
const path = 'src/scripts/seed.ts';
let data = fs.readFileSync(path, 'utf8');

const simpleReplacements = [
  [/console\.log\([^)]*Starting seeds\.\.\.[^)]*\);/g, "console.log('Starting seeds...');"],
  [/console\.log\([^)]*Creating users\.\.\.[^)]*\);/g, "console.log('Creating users...');"],
  [/console\.log\([^)]*Creating categories\.\.\.[^)]*\);/g, "console.log('Creating categories...');"],
  [/console\.log\([^)]*Creating taxes\.\.\.[^)]*\);/g, "console.log('Creating taxes...');"],
  [/console\.log\([^)]*Creating products\.\.\.[^)]*\);/g, "console.log('Creating products...');"],
  [/console\.log\([^)]*Creating customers\.\.\.[^)]*\);/g, "console.log('Creating customers...');"],
  [/console\.log\([^)]*Creating DIAN resolution\.\.\.[^)]*\);/g, "console.log('Creating DIAN resolution...');"],
  [/console\.log\([^)]*Seeds completed successfully![^)]*\);/g, "console.log('Seeds completed successfully!');"],
  [/console\.error\([^)]*Error running seeds:[^)]*\);/g, "console.error('Error running seeds:', error);"] ,
  [/console\.log\(`[^`]*User created:[^`]*`\);/g, "console.log(`  -> User created: \${userData.email}`);"] ,
  [/console\.log\(`[^`]*User already exists:[^`]*`\);/g, "console.log(`  -> User already exists: \${userData.email}`);"] ,
  [/console\.log\(`[^`]*Category created:[^`]*`\);/g, "console.log(`  -> Category created: \${categoryData.name}`);"] ,
  [/console\.log\(`[^`]*Category already exists:[^`]*`\);/g, "console.log(`  -> Category already exists: \${categoryData.name}`);"] ,
  [/console\.log\(`[^`]*Tax created:[^`]*`\);/g, "console.log(`  -> Tax created: \${taxData.name}`);"] ,
  [/console\.log\(`[^`]*Tax already exists:[^`]*`\);/g, "console.log(`  -> Tax already exists: \${taxData.name}`);"] ,
  [/console\.log\(`[^`]*Customer created:[^`]*`\);/g, "console.log(`  -> Customer created: \${customerData.firstName || customerData.businessName}`);"] ,
  [/console\.log\(`[^`]*Customer already exists:[^`]*`\);/g, "console.log(`  -> Customer already exists: \${customerData.firstName || customerData.businessName}`);"] ,
  [/console\.log\([^)]*Active DIAN resolution already exists[^)]*\);/g, "console.log('  -> Active DIAN resolution already exists');"],
  [/console\.log\(`[^`]*DIAN Resolution created:[^`]*`\);/g, "console.log(`  -> DIAN resolution created: \${resolution.resolutionNumber}`);"]
];

for (const [pattern, replacement] of simpleReplacements) {
  data = data.replace(pattern, replacement);
}

const summaryPattern = /function printSummary[\s\S]*?}\r?\n/;
if (!summaryPattern.test(data)) {
  console.error('Could not locate printSummary block');
} else {
  const summaryReplacement = `function printSummary(counts: any) {\n  console.log('\\nSeeds summary:');\n  console.log('------------------------------');\n  console.log(\`  Users:        \${counts.users}\`);\n  console.log(\`  Categories:   \${counts.categories}\`);\n  console.log(\`  Taxes:        \${counts.taxes}\`);\n  console.log(\`  Products:     \${counts.products}\`);\n  console.log(\`  Customers:    \${counts.customers}\`);\n  console.log(\`  Resolutions:  \${counts.resolution}\`);\n  console.log('------------------------------\\n');\n\n  console.log('Login credentials:');\n  console.log('------------------------------');\n  console.log('  Admin:');\n  console.log('    Email: admin@nexopos.co');\n  console.log('    Pass:  Admin123!');\n  console.log('');\n  console.log('  Cajero:');\n  console.log('    Email: cajero@nexopos.co');\n  console.log('    Pass:  Cajero123!');\n  console.log('');\n  console.log('  Demo:');\n  console.log('    Email: demo@nexopos.co');\n  console.log('    Pass:  Demo123!');\n  console.log('------------------------------\\n');\n}\n`;
  data = data.replace(summaryPattern, summaryReplacement);
}

fs.writeFileSync(path, data, 'utf8');
