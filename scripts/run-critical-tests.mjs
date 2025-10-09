#!/usr/bin/env node

/**
 * Run Critical Production Tests
 *
 * This script runs only the most critical tests that must pass
 * before deploying to production.
 *
 * Usage: node scripts/run-critical-tests.mjs
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

const criticalTests = [
  {
    name: 'Trial Activation',
    command: 'pnpm',
    args: ['test', '__tests__/integration/subscription/trial-activation.test.ts'],
    required: true,
  },
  {
    name: 'Multi-Tenancy Data Isolation',
    command: 'pnpm',
    args: ['test', '__tests__/integration/multi-tenancy/data-isolation.test.ts'],
    required: true,
  },
  {
    name: 'Security Tests',
    command: 'pnpm',
    args: ['test:security'],
    required: true,
  },
  {
    name: 'Authentication Tests',
    command: 'pnpm',
    args: ['test', '__tests__/unit/lib/auth.test.ts'],
    required: true,
  },
  {
    name: 'Component Tests',
    command: 'pnpm',
    args: ['test:components'],
    required: false,
  },
];

function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\n🧪 Running: ${test.name}...`));

    const child = spawn(test.command, test.args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${test.name} passed`));
        resolve();
      } else {
        const error = new Error(`${test.name} failed with code ${code}`);
        error.test = test;
        error.code = code;
        reject(error);
      }
    });

    child.on('error', (error) => {
      console.error(chalk.red(`❌ Error running ${test.name}:`), error);
      reject(error);
    });
  });
}

async function runCriticalTests() {
  console.log(chalk.bold.cyan('\n🚀 Running Critical Production Tests\n'));
  console.log(chalk.gray('=' .repeat(50)));

  const results = {
    passed: [],
    failed: [],
    skipped: [],
  };

  let hasRequiredFailures = false;

  for (const test of criticalTests) {
    try {
      await runTest(test);
      results.passed.push(test.name);
    } catch (error) {
      results.failed.push({
        name: test.name,
        required: test.required,
        error: error.message,
      });

      if (test.required) {
        hasRequiredFailures = true;
      }
    }
  }

  // Print summary
  console.log(chalk.gray('\n' + '='.repeat(50)));
  console.log(chalk.bold.cyan('\n📊 Test Summary\n'));

  if (results.passed.length > 0) {
    console.log(chalk.green(`✅ Passed (${results.passed.length}):`));
    results.passed.forEach((name) => {
      console.log(chalk.green(`   • ${name}`));
    });
  }

  if (results.failed.length > 0) {
    console.log(chalk.red(`\n❌ Failed (${results.failed.length}):`));
    results.failed.forEach((failure) => {
      const icon = failure.required ? '🚫' : '⚠️';
      const label = failure.required ? 'REQUIRED' : 'OPTIONAL';
      console.log(chalk.red(`   ${icon} ${failure.name} (${label})`));
    });
  }

  console.log(chalk.gray('\n' + '='.repeat(50)));

  // Final verdict
  if (hasRequiredFailures) {
    console.log(
      chalk.bold.red(
        '\n❌ CRITICAL TESTS FAILED - DO NOT DEPLOY TO PRODUCTION\n'
      )
    );
    console.log(
      chalk.yellow(
        '⚠️  Please fix the failing tests before deploying.\n'
      )
    );
    process.exit(1);
  } else if (results.failed.length > 0) {
    console.log(
      chalk.bold.yellow(
        '\n⚠️  Some optional tests failed, but deployment is allowed.\n'
      )
    );
    console.log(
      chalk.gray(
        '💡 Consider fixing these tests before your next deployment.\n'
      )
    );
    process.exit(0);
  } else {
    console.log(
      chalk.bold.green(
        '\n✅ ALL CRITICAL TESTS PASSED - SAFE TO DEPLOY\n'
      )
    );
    process.exit(0);
  }
}

// Run tests
runCriticalTests().catch((error) => {
  console.error(chalk.red('\n❌ Unexpected error:'), error);
  process.exit(1);
});
