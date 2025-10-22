import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Tax, TaxType } from '../modules/taxes/entities/tax.entity';
import { Product, ProductStatus } from '../modules/products/entities/product.entity';
import { Customer, CustomerType, CustomerStatus } from '../modules/customers/entities/customer.entity';
import { DianResolution, ResolutionStatus } from '../modules/invoice-dian/entities/dian-resolution.entity';
import { AppDataSource } from '../config/data-source'; // Import AppDataSource

/**
 * Script de Seeds para NexoPOS
 * 
 * Este script crea los datos base necesarios para comenzar a usar el sistema
 */
export async function runSeeds() {
  console.log('Starting seeds...');

  config({ path: '.env' }); // Keep this for local .env files
  
  // Use AppDataSource for database connection
  const dataSource = AppDataSource;

  await dataSource.initialize();

  // Remove uuidExtension check and synchronize as AppDataSource handles this
  // const uuidExtension = await dataSource.query("SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'");
  // if (uuidExtension.length === 0) {
  //   throw new Error('UUID extension "uuid-ossp" is missing. Run CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; as a superuser and retry.');
  // }
  // await dataSource.synchronize();

  try {
    // 1. Create Users
    console.log('Creating users...');
    const users = await createUsers(dataSource);
    
    // 2. Create Categories
    console.log('Creating categories...');
    const categories = await createCategories(dataSource);
    
    // 3. Create Taxes
    console.log('Creating taxes...');
    const taxes = await createTaxes(dataSource);
    
    // 4. Create Products
    console.log('Creating products...');
    const products = await createProducts(dataSource, categories, taxes);
    
    // 5. Create Customers
    console.log('Creating customers...');
    const customers = await createCustomers(dataSource);
    
    // 6. Create DIAN Resolution
    console.log('Creating DIAN resolution...');
    const resolution = await createDianResolution(dataSource);

    console.log('Seeds completed successfully!');
    
    // Print summary
    printSummary({
      users: users.length,
      categories: categories.length,
      taxes: taxes.length,
      products: products.length,
      customers: customers.length,
      resolution: resolution ? 1 : 0
    });

  } catch (error) {
    console.error('Error running seeds:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Helper functions

async function createUsers(dataSource: DataSource): Promise<User[]> {
  const userRepository = dataSource.getRepository(User);
  
  const users = [
    {
      email: 'jserna@cloution.com',
      password: await bcrypt.hash('Aguacate41*', 10),
      firstName: 'Justine',
      lastName: 'Serna',
      role: UserRole.SUPER_ADMIN,
      isActive: true
    },
    {
      email: 'admin@nexopos.co',
      password: await bcrypt.hash('Admin123!', 10),
      firstName: 'Admin',
      lastName: 'NexoPOS',
      role: UserRole.ADMIN,
      isActive: true
    },
    {
      email: 'cajero@nexopos.co',
      password: await bcrypt.hash('Cajero123!', 10),
      firstName: 'Juan',
      lastName: 'Cajero',
      role: UserRole.CASHIER,
      isActive: true
    },
    {
      email: 'demo@nexopos.co',
      password: await bcrypt.hash('Demo123!', 10),
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.CASHIER,
      isActive: true
    }
  ];

  const savedUsers = [];
  for (const userData of users) {
    const existingUser = await userRepository.findOne({ 
      where: { email: userData.email } 
    });
    
    if (!existingUser) {
      const user = userRepository.create(userData);
      const saved = await userRepository.save(user);
      savedUsers.push(saved);
      console.log(`  -> User created: ${userData.email}`);
    } else {
      console.log(`  -> User already exists: ${userData.email}`);
      savedUsers.push(existingUser);
    }
  }

  return savedUsers;
}

async function createCategories(dataSource: DataSource): Promise<Category[]> {
  const categoryRepository = dataSource.getRepository(Category);
  
  const categories = [
    { name: 'Bebidas', description: 'Bebidas y refrescos' },
    { name: 'Alimentos', description: 'Alimentos y comestibles' },
    { name: 'Aseo', description: 'Productos de aseo y limpieza' },
    { name: 'Papelería', description: 'Artículos de papelería' },
    { name: 'Tecnología', description: 'Productos tecnológicos' },
    { name: 'Ropa', description: 'Prendas de vestir' },
    { name: 'Medicamentos', description: 'Productos farmacéuticos' },
    { name: 'Otros', description: 'Otros productos' }
  ];

  const savedCategories = [];
  for (const categoryData of categories) {
    const existing = await categoryRepository.findOne({ 
      where: { name: categoryData.name } 
    });
    
    if (!existing) {
      const category = categoryRepository.create(categoryData);
      const saved = await categoryRepository.save(category);
      savedCategories.push(saved);
      console.log(`  -> Category created: ${categoryData.name}`);
    } else {
      console.log(`  -> Category already exists: ${categoryData.name}`);
      savedCategories.push(existing);
    }
  }

  return savedCategories;
}

async function createTaxes(dataSource: DataSource): Promise<Tax[]> {
  const taxRepository = dataSource.getRepository(Tax);
  
  const taxes = [
    {
      name: 'IVA 19%',
      code: 'IVA19',
      rate: 19,
      type: TaxType.IVA,
      isActive: true,
      description: 'Impuesto al Valor Agregado 19%'
    },
    {
      name: 'IVA 5%',
      code: 'IVA5',
      rate: 5,
      type: TaxType.IVA,
      isActive: true,
      description: 'Impuesto al Valor Agregado 5%'
    },
    {
      name: 'Exento',
      code: 'EXENTO',
      rate: 0,
      type: TaxType.OTHER,
      isActive: true,
      description: 'Producto exento de impuestos'
    },
    {
      name: 'INC 8%',
      code: 'INC8',
      rate: 8,
      type: TaxType.INC,
      isActive: true,
      description: 'Impuesto Nacional al Consumo 8%'
    }
  ];

  const savedTaxes = [];
  for (const taxData of taxes) {
    const existing = await taxRepository.findOne({ 
      where: { code: taxData.code } 
    });
    
    if (!existing) {
      const tax = taxRepository.create(taxData);
      const saved = await taxRepository.save(tax);
      savedTaxes.push(saved);
      console.log(`  -> Tax created: ${taxData.name}`);
    } else {
      console.log(`  -> Tax already exists: ${taxData.name}`);
      savedTaxes.push(existing);
    }
  }

  return savedTaxes;
}

async function createProducts(
  dataSource: DataSource,
  _categories: Category[],
  _taxes: Tax[]
): Promise<Product[]> {
  const productRepository = dataSource.getRepository(Product);

  const products: Array<Partial<Product>> = [
    {
      name: 'Coca Cola 350 ml',
      sku: 'BEB001',
      description: 'Bebida gaseosa Coca Cola 350 ml',
      basePrice: 3000,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Agua Cristal 600 ml',
      sku: 'BEB002',
      description: 'Agua sin gas Cristal 600 ml',
      basePrice: 2500,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Pan Bimbo tradicional',
      sku: 'ALI001',
      description: 'Pan de molde Bimbo 450 g',
      basePrice: 5000,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Leche Alpina 1 L',
      sku: 'ALI002',
      description: 'Leche entera Alpina 1 litro',
      basePrice: 4500,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Jabón Protex barra',
      sku: 'ASE001',
      description: 'Jabón antibacterial Protex 90 g',
      basePrice: 3500,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Papel higiénico Scott x4',
      sku: 'ASE002',
      description: 'Papel higiénico Scott paquete x4',
      basePrice: 8000,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Cuaderno 100 hojas cuadriculado',
      sku: 'PAP001',
      description: 'Cuaderno cuadriculado de 100 hojas',
      basePrice: 4000,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Lapicero BIC azul',
      sku: 'PAP002',
      description: 'Lapicero BIC cristal azul',
      basePrice: 1500,
      status: ProductStatus.ACTIVE,
    },
  ];

  const savedProducts: Product[] = [];

  for (const productData of products) {
    const existing = await productRepository.findOne({
      where: { sku: productData.sku },
    });

    if (!existing) {
      const product = productRepository.create(productData);
      const saved = await productRepository.save(product);
      savedProducts.push(saved);
      console.log(`  -> Product created: ${productData.name}`);
    } else {
      console.log(`  -> Product already exists: ${productData.name}`);
      savedProducts.push(existing);
    }
  }

  return savedProducts;
}

async function createCustomers(dataSource: DataSource): Promise<Customer[]> {
  const customerRepository = dataSource.getRepository(Customer);
  
  const customers = [
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1234567890',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '6012345678',
      mobile: '3001234567',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      creditEnabled: true,
      creditLimit: 500000,
      creditDays: 30,
      whatsapp: '3001234567',
      status: CustomerStatus.ACTIVE
    },
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '9876543210',
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@email.com',
      mobile: '3109876543',
      address: 'Carrera 45 #67-89',
      city: 'Medellín',
      creditEnabled: true,
      creditLimit: 300000,
      creditDays: 15,
      whatsapp: '3109876543',
      status: CustomerStatus.ACTIVE
    },
        {
      type: CustomerType.BUSINESS,
      documentType: 'NIT',
      documentNumber: '900123456-7',
      firstName: 'Distribuidora',
      lastName: 'ABC SAS',
      businessName: 'Distribuidora ABC SAS',
      email: 'contacto@distri-abc.com',
      phone: '6017654321',
      mobile: '3201234567',
      address: 'Avenida 68 #20-45',
      city: 'Bogotá',
      creditEnabled: true,
      creditLimit: 2000000,
      creditDays: 45,
      status: CustomerStatus.ACTIVE
    },
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '222222222',
      firstName: 'Consumidor',
      lastName: 'Final',
      status: CustomerStatus.ACTIVE
    }
  ];

  const savedCustomers = [];
  for (const customerData of customers) {
    const existing = await customerRepository.findOne({ 
      where: { 
        documentType: customerData.documentType,
        documentNumber: customerData.documentNumber 
      } 
    });
    
    if (!existing) {
      const customer = customerRepository.create({
        ...customerData,
        creditAvailable: customerData.creditLimit || 0
      });
      const saved = await customerRepository.save(customer);
      savedCustomers.push(saved);
      console.log(`  -> Customer created: ${customerData.firstName || customerData.businessName}`);
    } else {
      console.log(`  -> Customer already exists: ${customerData.firstName || customerData.businessName}`);
      savedCustomers.push(existing);
    }
  }

  return savedCustomers;
}

async function createDianResolution(dataSource: DataSource): Promise<DianResolution> {
  const resolutionRepository = dataSource.getRepository(DianResolution);
  
  const existing = await resolutionRepository.findOne({ 
    where: { status: ResolutionStatus.ACTIVE } 
  });
  
  if (existing) {
    console.log('  -> Active DIAN resolution already exists');
    return existing;
  }

  const resolution = resolutionRepository.create({
    resolutionNumber: '18764000000000',
    resolutionDate: new Date(),
    validFrom: new Date(),
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    prefix: 'POS',
    rangeFrom: 1,
    rangeTo: 100000,
    currentNumber: 1,
    invoicesIssued: 0,
    invoicesRemaining: 100000,
    technicalKey: 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c',
    status: ResolutionStatus.ACTIVE,
    alertThreshold: 100,
    alertSent: false,
    notes: 'Resolución de facturación POS para NexoPOS'
  });

  const saved = await resolutionRepository.save(resolution);
  console.log(`  -> DIAN resolution created: ${resolution.resolutionNumber}`);
  
  return saved;
}

function printSummary(counts: any) {
  console.log('\nSeeds summary:');
  console.log('------------------------------');
  console.log(`  Users:        ${counts.users}`);
  console.log(`  Categories:   ${counts.categories}`);
  console.log(`  Taxes:        ${counts.taxes}`);
  console.log(`  Products:     ${counts.products}`);
  console.log(`  Customers:    ${counts.customers}`);
  console.log(`  Resolutions:  ${counts.resolution}`);
  console.log('------------------------------\n');

  console.log('Login credentials:');
  console.log('------------------------------');
  console.log('  Admin:');
  console.log('    Email: admin@nexopos.co');
  console.log('    Pass:  Admin123!');
  console.log('');
  console.log('  Cajero:');
  console.log('    Email: cajero@nexopos.co');
  console.log('    Pass:  Cajero123!');
  console.log('');
  console.log('  Demo:');
  console.log('    Email: demo@nexopos.co');
  console.log('    Pass:  Demo123!');
  console.log('------------------------------\n');
}
// Run seeds if executed directly
if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}















