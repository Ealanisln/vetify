#!/usr/bin/env node

/**
 * Sentry Logging Control Script
 * 
 * This script helps manage Sentry logging levels to reduce console noise.
 * 
 * Usage:
 * - pnpm run sentry:quiet    # Set minimal logging (errors only)
 * - pnpm run sentry:normal   # Set normal logging (warnings + errors)
 * - pnpm run sentry:verbose  # Set verbose logging (all levels)
 * - pnpm run sentry:debug    # Enable debug mode for troubleshooting
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_FILE = '.env.local';
const ENV_FILE_BACKUP = '.env.local.backup';

const LOG_LEVELS = {
  quiet: 'error',      // Only errors
  normal: 'warn',      // Warnings + errors
  verbose: 'info',     // Info + warnings + errors
  debug: 'debug'       // All levels + debug mode
};

function backupEnvFile() {
  if (existsSync(ENV_FILE)) {
    const content = readFileSync(ENV_FILE, 'utf8');
    writeFileSync(ENV_FILE_BACKUP, content);
    console.log(`✅ Backed up ${ENV_FILE} to ${ENV_FILE_BACKUP}`);
  }
}

function updateEnvFile(logLevel, debugMode = false) {
  const envPath = join(process.cwd(), ENV_FILE);
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  }
  
  // Update or add Sentry logging controls
  const sentryLogLevelLine = `SENTRY_LOG_LEVEL=${logLevel}`;
  const sentryDebugLine = `SENTRY_DEBUG=${debugMode}`;
  
  // Remove existing Sentry logging lines if they exist
  const lines = envContent.split('\n').filter(line => 
    !line.startsWith('SENTRY_LOG_LEVEL=') && 
    !line.startsWith('SENTRY_DEBUG=')
  );
  
  // Add new Sentry logging lines
  lines.push(sentryLogLevelLine);
  lines.push(sentryDebugLine);
  
  // Write updated content
  writeFileSync(envPath, lines.join('\n') + '\n');
  
  console.log(`✅ Updated ${ENV_FILE} with Sentry logging controls:`);
  console.log(`   SENTRY_LOG_LEVEL=${logLevel}`);
  console.log(`   SENTRY_DEBUG=${debugMode}`);
}

function showCurrentStatus() {
  const envPath = join(process.cwd(), ENV_FILE);
  
  if (!existsSync(envPath)) {
    console.log('❌ No .env.local file found');
    return;
  }
  
  const envContent = readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const logLevel = lines.find(line => line.startsWith('SENTRY_LOG_LEVEL='))?.split('=')[1] || 'not set';
  const debugMode = lines.find(line => line.startsWith('SENTRY_DEBUG='))?.split('=')[1] || 'not set';
  
  console.log('📊 Current Sentry Logging Status:');
  console.log(`   Log Level: ${logLevel}`);
  console.log(`   Debug Mode: ${debugMode}`);
}

function showUsage() {
  console.log('\n🔧 Sentry Logging Control Script');
  console.log('\nUsage:');
  console.log('  pnpm run sentry:quiet    # Minimal logging (errors only)');
  console.log('  pnpm run sentry:normal   # Normal logging (warnings + errors)');
  console.log('  pnpm run sentry:verbose  # Verbose logging (all levels)');
  console.log('  pnpm run sentry:debug    # Debug mode for troubleshooting');
  console.log('  pnpm run sentry:status   # Show current logging status');
  console.log('\nEnvironment Variables:');
  console.log('  SENTRY_LOG_LEVEL: Controls what gets logged (error, warn, info, debug)');
  console.log('  SENTRY_DEBUG: Enables/disables debug mode (true/false)');
  console.log('\nNote: Changes require restarting your development server');
}

function main() {
  const command = process.argv[2];
  
  if (!command) {
    showUsage();
    return;
  }
  
  switch (command) {
    case 'quiet':
      backupEnvFile();
      updateEnvFile('error', false);
      console.log('\n🔇 Sentry logging set to QUIET mode');
      console.log('   Only errors will be logged. Restart your dev server to apply changes.');
      break;
      
    case 'normal':
      backupEnvFile();
      updateEnvFile('warn', false);
      console.log('\n🔊 Sentry logging set to NORMAL mode');
      console.log('   Warnings and errors will be logged. Restart your dev server to apply changes.');
      break;
      
    case 'verbose':
      backupEnvFile();
      updateEnvFile('info', false);
      console.log('\n🔊 Sentry logging set to VERBOSE mode');
      console.log('   Info, warnings, and errors will be logged. Restart your dev server to apply changes.');
      break;
      
    case 'debug':
      backupEnvFile();
      updateEnvFile('debug', true);
      console.log('\n🐛 Sentry logging set to DEBUG mode');
      console.log('   All levels + debug mode enabled. Restart your dev server to apply changes.');
      break;
      
    case 'status':
      showCurrentStatus();
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      showUsage();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
