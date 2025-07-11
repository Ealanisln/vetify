-- ================================================================
-- MIGRACIÓN A PRICING B2B - VETIFY
-- ================================================================
-- Este script migra usuarios existentes del sistema actual a la nueva
-- estructura de precios B2B (PROFESIONAL, CLINICA, EMPRESA)
-- 
-- MAPEO DE MIGRACIÓN:
-- FREE → PROFESIONAL (con trial)
-- STARTER → PROFESIONAL 
-- STANDARD → CLINICA
-- PROFESSIONAL → EMPRESA
-- 
-- IMPORTANTE: Ejecutar en orden y con backup previo
-- ================================================================

-- Paso 1: Crear nuevos planes B2B si no existen
-- ================================================================

-- Eliminar planes existentes si existen (solo para testing)
-- DELETE FROM "Plan" WHERE "key" IN ('PROFESIONAL', 'CLINICA', 'EMPRESA');

-- Plan PROFESIONAL
INSERT INTO "Plan" (
  "id",
  "key", 
  "name", 
  "description",
  "monthlyPrice", 
  "annualPrice",
  "features",
  "maxUsers",
  "maxPets", 
  "storageGB",
  "isRecommended",
  "isActive",
  "isMvp",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'PROFESIONAL',
  'Plan Profesional',
  'Ideal para clínicas establecidas que buscan profesionalizar su operación.',
  599,
  479,
  '{
    "whatsappMessages": -1,
    "automations": true,
    "advancedReports": false,
    "multiDoctor": true,
    "smsReminders": true,
    "apiAccess": false
  }',
  3,
  300,
  5,
  false,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "monthlyPrice" = EXCLUDED."monthlyPrice",
  "annualPrice" = EXCLUDED."annualPrice",
  "features" = EXCLUDED."features",
  "maxUsers" = EXCLUDED."maxUsers",
  "maxPets" = EXCLUDED."maxPets",
  "storageGB" = EXCLUDED."storageGB",
  "updatedAt" = NOW();

-- Plan CLINICA
INSERT INTO "Plan" (
  "id",
  "key", 
  "name", 
  "description",
  "monthlyPrice", 
  "annualPrice",
  "features",
  "maxUsers",
  "maxPets", 
  "storageGB",
  "isRecommended",
  "isActive",
  "isMvp",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'CLINICA',
  'Plan Clínica',
  'Perfecto para clínicas en crecimiento con múltiples sucursales.',
  999,
  799,
  '{
    "whatsappMessages": -1,
    "automations": true,
    "advancedReports": true,
    "multiDoctor": true,
    "smsReminders": true,
    "apiAccess": false
  }',
  8,
  1000,
  20,
  true,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "monthlyPrice" = EXCLUDED."monthlyPrice",
  "annualPrice" = EXCLUDED."annualPrice",
  "features" = EXCLUDED."features",
  "maxUsers" = EXCLUDED."maxUsers",
  "maxPets" = EXCLUDED."maxPets",
  "storageGB" = EXCLUDED."storageGB",
  "updatedAt" = NOW();

-- Plan EMPRESA
INSERT INTO "Plan" (
  "id",
  "key", 
  "name", 
  "description",
  "monthlyPrice", 
  "annualPrice",
  "features",
  "maxUsers",
  "maxPets", 
  "storageGB",
  "isRecommended",
  "isActive",
  "isMvp",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'EMPRESA',
  'Plan Empresa',
  'Solución integral para grandes organizaciones veterinarias.',
  1799,
  1439,
  '{
    "whatsappMessages": -1,
    "automations": true,
    "advancedReports": true,
    "multiDoctor": true,
    "smsReminders": true,
    "apiAccess": true
  }',
  20,
  -1,
  100,
  false,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "monthlyPrice" = EXCLUDED."monthlyPrice",
  "annualPrice" = EXCLUDED."annualPrice",
  "features" = EXCLUDED."features",
  "maxUsers" = EXCLUDED."maxUsers",
  "maxPets" = EXCLUDED."maxPets",
  "storageGB" = EXCLUDED."storageGB",
  "updatedAt" = NOW();

-- Paso 2: Migrar suscripciones existentes a nuevos planes
-- ================================================================

-- Crear tabla temporal para mapear las migraciones
CREATE TEMP TABLE plan_migration_mapping AS
SELECT 
  old_plan.id as old_plan_id,
  old_plan.key as old_plan_key,
  new_plan.id as new_plan_id,
  new_plan.key as new_plan_key
FROM "Plan" old_plan
LEFT JOIN "Plan" new_plan ON (
  CASE 
    WHEN old_plan.key IN ('FREE', 'STARTER') THEN 'PROFESIONAL'
    WHEN old_plan.key = 'STANDARD' THEN 'CLINICA'
    WHEN old_plan.key = 'PROFESSIONAL' THEN 'EMPRESA'
    ELSE null
  END
) = new_plan.key
WHERE old_plan.key IN ('FREE', 'STARTER', 'STANDARD', 'PROFESSIONAL')
  AND new_plan.key IS NOT NULL;

-- Actualizar TenantSubscription con nuevos planes
UPDATE "TenantSubscription" 
SET 
  "planId" = pmm.new_plan_id,
  "updatedAt" = NOW()
FROM plan_migration_mapping pmm
WHERE "TenantSubscription"."planId" = pmm.old_plan_id;

-- Paso 3: Migrar Tenants con planType directo (sin suscripción)
-- ================================================================

-- Actualizar planType en Tenant para usuarios sin suscripción
UPDATE "Tenant" 
SET 
  "planType" = CASE 
    WHEN "planType" = 'BASIC' THEN 'PROFESIONAL'::"PlanType"
    WHEN "planType" = 'STANDARD' THEN 'CLINICA'::"PlanType"  
    WHEN "planType" = 'PREMIUM' THEN 'EMPRESA'::"PlanType"
    WHEN "planType" = 'ENTERPRISE' THEN 'EMPRESA'::"PlanType"
    ELSE 'PROFESIONAL'::"PlanType"
  END,
  "updatedAt" = NOW()
WHERE "planType" IN ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- Paso 4: Activar trial de 30 días para usuarios FREE/STARTER
-- ================================================================

-- Activar trial para usuarios que migran desde FREE o STARTER
UPDATE "Tenant" 
SET 
  "isTrialPeriod" = true,
  "trialEndsAt" = NOW() + INTERVAL '30 days',
  "updatedAt" = NOW()
WHERE "id" IN (
  SELECT t."id" 
  FROM "Tenant" t
  LEFT JOIN "TenantSubscription" ts ON t."id" = ts."tenantId"
  LEFT JOIN "Plan" p ON ts."planId" = p."id"
  WHERE p."key" IN ('FREE', 'STARTER') 
     OR (ts."planId" IS NULL AND t."planType" = 'PROFESIONAL')
);

-- Paso 5: Limpiar planes antiguos (OPCIONAL - comentado por seguridad)
-- ================================================================

-- CUIDADO: Solo ejecutar después de verificar que la migración fue exitosa
-- DELETE FROM "Plan" WHERE "key" IN ('FREE', 'STARTER', 'STANDARD', 'PROFESSIONAL') AND "key" NOT IN ('PROFESIONAL', 'CLINICA', 'EMPRESA');

-- Paso 6: Estadísticas de migración
-- ================================================================

-- Mostrar estadísticas de la migración
SELECT 
  'Migración completada' as status,
  COUNT(*) as total_tenants,
  COUNT(CASE WHEN "planType" = 'PROFESIONAL' THEN 1 END) as profesional_count,
  COUNT(CASE WHEN "planType" = 'CLINICA' THEN 1 END) as clinica_count,
  COUNT(CASE WHEN "planType" = 'EMPRESA' THEN 1 END) as empresa_count,
  COUNT(CASE WHEN "isTrialPeriod" = true THEN 1 END) as trial_count
FROM "Tenant";

-- Mostrar suscripciones por plan
SELECT 
  p."name" as plan_name,
  p."key" as plan_key,
  COUNT(ts."id") as subscription_count
FROM "Plan" p
LEFT JOIN "TenantSubscription" ts ON p."id" = ts."planId"
WHERE p."key" IN ('PROFESIONAL', 'CLINICA', 'EMPRESA')
GROUP BY p."name", p."key"
ORDER BY subscription_count DESC;

-- ================================================================
-- NOTAS IMPORTANTES:
-- 1. Backup de la base de datos antes de ejecutar
-- 2. Ejecutar en staging primero
-- 3. Verificar que no hay errores en cada paso
-- 4. Los usuarios FREE/STARTER obtienen 30 días de trial
-- 5. Precios grandfathering se aplicarán por 12 meses
-- ================================================================ 