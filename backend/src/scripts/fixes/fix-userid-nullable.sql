-- Migration to make userId nullable in inventory_movements
ALTER TABLE inventory_movements ALTER COLUMN "userId" DROP NOT NULL;
