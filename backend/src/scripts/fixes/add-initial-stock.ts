import { DataSource } from 'typeorm';
import { InventoryStock, StockStatus } from '../../modules/inventory/entities/inventory-stock.entity';
import { InventoryMovement, MovementType } from '../../modules/inventory/entities/inventory-movement.entity';
import { Product } from '../../modules/products/entities/product.entity';

/**
 * Script to add initial stock to all products that have 0 stock
 * This is a one-time fix to ensure all products have stock for testing
 */
async function addInitialStock() {
  // Create connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nexopos',
    entities: ['src/modules/**/entities/*.entity{.ts,.js}'],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('✅ Database connected');

  try {
    // Get all products
    const productRepo = dataSource.getRepository(Product);
    const stockRepo = dataSource.getRepository(InventoryStock);
    const movementRepo = dataSource.getRepository(InventoryMovement);

    const products = await productRepo.find({
      relations: ['variants']
    });

    console.log(`📦 Found ${products.length} products`);

    let productsUpdated = 0;
    let variantsUpdated = 0;

    for (const product of products) {
      // Add stock to base product if it has no variants
      if (!product.variants || product.variants.length === 0) {
        const existingStock = await stockRepo.findOne({
          where: { productId: product.id }
        });

        if (!existingStock || existingStock.quantity === 0) {
          const initialQuantity = 100; // Default initial stock
          const unitCost = Number(product.basePrice) || 10000;

          // Create or update stock record
          let stock: InventoryStock;
          if (existingStock) {
            stock = existingStock;
          } else {
            stock = stockRepo.create({
              productId: product.id,
              quantity: 0,
              availableQuantity: 0,
              reservedQuantity: 0,
              totalValue: 0,
              status: StockStatus.OUT_OF_STOCK
            });
            stock = await stockRepo.save(stock);
          }

          // Create movement
          const movement = movementRepo.create({
            productId: product.id,
            type: MovementType.ADJUSTMENT,
            quantity: initialQuantity,
            quantityBefore: 0,
            quantityAfter: initialQuantity,
            unitCost: unitCost,
            totalCost: unitCost * initialQuantity,
            referenceType: 'initial_stock',
            referenceNumber: 'INIT-001',
            notes: 'Initial stock added by setup script',
            reason: 'Initial inventory setup',
            userId: null
          });

          await movementRepo.save(movement);

          // Update stock
          stock.quantity = initialQuantity;
          stock.availableQuantity = initialQuantity;
          stock.averageCost = unitCost;
          stock.lastCost = unitCost;
          stock.totalValue = initialQuantity * unitCost;
          stock.status = StockStatus.IN_STOCK;
          stock.lastMovementId = movement.id;
          stock.lastMovementDate = new Date();

          await stockRepo.save(stock);

          productsUpdated++;
          console.log(`  ✓ Added ${initialQuantity} units to product: ${product.name}`);
        }
      } else {
        // Add stock to each variant
        for (const variant of product.variants) {
          const existingStock = await stockRepo.findOne({
            where: { 
              productId: product.id,
              productVariantId: variant.id
            }
          });

          if (!existingStock || existingStock.quantity === 0) {
            const initialQuantity = 50; // Default initial stock for variants
            const variantPrice = Number(product.basePrice || 0) + Number(variant.priceDelta || 0);
            const unitCost = variantPrice || 10000;

            // Create or update stock record
            let stock: InventoryStock;
            if (existingStock) {
              stock = existingStock;
            } else {
              stock = stockRepo.create({
                productId: product.id,
                productVariantId: variant.id,
                quantity: 0,
                availableQuantity: 0,
                reservedQuantity: 0,
                totalValue: 0,
                status: StockStatus.OUT_OF_STOCK
              });
              stock = await stockRepo.save(stock);
            }

            // Create movement
            const movement = movementRepo.create({
              productId: product.id,
              productVariantId: variant.id,
              type: MovementType.ADJUSTMENT,
              quantity: initialQuantity,
              quantityBefore: 0,
              quantityAfter: initialQuantity,
              unitCost: unitCost,
              totalCost: unitCost * initialQuantity,
              referenceType: 'initial_stock',
              referenceNumber: 'INIT-001',
              notes: `Initial stock added for variant: ${variant.name}`,
              reason: 'Initial inventory setup',
              userId: null
            });

            await movementRepo.save(movement);

            // Update stock
            stock.quantity = initialQuantity;
            stock.availableQuantity = initialQuantity;
            stock.averageCost = unitCost;
            stock.lastCost = unitCost;
            stock.totalValue = initialQuantity * unitCost;
            stock.status = StockStatus.IN_STOCK;
            stock.lastMovementId = movement.id;
            stock.lastMovementDate = new Date();

            await stockRepo.save(stock);

            variantsUpdated++;
            console.log(`  ✓ Added ${initialQuantity} units to variant: ${product.name} - ${variant.name}`);
          }
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Products updated: ${productsUpdated}`);
    console.log(`  Variants updated: ${variantsUpdated}`);
    console.log(`  Total items updated: ${productsUpdated + variantsUpdated}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('✅ Database connection closed');
  }
}

// Run the script
addInitialStock()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
