-- Agregar columna referenceNumber si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'inventory_movements'
        AND column_name = 'referenceNumber'
    ) THEN
        ALTER TABLE inventory_movements
        ADD COLUMN "referenceNumber" VARCHAR;

        RAISE NOTICE 'Columna referenceNumber agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna referenceNumber ya existe';
    END IF;
END $$;
