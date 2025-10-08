#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Simple dotenv replacement
function loadEnvFile() {
  try {
    const envFile = readFileSync('.env.local', 'utf8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length) {
        envVars[key.trim()] = value.join('=').trim();
      }
    });
    return envVars;
  } catch {
    return {};
  }
}

const envVars = loadEnvFile();

// Simple chalk replacement
const chalk = {
  blue: { bold: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m` },
  yellow: { bold: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m` },
  cyan: { bold: (text) => `\x1b[1m\x1b[36m${text}\x1b[0m` },
  green: { bold: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m` },
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

console.log(chalk.blue.bold('🔍 WEBHOOK CONFIGURATION DEBUGGER'));
console.log('=====================================\n');

// Check environment variables
console.log(chalk.yellow.bold('1. Environment Variables Check:'));
const requiredVars = {
  'STRIPE_SECRET_KEY': envVars.STRIPE_SECRET_KEY,
  'STRIPE_PUBLISHABLE_KEY': envVars.STRIPE_PUBLISHABLE_KEY,
  'STRIPE_WEBHOOK_SECRET': envVars.STRIPE_WEBHOOK_SECRET,
  'NEXT_PUBLIC_BASE_URL': envVars.NEXT_PUBLIC_BASE_URL
};

for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    console.log(chalk.green(`✅ ${key}: ${key.includes('SECRET') ? 'SET (hidden)' : value}`));
  } else {
    console.log(chalk.red(`❌ ${key}: NOT SET`));
  }
}

console.log('\n' + chalk.yellow.bold('2. Webhook Endpoint Check:'));
const baseUrl = envVars.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const webhookUrl = `${baseUrl}/api/stripe/webhook`;
console.log(chalk.blue(`Webhook URL: ${webhookUrl}`));

// Check if server is running
try {
  const response = await fetch(webhookUrl, { method: 'POST' });
  console.log(chalk.green(`✅ Webhook endpoint is accessible (status: ${response.status})`));
} catch (error) {
  console.log(chalk.red(`❌ Webhook endpoint not accessible: ${error.message}`));
}

console.log('\n' + chalk.yellow.bold('3. Stripe CLI Status:'));
try {
  const stripeVersion = execSync('stripe version', { encoding: 'utf8' });
  console.log(chalk.green(`✅ Stripe CLI installed: ${stripeVersion.trim()}`));
  
  try {
    const loginStatus = execSync('stripe config --list', { encoding: 'utf8' });
    console.log(chalk.green('✅ Stripe CLI is configured'));
  } catch {
    console.log(chalk.yellow('⚠️  Stripe CLI not logged in. Run: stripe login'));
  }
} catch {
  console.log(chalk.red('❌ Stripe CLI not installed'));
  console.log(chalk.blue('📥 Install from: https://stripe.com/docs/stripe-cli'));
}

console.log('\n' + chalk.yellow.bold('4. Webhook Setup Instructions:'));
console.log(chalk.blue('For local development, choose ONE option:'));
console.log('\n' + chalk.cyan.bold('Option A: Stripe CLI (Recommended)'));
console.log('1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
console.log('2. Login: stripe login');
console.log(`3. Forward webhooks: stripe listen --forward-to ${webhookUrl}`);
console.log('4. Copy the webhook secret (whsec_...) to your .env.local');

console.log('\n' + chalk.cyan.bold('Option B: ngrok'));
console.log('1. Install ngrok: https://ngrok.com/download');
console.log('2. Run: ngrok http 3000');
console.log('3. Update NEXT_PUBLIC_BASE_URL to use the ngrok URL');
console.log('4. Configure webhook in Stripe Dashboard with ngrok URL');

console.log('\n' + chalk.cyan.bold('Option C: Skip webhooks (Development only)'));
console.log('Manual sync fallback is now implemented in checkout');

console.log('\n' + chalk.yellow.bold('5. Stripe Dashboard Configuration:'));
console.log('Go to: https://dashboard.stripe.com/webhooks');
console.log('Events to listen for:');
console.log('  - checkout.session.completed');
console.log('  - customer.subscription.updated');
console.log('  - customer.subscription.deleted');
console.log('  - invoice.payment_succeeded');
console.log('  - invoice.payment_failed');

console.log('\n' + chalk.green.bold('✨ Webhook debugging complete!'));
console.log(chalk.blue('If issues persist, check the server logs for webhook attempts.')); 