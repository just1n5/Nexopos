import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product, ProductStatus, ProductSaleType } from '../modules/products/entities/product.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';

/**
 * Script para precargar frutas y verduras comunes en Colombia
 * Los precios están en pesos colombianos por gramo
 * 
 * Precios de referencia aproximados (pueden variar según mercado y temporada):
 * - Precio por gramo = Precio por kilo / 1000
 */

// Crear conexión directa a la base de datos
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nexopos',
  entities: [Product, ProductVariant],
  synchronize: false,
});

async function seedFruitsAndVegetables() {
  console.log('🔌 Conectando a la base de datos...');
  
  await AppDataSource.initialize();
  console.log('✅ Conectado!\n');

  const productRepository = AppDataSource.getRepository(Product);

  // Frutas comunes
  const fruits = [
    {
      name: 'Manzana',
      sku: 'FRU-MANZANA',
      description: 'Manzana fresca nacional',
      basePrice: 7000, // $7,000 por kilo (para mostrar en la UI)
      pricePerGram: 7.0, // $7 por gramo
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Banano',
      sku: 'FRU-BANANO',
      description: 'Banano maduro',
      basePrice: 3500,
      pricePerGram: 3.5,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Naranja',
      sku: 'FRU-NARANJA',
      description: 'Naranja valencia',
      basePrice: 4000,
      pricePerGram: 4.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Papaya',
      sku: 'FRU-PAPAYA',
      description: 'Papaya madura',
      basePrice: 5000,
      pricePerGram: 5.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Mango',
      sku: 'FRU-MANGO',
      description: 'Mango de azucar',
      basePrice: 6000,
      pricePerGram: 6.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Piña',
      sku: 'FRU-PINA',
      description: 'Piña gold',
      basePrice: 4500,
      pricePerGram: 4.5,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Guayaba',
      sku: 'FRU-GUAYABA',
      description: 'Guayaba pera',
      basePrice: 5500,
      pricePerGram: 5.5,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Mora',
      sku: 'FRU-MORA',
      description: 'Mora de castilla',
      basePrice: 8000,
      pricePerGram: 8.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Fresa',
      sku: 'FRU-FRESA',
      description: 'Fresa fresca',
      basePrice: 12000,
      pricePerGram: 12.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Uva',
      sku: 'FRU-UVA',
      description: 'Uva red globe',
      basePrice: 10000,
      pricePerGram: 10.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
  ];

  // Verduras y hortalizas comunes
  const vegetables = [
    {
      name: 'Tomate',
      sku: 'VER-TOMATE',
      description: 'Tomate chonto',
      basePrice: 4000,
      pricePerGram: 4.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Cebolla Cabezona',
      sku: 'VER-CEBOLLA-CAB',
      description: 'Cebolla cabezona blanca',
      basePrice: 3000,
      pricePerGram: 3.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Papa',
      sku: 'VER-PAPA',
      description: 'Papa criolla o pastusa',
      basePrice: 2500,
      pricePerGram: 2.5,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Zanahoria',
      sku: 'VER-ZANAHORIA',
      description: 'Zanahoria fresca',
      basePrice: 3500,
      pricePerGram: 3.5,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Plátano',
      sku: 'VER-PLATANO',
      description: 'Plátano verde hartón',
      basePrice: 2800,
      pricePerGram: 2.8,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Yuca',
      sku: 'VER-YUCA',
      description: 'Yuca fresca',
      basePrice: 2000,
      pricePerGram: 2.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Aguacate',
      sku: 'VER-AGUACATE',
      description: 'Aguacate hass',
      basePrice: 8000,
      pricePerGram: 8.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Lechuga',
      sku: 'VER-LECHUGA',
      description: 'Lechuga crespa',
      basePrice: 4500,
      pricePerGram: 4.5,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Cilantro',
      sku: 'VER-CILANTRO',
      description: 'Cilantro fresco',
      basePrice: 6000,
      pricePerGram: 6.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Pimentón',
      sku: 'VER-PIMENTON',
      description: 'Pimentón rojo o verde',
      basePrice: 7000,
      pricePerGram: 7.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Limón',
      sku: 'FRU-LIMON',
      description: 'Limón tahití',
      basePrice: 5000,
      pricePerGram: 5.0,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Ahuyama',
      sku: 'VER-AHUYAMA',
      description: 'Ahuyama fresca',
      basePrice: 2500,
      pricePerGram: 2.5,
      saleType: ProductSaleType.WEIGHT,
      status: ProductStatus.ACTIVE,
    },
  ];

  const allProducts = [...fruits, ...vegetables];

  console.log('🌱 Iniciando carga de frutas y verduras...\n');
  
  let created = 0;
  let skipped = 0;

  for (const productData of allProducts) {
    try {
      // Verificar si el producto ya existe por SKU
      const existing = await productRepository.findOne({
        where: { sku: productData.sku }
      });

      if (existing) {
        console.log(`⏭️  Producto ya existe: ${productData.name} (${productData.sku})`);
        skipped++;
        continue;
      }

      // Crear el producto
      const product = productRepository.create(productData);
      await productRepository.save(product);
      console.log(`✅ Creado: ${productData.name} - $${productData.pricePerGram}/g ($${productData.basePrice}/kg)`);
      created++;
    } catch (error) {
      console.error(`❌ Error creando ${productData.name}:`, error.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resumen de carga:');
  console.log(`   ✅ Productos creados: ${created}`);
  console.log(`   ⏭️  Productos omitidos (ya existían): ${skipped}`);
  console.log(`   📦 Total procesados: ${allProducts.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✨ Carga completada exitosamente!\n');

  await AppDataSource.destroy();
  console.log('👋 Conexión cerrada');

  return { created, skipped, total: allProducts.length };
}

// Ejecutar
seedFruitsAndVegetables()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error durante la carga:', error);
    process.exit(1);
  });
