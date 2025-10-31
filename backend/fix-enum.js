#!/usr/bin/env node

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('Skipping enum migration: DATABASE_URL not set.');
  process.exit(0);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixEnum() {
  try {
    console.log('Starting enum migration...');

    // Array of enum values to add
    const enumValues = [
      { value: 'INITIAL', position: 'BEFORE \'IN\'' },
      { value: 'RETURN_CUSTOMER', position: 'AFTER \'SALE\'' },
      { value: 'RETURN_SUPPLIER', position: 'AFTER \'RETURN_CUSTOMER\'' },
      { value: 'ADJUSTMENT', position: 'AFTER \'RETURN_SUPPLIER\'' },
      { value: 'DAMAGE', position: 'AFTER \'TRANSFER_OUT\'' },
      { value: 'EXPIRY', position: 'AFTER \'DAMAGE\'' },
    ];

    for (const enumValue of enumValues) {
      try {
        const query = `
          ALTER TYPE public.movement_type_enum
          ADD VALUE '${enumValue.value}' ${enumValue.position};
        `;
        console.log(`Adding enum value: ${enumValue.value}`);
        await pool.query(query);
        console.log(`✓ Successfully added ${enumValue.value}`);
      } catch (error) {
        // If value already exists, it's fine
        if (error.message.includes('already exists')) {
          console.log(`⚠ ${enumValue.value} already exists (skipping)`);
        } else {
          throw error;
        }
      }
    }

    console.log('✓ Enum migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during enum migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixEnum();
