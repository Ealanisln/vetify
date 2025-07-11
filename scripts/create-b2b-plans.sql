-- ================================================================
-- CREAR PLANES B2B - VETIFY
-- ================================================================

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

-- Mostrar los planes creados
SELECT 
  "name" as plan_name,
  "key" as plan_key,
  "monthlyPrice" as monthly_price,
  "annualPrice" as annual_price,
  "maxUsers" as max_users,
  "maxPets" as max_pets
FROM "Plan"
WHERE "key" IN ('PROFESIONAL', 'CLINICA', 'EMPRESA')
ORDER BY "monthlyPrice" ASC; 