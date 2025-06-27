-- Update MVP Pricing for Vetify
-- This script updates the existing plans with new competitive pricing
-- 
-- Plan Changes:
-- - BASIC: 300 mascotas (was 500), 3 usuarios, $599/$399 regular pricing, $449/$349 promo
-- - PROFESSIONAL: 1000 mascotas (was 2000), 8 usuarios, $1199/$799 regular pricing, $899/$649 promo

-- Update BASIC plan with new pricing and limits
UPDATE "Plan" 
SET 
  "monthlyPrice" = 599,
  "annualPrice" = 399,
  "maxUsers" = 3,
  "maxPets" = 300,
  "features" = jsonb_set(
    jsonb_set(
      jsonb_set(
        "features",
        '{whatsappMessages}',
        '-1'
      ),
      '{automations}',
      'true'
    ),
    '{advancedReports}',
    'false'
  ),
  "updatedAt" = NOW()
WHERE "key" = 'BASIC';

-- Update PROFESSIONAL plan with new pricing and limits  
UPDATE "Plan"
SET 
  "monthlyPrice" = 1199,
  "annualPrice" = 799,
  "maxUsers" = 8,
  "maxPets" = 1000,
  "features" = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          "features",
          '{whatsappMessages}',
          '-1'
        ),
        '{automations}',
        'true'
      ),
      '{advancedReports}',
      'true'
    ),
    '{multiDoctor}',
    'true'
  ),
  "updatedAt" = NOW()
WHERE "key" = 'PROFESSIONAL';

-- Ensure FREE plan exists with correct limits
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
  "isMvp"
) VALUES (
  gen_random_uuid(),
  'FREE',
  'Plan Gratis',
  'Ideal para veterinarios independientes o consultorios muy pequeños.',
  0,
  0,
  '{
    "whatsappMessages": 50,
    "automations": false,
    "advancedReports": false,
    "multiDoctor": false,
    "smsReminders": false
  }',
  1,
  50,
  1,
  false,
  true,
  true
) ON CONFLICT ("key") DO UPDATE SET
  "monthlyPrice" = EXCLUDED."monthlyPrice",
  "annualPrice" = EXCLUDED."annualPrice", 
  "maxUsers" = EXCLUDED."maxUsers",
  "maxPets" = EXCLUDED."maxPets",
  "features" = EXCLUDED."features",
  "updatedAt" = NOW();

-- Display updated plans
SELECT 
  "key",
  "name", 
  "monthlyPrice",
  "annualPrice",
  "maxUsers",
  "maxPets",
  "features"
FROM "Plan" 
WHERE "isActive" = true
ORDER BY "monthlyPrice"; 