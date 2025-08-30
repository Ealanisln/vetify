-- Script para actualizar precios MVP en la base de datos local
-- Este script actualiza los precios de los planes B2B según la nueva estructura

-- Actualizar precios del Plan Profesional B2B
UPDATE "TenantSubscription" 
SET 
  "stripePriceId" = 'price_1RjWSPPwxz1bHxlHpLCiifxS', -- Precio anual actualizado
  "planKey" = 'PROFESIONAL',
  "billingInterval" = 'annual',
  "amount" = 575000, -- $5,750 MXN en centavos
  "currency" = 'mxn',
  "updatedAt" = NOW()
WHERE "planKey" = 'PROFESIONAL' AND "billingInterval" = 'annual';

-- Actualizar precios del Plan Clínica B2B
UPDATE "TenantSubscription" 
SET 
  "stripePriceId" = 'price_1RjWSQPwxz1bHxlHZSALMZUr', -- Precio anual actualizado
  "planKey" = 'CLINICA',
  "billingInterval" = 'annual',
  "amount" = 959000, -- $9,590 MXN en centavos
  "currency" = 'mxn',
  "updatedAt" = NOW()
WHERE "planKey" = 'CLINICA' AND "billingInterval" = 'annual';

-- Actualizar precios del Plan Empresa B2B
UPDATE "TenantSubscription" 
SET 
  "stripePriceId" = 'price_1RjWSRPwxz1bHxlHR5zX9CCQ', -- Precio anual actualizado
  "planKey" = 'EMPRESA',
  "billingInterval" = 'annual',
  "amount" = 1727000, -- $17,270 MXN en centavos
  "currency" = 'mxn',
  "updatedAt" = NOW()
WHERE "planKey" = 'EMPRESA' AND "billingInterval" = 'annual';

-- Verificar los cambios
SELECT 
  "planKey",
  "billingInterval",
  "amount",
  "currency",
  "stripePriceId",
  "updatedAt"
FROM "TenantSubscription" 
WHERE "planKey" IN ('PROFESIONAL', 'CLINICA', 'EMPRESA')
ORDER BY "planKey", "billingInterval"; 