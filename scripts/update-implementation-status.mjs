#!/usr/bin/env node

/**
 * Implementation Status Checker and Updater
 * 
 * This script checks the current implementation status of the onboarding flow
 * and updates the todo list accordingly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(__dirname, '..', filePath));
  } catch (error) {
    return false;
  }
}

// Check if directory exists
function directoryExists(dirPath) {
  try {
    return fs.existsSync(path.join(__dirname, '..', dirPath)) && 
           fs.statSync(path.join(__dirname, '..', dirPath)).isDirectory();
  } catch (error) {
    return false;
  }
}

// Check if file contains specific content
function fileContains(filePath, searchString) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) return false;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.includes(searchString);
  } catch (error) {
    return false;
  }
}

// Implementation status checks
const checks = {
  // Phase 1: Database & Core Setup
  'run-b2b-plans-sql': {
    description: 'B2B Plans seeded in database',
    check: () => fileExists('scripts/create-b2b-plans.sql'),
    priority: 'critical'
  },
  'add-trial-fields': {
    description: 'Trial and billing fields added to schema',
    check: () => fileContains('prisma/schema.prisma', 'isTrialPeriod') && 
                 fileContains('prisma/schema.prisma', 'trialEndsAt'),
    priority: 'high'
  },
  'trial-utilities': {
    description: 'Trial management utilities created',
    check: () => fileExists('src/lib/trial-management.ts') || 
                 fileExists('src/lib/billing-utils.ts'),
    priority: 'high'
  },

  // Phase 2: Trial Onboarding
  'multistep-components': {
    description: 'Multi-step onboarding components',
    check: () => directoryExists('src/app/onboarding/steps') &&
                 fileExists('src/app/onboarding/steps/PlanSelection.tsx'),
    priority: 'high'
  },
  'onboarding-progress': {
    description: 'Onboarding progress component',
    check: () => fileExists('src/components/onboarding/OnboardingProgress.tsx'),
    priority: 'medium'
  },
  'onboarding-types': {
    description: 'Onboarding types defined',
    check: () => fileExists('src/types/onboarding.ts'),
    priority: 'medium'
  },

  // Phase 3: Trial Management System
  'trial-status-api': {
    description: 'Trial status API endpoint',
    check: () => fileExists('src/app/api/subscription/status/route.ts'),
    priority: 'high'
  },
  'trial-banner': {
    description: 'Trial banner component',
    check: () => fileExists('src/components/subscription/TrialBanner.tsx'),
    priority: 'high'
  },

  // Phase 4: Billing Conversion
  'subscription-upgrade-api': {
    description: 'Subscription upgrade API',
    check: () => fileExists('src/app/api/subscription/upgrade/route.ts'),
    priority: 'critical'
  },
  'trial-upgrade-ui': {
    description: 'Trial upgrade UI component',
    check: () => fileExists('src/components/subscription/TrialUpgrade.tsx'),
    priority: 'high'
  },

  // Existing Infrastructure
  'onboarding-api': {
    description: 'Base onboarding API exists',
    check: () => fileExists('src/app/api/onboarding/route.ts'),
    priority: 'completed'
  },
  'plans-api': {
    description: 'Plans API endpoint exists',
    check: () => fileExists('src/app/api/onboarding/plans/route.ts'),
    priority: 'completed'
  },
  'pricing-config': {
    description: 'Pricing configuration exists',
    check: () => fileExists('src/lib/pricing-config.ts'),
    priority: 'completed'
  },
  'stripe-integration': {
    description: 'Stripe integration exists',
    check: () => fileExists('src/lib/payments/stripe.ts') || 
                 fileExists('src/lib/stripe.ts'),
    priority: 'completed'
  }
};

// Check implementation status
function checkImplementationStatus() {
  console.log('🔍 Checking Onboarding Flow Implementation Status...\n');
  
  const results = {};
  let totalChecks = 0;
  let passedChecks = 0;
  
  // Group checks by phase
  const phases = {
    'Phase 1 - Database & Core': ['run-b2b-plans-sql', 'add-trial-fields', 'trial-utilities'],
    'Phase 2 - Onboarding UI': ['multistep-components', 'onboarding-progress', 'onboarding-types'],
    'Phase 3 - Trial Management': ['trial-status-api', 'trial-banner'],
    'Phase 4 - Billing Conversion': ['subscription-upgrade-api', 'trial-upgrade-ui'],
    'Existing Infrastructure': ['onboarding-api', 'plans-api', 'pricing-config', 'stripe-integration']
  };

  for (const [phaseName, checkIds] of Object.entries(phases)) {
    console.log(`\n📋 ${phaseName}`);
    console.log('─'.repeat(50));
    
    for (const checkId of checkIds) {
      const check = checks[checkId];
      if (!check) continue;
      
      totalChecks++;
      const passed = check.check();
      if (passed) passedChecks++;
      
      const status = passed ? '✅' : '❌';
      const priority = check.priority === 'critical' ? '🔥' : 
                      check.priority === 'high' ? '⚠️' : 
                      check.priority === 'completed' ? '✨' : '📝';
      
      console.log(`${status} ${priority} ${check.description}`);
      
      results[checkId] = {
        ...check,
        passed,
        phase: phaseName
      };
    }
  }

  // Summary
  const progressPercentage = (passedChecks / totalChecks * 100).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log(`📊 IMPLEMENTATION PROGRESS: ${progressPercentage}% (${passedChecks}/${totalChecks})`);
  console.log('='.repeat(60));

  // Next Steps
  const failedCritical = Object.entries(results)
    .filter(([_, result]) => !result.passed && result.priority === 'critical')
    .map(([id, result]) => result.description);

  const failedHigh = Object.entries(results)
    .filter(([_, result]) => !result.passed && result.priority === 'high')
    .map(([id, result]) => result.description);

  if (failedCritical.length > 0) {
    console.log('\n🚨 CRITICAL MISSING ITEMS:');
    failedCritical.forEach(desc => console.log(`   • ${desc}`));
  }

  if (failedHigh.length > 0) {
    console.log('\n⚠️ HIGH PRIORITY MISSING ITEMS:');
    failedHigh.forEach(desc => console.log(`   • ${desc}`));
  }

  // Recommendations
  console.log('\n💡 NEXT STEPS:');
  if (!results['run-b2b-plans-sql']?.passed) {
    console.log('   1. Run B2B plans migration: `node scripts/create-b2b-plans.sql`');
  }
  if (!results['add-trial-fields']?.passed) {
    console.log('   2. Add trial fields to Prisma schema');
  }
  if (!results['trial-status-api']?.passed) {
    console.log('   3. Create trial status API endpoint');
  }
  if (!results['subscription-upgrade-api']?.passed) {
    console.log('   4. Implement subscription upgrade API');
  }

  return results;
}

// Generate implementation report
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      total: Object.keys(results).length,
      completed: Object.values(results).filter(r => r.passed).length,
      pending: Object.values(results).filter(r => !r.passed).length,
      progress: (Object.values(results).filter(r => r.passed).length / Object.keys(results).length * 100).toFixed(1)
    },
    results
  };

  const reportPath = path.join(__dirname, '..', 'docs', 'implementation-status.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: docs/implementation-status.json`);
  return report;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = checkImplementationStatus();
  generateReport(results);
}