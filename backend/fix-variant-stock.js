const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nexopos',
  user: 'nexopos_user',
  password: 'nexopos123'
});

async function fixVariantStock() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Buscar productos "burbuja jet" y "chocolatina"
    const productsResult = await client.query(`
      SELECT p.id, p.name, pv.id as variant_id, pv.name as variant_name
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv."productId"
      WHERE LOWER(p.name) LIKE '%burbuja%' OR LOWER(p.name) LIKE '%chocolat%'
      ORDER BY p.name
    `);

    console.log(`📦 Productos encontrados: ${productsResult.rows.length}\n`);

    for (const row of productsResult.rows) {
      console.log(`\n🔍 Procesando: ${row.name} (Variante: ${row.variant_name || 'Sin variante'})`);
      console.log(`   Product ID: ${row.id}`);
      console.log(`   Variant ID: ${row.variant_id || 'N/A'}`);

      // Buscar registros de stock para este producto
      const stockResult = await client.query(`
        SELECT id, "productId", "productVariantId", quantity, "availableQuantity"
        FROM inventory_stock
        WHERE "productId" = $1
        ORDER BY "createdAt" DESC
      `, [row.id]);

      console.log(`   📊 Registros de stock encontrados: ${stockResult.rows.length}`);

      if (stockResult.rows.length === 0) {
        console.log(`   ⚠️  No hay registros de stock para este producto`);
        continue;
      }

      // Mostrar todos los registros de stock
      for (const stock of stockResult.rows) {
        console.log(`      - Stock ID: ${stock.id}`);
        console.log(`        Variant ID: ${stock.productVariantId || 'NULL'}`);
        console.log(`        Cantidad: ${stock.quantity}`);
      }

      // Si el producto tiene variante pero hay stock sin variantId
      if (row.variant_id) {
        const stockWithoutVariant = stockResult.rows.find(s => !s.productVariantId);
        const stockWithVariant = stockResult.rows.find(s => s.productVariantId === row.variant_id);

        if (stockWithoutVariant) {
          console.log(`\n   🔧 Encontrado stock sin variant_id con cantidad: ${stockWithoutVariant.quantity}`);

          if (stockWithVariant) {
            // Ya existe stock con variant, sumar las cantidades y eliminar el sin variant
            const totalQuantity = parseFloat(stockWithVariant.quantity) + parseFloat(stockWithoutVariant.quantity);

            console.log(`   ➕ Sumando stock: ${stockWithVariant.quantity} + ${stockWithoutVariant.quantity} = ${totalQuantity}`);

            await client.query(`
              UPDATE inventory_stock
              SET quantity = $1, "availableQuantity" = $1, "updatedAt" = NOW()
              WHERE id = $2
            `, [totalQuantity, stockWithVariant.id]);

            await client.query(`
              DELETE FROM inventory_stock WHERE id = $1
            `, [stockWithoutVariant.id]);

            console.log(`   ✅ Stock consolidado y registro sin variant eliminado`);
          } else {
            // No existe stock con variant, actualizar el existente
            console.log(`   🔄 Actualizando stock sin variant para incluir variant_id`);

            await client.query(`
              UPDATE inventory_stock
              SET "productVariantId" = $1, "updatedAt" = NOW()
              WHERE id = $2
            `, [row.variant_id, stockWithoutVariant.id]);

            console.log(`   ✅ Stock actualizado con variant_id`);
          }
        } else {
          console.log(`   ✅ Stock ya tiene variant_id correcto`);
        }
      }
    }

    console.log('\n✅ Corrección completada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixVariantStock();
