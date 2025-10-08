import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BetaKey } from '../modules/beta-keys/entities/beta-key.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { User } from '../modules/users/entities/user.entity';

/**
 * Script para generar 60 claves beta iniciales
 * Uso: ts-node -r tsconfig-paths/register src/scripts/generate-beta-keys.ts
 */

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  database: configService.get<string>('DB_NAME', 'nexopos'),
  username: configService.get<string>('DB_USER', 'nexopos_user'),
  password: configService.get<string>('DB_PASSWORD', 'nexopos123'),
  entities: [BetaKey, Tenant, User],
  synchronize: true,
});

function generateBetaKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 5 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  const part2 = Array.from({ length: 5 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `BETA-${part1}-${part2}`;
}

async function main() {
  try {
    await dataSource.initialize();
    console.log('✓ Conexión a base de datos establecida');

    const betaKeyRepository = dataSource.getRepository(BetaKey);

    // Verificar cuántas claves ya existen
    const existingCount = await betaKeyRepository.count();
    console.log(`\n📊 Claves beta existentes: ${existingCount}`);

    const keysToGenerate = 60;
    console.log(`\n🔑 Generando ${keysToGenerate} nuevas claves beta...`);

    const keys: BetaKey[] = [];
    const keyStrings = new Set<string>();

    // Generar claves únicas
    while (keyStrings.size < keysToGenerate) {
      const key = generateBetaKey();

      // Verificar que no exista en DB ni en el set actual
      const exists = await betaKeyRepository.findOne({ where: { key } });
      if (!exists && !keyStrings.has(key)) {
        keyStrings.add(key);
      }
    }

    // Crear entidades
    for (const keyString of keyStrings) {
      const betaKey = betaKeyRepository.create({
        key: keyString,
        notes: 'Clave beta inicial - Generada automáticamente',
      });
      keys.push(betaKey);
    }

    // Guardar en batch
    await betaKeyRepository.save(keys);

    console.log(`\n✅ ${keys.length} claves beta generadas exitosamente\n`);
    console.log('📋 Primeras 10 claves generadas:');
    keys.slice(0, 10).forEach((key, index) => {
      console.log(`   ${index + 1}. ${key.key}`);
    });
    console.log('   ...');

    // Exportar a archivo CSV para distribución
    const fs = require('fs');
    const path = require('path');
    const csvContent = `Clave Beta,Estado,Notas\n${keys.map(k => `${k.key},Disponible,Clave beta inicial`).join('\n')}`;
    const csvPath = path.join(__dirname, '../../beta-keys-export.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`\n💾 Claves exportadas a: ${csvPath}`);

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando claves beta:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

main();
