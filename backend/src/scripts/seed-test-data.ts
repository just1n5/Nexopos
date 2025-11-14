import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Category } from '../modules/categories/entities/category.entity';
import { Product, ProductStatus, ProductSaleType, WeightUnit } from '../modules/products/entities/product.entity';
import { InventoryStock } from '../modules/inventory/entities/inventory-stock.entity';
import { Customer, CustomerType, CustomerStatus } from '../modules/customers/entities/customer.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { AppDataSource } from '../config/data-source';

/**
 * Script de Seeds para Datos de Prueba Completos - NexoPOS
 *
 * Crea datos de prueba completos para testing manual y automatizado:
 * - Categorías de productos
 * - Productos variados (por unidad y por peso)
 * - Stock inicial para todos los productos
 * - Clientes (individuales y empresas, con y sin crédito)
 *
 * Uso:
 *   npm run seed:test-data
 *
 * Prerequisitos:
 *   - Debe existir un tenant en la base de datos
 *   - Ejecutar primero seed:test-users para tener usuarios
 */

export async function runTestDataSeeds() {
  console.log('🗂️  Iniciando creación de datos de prueba...\n');

  config({ path: '.env' });

  const dataSource = AppDataSource;
  await dataSource.initialize();

  try {
    // 1. Buscar tenant de prueba
    console.log('📦 Buscando tenant de prueba...');
    const tenant = await getTenant(dataSource);
    console.log(`✅ Tenant encontrado: ${tenant.businessName} (${tenant.id})\n`);

    // 2. Crear categorías
    console.log('📁 Creando categorías...');
    const categories = await createCategories(dataSource, tenant.id);
    console.log(`✅ ${categories.length} categorías creadas\n`);

    // 3. Crear productos
    console.log('📦 Creando productos...');
    const products = await createProducts(dataSource, tenant.id, categories);
    console.log(`✅ ${products.length} productos creados\n`);

    // 4. Crear stock inicial
    console.log('📊 Creando stock inicial...');
    const stockItems = await createInitialStock(dataSource, tenant.id, products);
    console.log(`✅ ${stockItems.length} registros de stock creados\n`);

    // 5. Crear clientes
    console.log('👥 Creando clientes...');
    const customers = await createCustomers(dataSource, tenant.id);
    console.log(`✅ ${customers.length} clientes creados\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    printSummary(categories, products, customers);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

async function getTenant(dataSource: DataSource): Promise<Tenant> {
  const tenantRepository = dataSource.getRepository(Tenant);

  const tenant = await tenantRepository.findOne({
    where: { businessName: 'Tienda de Prueba NexoPOS' }
  });

  if (!tenant) {
    throw new Error('No se encontró el tenant de prueba. Ejecuta primero seed:test-users');
  }

  return tenant;
}

async function createCategories(dataSource: DataSource, tenantId: string): Promise<Category[]> {
  const categoryRepository = dataSource.getRepository(Category);

  const categoriesData = [
    { name: 'Abarrotes', description: 'Productos básicos de despensa', color: '#F59E0B', icon: '🥫', sortOrder: 1 },
    { name: 'Bebidas', description: 'Bebidas frías y calientes', color: '#3B82F6', icon: '🥤', sortOrder: 2 },
    { name: 'Snacks', description: 'Mecatos y golosinas', color: '#EF4444', icon: '🍿', sortOrder: 3 },
    { name: 'Lácteos', description: 'Leche, queso, yogurt', color: '#10B981', icon: '🥛', sortOrder: 4 },
    { name: 'Aseo', description: 'Productos de limpieza', color: '#8B5CF6', icon: '🧹', sortOrder: 5 },
    { name: 'Frutas y Verduras', description: 'Productos frescos', color: '#84CC16', icon: '🍎', sortOrder: 6 },
  ];

  const createdCategories: Category[] = [];

  for (const categoryData of categoriesData) {
    const existing = await categoryRepository.findOne({
      where: { name: categoryData.name, tenantId }
    });

    if (existing) {
      console.log(`  ⏭️  ${categoryData.name} - Ya existe`);
      createdCategories.push(existing);
      continue;
    }

    const category = categoryRepository.create({
      ...categoryData,
      tenantId,
      isActive: true,
    });

    const saved = await categoryRepository.save(category);
    console.log(`  ✅ ${categoryData.name}`);
    createdCategories.push(saved);
  }

  return createdCategories;
}

async function createProducts(
  dataSource: DataSource,
  tenantId: string,
  categories: Category[]
): Promise<Product[]> {
  const productRepository = dataSource.getRepository(Product);

  // Helper function to find category by name
  const findCategory = (name: string) =>
    categories.find(c => c.name === name);

  const productsData = [
    // Abarrotes
    { name: 'Arroz Blanco 500g', sku: 'ARR-500', barcode: '7702001234567', basePrice: 2500, tax: 0, category: 'Abarrotes', saleType: ProductSaleType.UNIT },
    { name: 'Aceite Vegetal 1L', sku: 'ACE-1L', barcode: '7702002234567', basePrice: 8500, tax: 19, category: 'Abarrotes', saleType: ProductSaleType.UNIT },
    { name: 'Pasta Spaguetti 500g', sku: 'PAS-500', barcode: '7702003234567', basePrice: 3200, tax: 0, category: 'Abarrotes', saleType: ProductSaleType.UNIT },
    { name: 'Azúcar Blanca 1kg', sku: 'AZU-1K', barcode: '7702004234567', basePrice: 4500, tax: 0, category: 'Abarrotes', saleType: ProductSaleType.UNIT },
    { name: 'Sal de Mesa 500g', sku: 'SAL-500', barcode: '7702005234567', basePrice: 1500, tax: 0, category: 'Abarrotes', saleType: ProductSaleType.UNIT },

    // Bebidas
    { name: 'Gaseosa Coca-Cola 2L', sku: 'GAS-COC-2L', barcode: '7702101234567', basePrice: 5500, tax: 19, category: 'Bebidas', saleType: ProductSaleType.UNIT },
    { name: 'Agua Mineral 500ml', sku: 'AGU-500', barcode: '7702102234567', basePrice: 1500, tax: 0, category: 'Bebidas', saleType: ProductSaleType.UNIT },
    { name: 'Jugo de Naranja 1L', sku: 'JUG-NAR-1L', barcode: '7702103234567', basePrice: 4500, tax: 19, category: 'Bebidas', saleType: ProductSaleType.UNIT },
    { name: 'Cerveza Águila 330ml', sku: 'CER-AGU-330', barcode: '7702104234567', basePrice: 2800, tax: 19, category: 'Bebidas', saleType: ProductSaleType.UNIT },

    // Snacks
    { name: 'Papas Margarita 150g', sku: 'SNA-PAP-150', barcode: '7702201234567', basePrice: 3200, tax: 19, category: 'Snacks', saleType: ProductSaleType.UNIT },
    { name: 'Chocolatina Jet 40g', sku: 'SNA-CHO-40', barcode: '7702202234567', basePrice: 1800, tax: 19, category: 'Snacks', saleType: ProductSaleType.UNIT },
    { name: 'Galletas Ducales 294g', sku: 'SNA-GAL-294', barcode: '7702203234567', basePrice: 4500, tax: 19, category: 'Snacks', saleType: ProductSaleType.UNIT },

    // Lácteos
    { name: 'Leche Entera 1L', sku: 'LAC-LEC-1L', barcode: '7702301234567', basePrice: 3800, tax: 0, category: 'Lácteos', saleType: ProductSaleType.UNIT },
    { name: 'Queso Campesino', sku: 'LAC-QUE-CAMP', barcode: '7702302234567', basePrice: 28000, pricePerGram: 28, tax: 0, category: 'Lácteos', saleType: ProductSaleType.WEIGHT, weightUnit: WeightUnit.KILO },
    { name: 'Yogurt Alpina 1L', sku: 'LAC-YOG-1L', barcode: '7702303234567', basePrice: 5500, tax: 0, category: 'Lácteos', saleType: ProductSaleType.UNIT },

    // Aseo
    { name: 'Jabón Protex 120g', sku: 'ASE-JAB-120', barcode: '7702401234567', basePrice: 3500, tax: 19, category: 'Aseo', saleType: ProductSaleType.UNIT },
    { name: 'Detergente Ariel 500g', sku: 'ASE-DET-500', barcode: '7702402234567', basePrice: 8500, tax: 19, category: 'Aseo', saleType: ProductSaleType.UNIT },
    { name: 'Papel Higiénico x4', sku: 'ASE-PAP-4', barcode: '7702403234567', basePrice: 6500, tax: 19, category: 'Aseo', saleType: ProductSaleType.UNIT },

    // Frutas y Verduras
    { name: 'Tomate Chonto', sku: 'FRU-TOM', barcode: '7702501234567', basePrice: 3500, pricePerGram: 3.5, tax: 0, category: 'Frutas y Verduras', saleType: ProductSaleType.WEIGHT, weightUnit: WeightUnit.KILO },
    { name: 'Plátano Hartón', sku: 'FRU-PLA', barcode: '7702502234567', basePrice: 2500, pricePerGram: 2.5, tax: 0, category: 'Frutas y Verduras', saleType: ProductSaleType.WEIGHT, weightUnit: WeightUnit.KILO },
  ];

  const createdProducts: Product[] = [];

  for (const productData of productsData) {
    const existing = await productRepository.findOne({
      where: { sku: productData.sku, tenantId }
    });

    if (existing) {
      console.log(`  ⏭️  ${productData.name} - Ya existe`);
      createdProducts.push(existing);
      continue;
    }

    const category = findCategory(productData.category);
    if (!category) {
      console.log(`  ⚠️  ${productData.name} - Categoría no encontrada`);
      continue;
    }

    // Usar SQL crudo para control total sobre las columnas insertadas
    let query: string;
    let params: any[];

    if (productData.saleType === ProductSaleType.WEIGHT) {
      // Producto por peso: incluir weight_unit y pricePerGram
      query = `
        INSERT INTO products (name, sku, barcode, "basePrice", tax, "saleType", status, "tenantId", "pricePerGram", "weightUnit")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      params = [
        productData.name,
        productData.sku,
        productData.barcode,
        productData.basePrice,
        productData.tax,
        productData.saleType,
        ProductStatus.ACTIVE,
        tenantId,
        productData.pricePerGram,
        productData.weightUnit
      ];
    } else {
      // Producto por unidad: NO incluir weight_unit
      query = `
        INSERT INTO products (name, sku, barcode, "basePrice", tax, "saleType", status, "tenantId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      params = [
        productData.name,
        productData.sku,
        productData.barcode,
        productData.basePrice,
        productData.tax,
        productData.saleType,
        ProductStatus.ACTIVE,
        tenantId
      ];
    }

    const result = await dataSource.query(query, params);
    const saved = result[0] as Product;
    console.log(`  ✅ ${productData.name} (${productData.saleType})`);
    createdProducts.push(saved);
  }

  return createdProducts;
}

async function createInitialStock(
  dataSource: DataSource,
  tenantId: string,
  products: Product[]
): Promise<InventoryStock[]> {
  const stockRepository = dataSource.getRepository(InventoryStock);

  const createdStock: InventoryStock[] = [];

  for (const product of products) {
    const existing = await stockRepository.findOne({
      where: { productId: product.id, tenantId }
    });

    if (existing) {
      console.log(`  ⏭️  ${product.name} - Stock ya existe`);
      createdStock.push(existing);
      continue;
    }

    // Determinar cantidad inicial según tipo de producto
    let initialQuantity: number;
    if (product.saleType === ProductSaleType.WEIGHT) {
      initialQuantity = 50; // 50 unidades de peso (ej: 50kg)
    } else {
      initialQuantity = Math.floor(Math.random() * 80) + 20; // Entre 20 y 100 unidades
    }

    const stock = stockRepository.create({
      productId: product.id,
      productVariantId: null,
      tenantId,
      quantity: initialQuantity,
      availableQuantity: initialQuantity,
      reservedQuantity: 0,
      minStockLevel: product.saleType === ProductSaleType.WEIGHT ? 10 : 5,
      maxStockLevel: product.saleType === ProductSaleType.WEIGHT ? 100 : 150,
      reorderPoint: product.saleType === ProductSaleType.WEIGHT ? 15 : 10,
      reorderQuantity: product.saleType === ProductSaleType.WEIGHT ? 50 : 50,
      averageCost: product.basePrice * 0.6, // Asumiendo 40% de margen
      lastCost: product.basePrice * 0.6,
      totalValue: initialQuantity * (product.basePrice * 0.6),
      warehouseName: 'Principal',
    });

    const saved = await stockRepository.save(stock);
    console.log(`  ✅ ${product.name} - ${initialQuantity} unidades`);
    createdStock.push(saved);
  }

  return createdStock;
}

async function createCustomers(dataSource: DataSource, tenantId: string): Promise<Customer[]> {
  const customerRepository = dataSource.getRepository(Customer);

  const customersData = [
    // Individuales sin crédito
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1012345678',
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@email.com',
      phone: '3101234567',
      mobile: '3101234567',
      address: 'Calle 10 #20-30',
      city: 'Bogotá',
      creditEnabled: false,
    },
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1023456789',
      firstName: 'Carlos',
      lastName: 'Ramírez',
      email: 'carlos.ramirez@email.com',
      phone: '3109876543',
      mobile: '3109876543',
      address: 'Carrera 15 #40-50',
      city: 'Bogotá',
      creditEnabled: false,
    },
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1034567890',
      firstName: 'Ana',
      lastName: 'López',
      email: 'ana.lopez@email.com',
      phone: '3207654321',
      mobile: '3207654321',
      address: 'Avenida 30 #50-60',
      city: 'Bogotá',
      creditEnabled: false,
    },

    // Individuales con crédito
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1045678901',
      firstName: 'Pedro',
      lastName: 'Martínez',
      email: 'pedro.martinez@email.com',
      phone: '3156789012',
      mobile: '3156789012',
      whatsapp: '3156789012',
      address: 'Calle 50 #60-70',
      city: 'Bogotá',
      creditEnabled: true,
      creditLimit: 500000,
      creditDays: 30,
    },
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1056789012',
      firstName: 'Laura',
      lastName: 'Hernández',
      email: 'laura.hernandez@email.com',
      phone: '3165432109',
      mobile: '3165432109',
      whatsapp: '3165432109',
      address: 'Carrera 70 #80-90',
      city: 'Bogotá',
      creditEnabled: true,
      creditLimit: 300000,
      creditDays: 15,
    },

    // Empresas con crédito
    {
      type: CustomerType.BUSINESS,
      documentType: 'NIT',
      documentNumber: '900123456-1',
      firstName: 'Restaurante',
      businessName: 'Restaurante El Buen Sabor',
      email: 'contacto@buensabor.co',
      phone: '6012345678',
      mobile: '3001234567',
      whatsapp: '3001234567',
      address: 'Calle 100 #15-20',
      city: 'Bogotá',
      creditEnabled: true,
      creditLimit: 2000000,
      creditDays: 30,
    },
    {
      type: CustomerType.BUSINESS,
      documentType: 'NIT',
      documentNumber: '900234567-2',
      firstName: 'Minimarket',
      businessName: 'Minimarket La Esquina',
      email: 'ventas@laesquina.co',
      phone: '6019876543',
      mobile: '3109876543',
      address: 'Carrera 50 #30-40',
      city: 'Bogotá',
      creditEnabled: true,
      creditLimit: 1500000,
      creditDays: 15,
    },

    // Clientes para pruebas de concurrencia
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1067890123',
      firstName: 'Cliente',
      lastName: 'Concurrencia 1',
      email: 'test1@test.com',
      phone: '3001111111',
      creditEnabled: false,
    },
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1078901234',
      firstName: 'Cliente',
      lastName: 'Concurrencia 2',
      email: 'test2@test.com',
      phone: '3002222222',
      creditEnabled: false,
    },
    {
      type: CustomerType.INDIVIDUAL,
      documentType: 'CC',
      documentNumber: '1089012345',
      firstName: 'Cliente',
      lastName: 'Concurrencia 3',
      email: 'test3@test.com',
      phone: '3003333333',
      creditEnabled: false,
    },
  ];

  const createdCustomers: Customer[] = [];

  for (const customerData of customersData) {
    const existing = await customerRepository.findOne({
      where: {
        documentType: customerData.documentType,
        documentNumber: customerData.documentNumber,
        tenantId
      }
    });

    if (existing) {
      console.log(`  ⏭️  ${customerData.firstName} ${customerData.lastName || customerData.businessName || ''} - Ya existe`);
      createdCustomers.push(existing);
      continue;
    }

    const customer = customerRepository.create({
      ...customerData,
      tenantId,
      status: CustomerStatus.ACTIVE,
      creditAvailable: customerData.creditEnabled ? customerData.creditLimit : 0,
    });

    const saved = await customerRepository.save(customer);
    const creditInfo = saved.creditEnabled ? ` (Crédito: $${saved.creditLimit.toLocaleString()})` : '';
    console.log(`  ✅ ${saved.firstName} ${saved.lastName || saved.businessName || ''}${creditInfo}`);
    createdCustomers.push(saved);
  }

  return createdCustomers;
}

function printSummary(categories: Category[], products: Product[], customers: Customer[]) {
  console.log('📊 RESUMEN DE DATOS CREADOS:\n');

  console.log(`📁 Categorías (${categories.length}):`);
  categories.forEach(cat => console.log(`   - ${cat.icon} ${cat.name}`));
  console.log('');

  console.log(`📦 Productos (${products.length}):`);
  const byCategory = products.reduce((acc, p) => {
    // Note: In this seeder we don't have direct category relation,
    // but in real scenario you'd fetch category name
    const key = 'Varios';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`   - ${products.filter(p => p.saleType === ProductSaleType.UNIT).length} productos por UNIDAD`);
  console.log(`   - ${products.filter(p => p.saleType === ProductSaleType.WEIGHT).length} productos por PESO`);
  console.log('');

  console.log(`👥 Clientes (${customers.length}):`);
  console.log(`   - ${customers.filter(c => c.type === CustomerType.INDIVIDUAL).length} individuales`);
  console.log(`   - ${customers.filter(c => c.type === CustomerType.BUSINESS).length} empresas`);
  console.log(`   - ${customers.filter(c => c.creditEnabled).length} con crédito habilitado`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('💡 SIGUIENTE PASO:');
  console.log('   Ejecutar pruebas manuales siguiendo: PLAN_PRUEBAS_FLUJOS.md');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  runTestDataSeeds()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falló:', error);
      process.exit(1);
    });
}
