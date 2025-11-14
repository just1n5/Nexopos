import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Tenant, BusinessType } from '../modules/tenants/entities/tenant.entity';
import { AppDataSource } from '../config/data-source';

/**
 * Script de Seeds para Usuarios de Prueba - NexoPOS
 *
 * Crea usuarios de prueba con diferentes roles para testing manual y automatizado
 *
 * Usuarios creados:
 * - Super Admin (gestión de plataforma)
 * - Admin (dueño de tienda)
 * - Manager (gerente)
 * - Cashier 1, 2, 3 (cajeros para pruebas de concurrencia)
 *
 * Uso:
 *   npm run seed:test-users
 */

export async function runTestUserSeeds() {
  console.log('🧪 Iniciando creación de usuarios de prueba...\n');

  config({ path: '.env' });

  const dataSource = AppDataSource;
  await dataSource.initialize();

  try {
    // 1. Buscar o crear tenant de prueba
    console.log('📦 Verificando tenant de prueba...');
    const tenant = await getOrCreateTestTenant(dataSource);
    console.log(`✅ Tenant: ${tenant.businessName} (${tenant.id})\n`);

    // 2. Crear usuarios de prueba
    console.log('👥 Creando usuarios de prueba...');
    const users = await createTestUsers(dataSource, tenant.id);

    console.log('\n✅ Usuarios de prueba creados exitosamente!\n');
    printUserSummary(users);

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

async function getOrCreateTestTenant(dataSource: DataSource): Promise<Tenant> {
  const tenantRepository = dataSource.getRepository(Tenant);

  // Buscar tenant existente
  let tenant = await tenantRepository.findOne({
    where: { businessName: 'Tienda de Prueba NexoPOS' }
  });

  if (tenant) {
    console.log('  ℹ️  Tenant de prueba ya existe');
    return tenant;
  }

  // Crear nuevo tenant de prueba
  tenant = tenantRepository.create({
    businessName: 'Tienda de Prueba NexoPOS',
    nit: '900123456-7',
    email: 'testing@nexopos.co',
    phone: '+57 300 123 4567',
    address: 'Calle 123 #45-67, Bogotá, Cundinamarca, Colombia',
    businessType: BusinessType.TIENDA,
    betaKeyUsed: 'TEST-BETA-KEY-123',
    isActive: true,
  });

  tenant = await tenantRepository.save(tenant);
  console.log('  ✨ Tenant de prueba creado');

  return tenant;
}

async function createTestUsers(dataSource: DataSource, tenantId: string): Promise<User[]> {
  const userRepository = dataSource.getRepository(User);

  const testUsers = [
    {
      email: 'superadmin@test.nexopos.co',
      password: await bcrypt.hash('SuperAdmin123!', 10),
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      tenantId: null, // Super admin no está atado a un tenant
      description: 'Gestión de plataforma y beta keys'
    },
    {
      email: 'admin@test.nexopos.co',
      password: await bcrypt.hash('Admin123!', 10),
      firstName: 'Carlos',
      lastName: 'Administrador',
      role: UserRole.ADMIN,
      isActive: true,
      tenantId: tenantId,
      description: 'Dueño de tienda - Acceso total'
    },
    {
      email: 'manager@test.nexopos.co',
      password: await bcrypt.hash('Manager123!', 10),
      firstName: 'María',
      lastName: 'Gerente',
      role: UserRole.MANAGER,
      isActive: true,
      tenantId: tenantId,
      description: 'Gerente - Reportes, inventario, configuración'
    },
    {
      email: 'cajero1@test.nexopos.co',
      password: await bcrypt.hash('Cajero123!', 10),
      firstName: 'Juan',
      lastName: 'Cajero',
      role: UserRole.CASHIER,
      isActive: true,
      tenantId: tenantId,
      description: 'Cajero 1 - Ventas y caja'
    },
    {
      email: 'cajero2@test.nexopos.co',
      password: await bcrypt.hash('Cajero123!', 10),
      firstName: 'Ana',
      lastName: 'Vendedora',
      role: UserRole.CASHIER,
      isActive: true,
      tenantId: tenantId,
      description: 'Cajero 2 - Pruebas de concurrencia'
    },
    {
      email: 'cajero3@test.nexopos.co',
      password: await bcrypt.hash('Cajero123!', 10),
      firstName: 'Pedro',
      lastName: 'Vendedor',
      role: UserRole.CASHIER,
      isActive: true,
      tenantId: tenantId,
      description: 'Cajero 3 - Pruebas de concurrencia'
    }
  ];

  const createdUsers: User[] = [];

  for (const userData of testUsers) {
    // Verificar si el usuario ya existe
    const existing = await userRepository.findOne({
      where: { email: userData.email }
    });

    if (existing) {
      console.log(`  ⏭️  ${userData.email} - Ya existe`);
      createdUsers.push(existing);
      continue;
    }

    const { description, ...userDataWithoutDesc } = userData;
    const user = userRepository.create(userDataWithoutDesc);
    const savedUser = await userRepository.save(user);

    console.log(`  ✅ ${userData.email} - ${userData.role}`);
    createdUsers.push(savedUser);
  }

  return createdUsers;
}

function printUserSummary(users: User[]) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 RESUMEN DE USUARIOS DE PRUEBA CREADOS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const credentials = [
    {
      role: '🔐 SUPER ADMIN',
      email: 'superadmin@test.nexopos.co',
      password: 'SuperAdmin123!',
      permisos: 'Gestión de plataforma, beta keys'
    },
    {
      role: '👔 ADMIN (Dueño)',
      email: 'admin@test.nexopos.co',
      password: 'Admin123!',
      permisos: 'Acceso total al sistema'
    },
    {
      role: '📊 MANAGER (Gerente)',
      email: 'manager@test.nexopos.co',
      password: 'Manager123!',
      permisos: 'Reportes, inventario, configuración'
    },
    {
      role: '💰 CAJERO 1',
      email: 'cajero1@test.nexopos.co',
      password: 'Cajero123!',
      permisos: 'Ventas, caja, fiado'
    },
    {
      role: '💰 CAJERO 2',
      email: 'cajero2@test.nexopos.co',
      password: 'Cajero123!',
      permisos: 'Ventas, caja, fiado (testing concurrencia)'
    },
    {
      role: '💰 CAJERO 3',
      email: 'cajero3@test.nexopos.co',
      password: 'Cajero123!',
      permisos: 'Ventas, caja, fiado (testing concurrencia)'
    }
  ];

  credentials.forEach(cred => {
    console.log(`${cred.role}`);
    console.log(`  📧 Email:    ${cred.email}`);
    console.log(`  🔑 Password: ${cred.password}`);
    console.log(`  ✓  Permisos: ${cred.permisos}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total de usuarios: ${users.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  runTestUserSeeds()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falló:', error);
      process.exit(1);
    });
}
