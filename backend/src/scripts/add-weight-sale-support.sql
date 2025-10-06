-- Migration to add support for products sold by weight
-- Run this in your PostgreSQL database

-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sale_type VARCHAR(10) DEFAULT 'UNIT' CHECK (sale_type IN ('UNIT', 'WEIGHT')),
ADD COLUMN IF NOT EXISTS price_per_gram DECIMAL(12,4) NULL;

-- Create enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE product_sale_type_enum AS ENUM ('UNIT', 'WEIGHT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing products to use the enum
ALTER TABLE products 
ALTER COLUMN sale_type TYPE product_sale_type_enum USING sale_type::product_sale_type_enum;

-- Add comment for documentation
COMMENT ON COLUMN products.sale_type IS 'Type of sale: UNIT (sold by unit) or WEIGHT (sold by weight in grams)';
COMMENT ON COLUMN products.price_per_gram IS 'Price per gram for products sold by weight';
