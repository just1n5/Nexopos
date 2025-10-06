-- Script para habilitar crédito en un cliente específico
-- Reemplaza el ID con el ID de tu cliente

UPDATE customers
SET
  "creditEnabled" = true,
  "creditLimit" = 500000,  -- Límite de $500,000 COP
  "creditAvailable" = 500000,
  "creditDays" = 30
WHERE id = '55c21294-5a9d-49b0-998c-063adb60a3f0';

-- Verificar el cambio
SELECT
  id,
  "firstName",
  "lastName",
  "creditEnabled",
  "creditLimit",
  "creditAvailable",
  "creditUsed",
  balance
FROM customers
WHERE id = '55c21294-5a9d-49b0-998c-063adb60a3f0';
