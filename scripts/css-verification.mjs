#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * CSS Verification Script for Vetify
 * 
 * This script verifies that CSS is properly compiled and includes
 * all necessary Vetify brand colors and components.
 */

// CSS classes that must be present in the build
const criticalCSSClasses = [
  'bg-vetify-primary',
  'text-vetify-accent',
  'border-vetify-primary',
  'bg-vetify-accent',
  'text-vetify-primary',
  'border-vetify-accent',
  'btn-primary',
  'btn-secondary',
  'card',
  'form-input',
  'dark:bg-gray-900',
  'dark:text-gray-100'
];

// Vetify color patterns that should be present
const vetifyColorPatterns = [
  /bg-vetify-primary/,
  /text-vetify-accent/,
  /border-vetify-/,
  /bg-vetify-/,
  /text-vetify-/
];

function getCSSFiles() {
  const nextStaticCSS = path.join(projectRoot, '.next', 'static', 'css');
  
  if (!fs.existsSync(nextStaticCSS)) {
    throw new Error('CSS build directory not found. Run `pnpm build` first.');
  }
  
  return fs.readdirSync(nextStaticCSS)
    .filter(file => file.endsWith('.css'))
    .map(file => path.join(nextStaticCSS, file));
}

function readCSSContent(cssFiles) {
  return cssFiles.map(file => ({
    file: path.basename(file),
    content: fs.readFileSync(file, 'utf8'),
    size: fs.statSync(file).size
  }));
}

function verifyCriticalClasses(cssContents) {
  const results = [];
  
  for (const className of criticalCSSClasses) {
    const found = cssContents.some(css => 
      css.content.includes(className.replace(':', '\\:'))
    );
    
    results.push({
      class: className,
      found,
      status: found ? '✅' : '❌'
    });
  }
  
  return results;
}

function verifyVetifyPatterns(cssContents) {
  const results = [];
  
  for (const pattern of vetifyColorPatterns) {
    const matches = cssContents.reduce((count, css) => {
      const matches = css.content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    results.push({
      pattern: pattern.toString(),
      matches,
      status: matches > 0 ? '✅' : '❌'
    });
  }
  
  return results;
}

function calculateCSSStats(cssContents) {
  const totalSize = cssContents.reduce((sum, css) => sum + css.size, 0);
  const totalSizeKB = Math.round(totalSize / 1024);
  
  return {
    fileCount: cssContents.length,
    totalSize: totalSizeKB,
    files: cssContents.map(css => ({
      name: css.file,
      sizeKB: Math.round(css.size / 1024)
    }))
  };
}

function generateReport(classResults, patternResults, stats) {
  console.log('\n🎨 CSS Verification Report for Vetify\n');
  console.log('=' .repeat(50));
  
  // File statistics
  console.log('\n📊 CSS Bundle Statistics:');
  console.log(`Total files: ${stats.fileCount}`);
  console.log(`Total size: ${stats.totalSize}KB`);
  stats.files.forEach(file => {
    console.log(`  - ${file.name}: ${file.sizeKB}KB`);
  });
  
  // Size validation
  const sizeStatus = stats.totalSize < 400 ? '✅' : '⚠️';
  console.log(`\nSize check (< 400KB): ${sizeStatus} ${stats.totalSize}KB`);
  
  // Critical classes verification
  console.log('\n🎯 Critical CSS Classes:');
  const foundClasses = classResults.filter(r => r.found).length;
  const totalClasses = classResults.length;
  console.log(`Found: ${foundClasses}/${totalClasses} classes`);
  
  classResults.forEach(result => {
    console.log(`  ${result.status} ${result.class}`);
  });
  
  // Vetify patterns verification
  console.log('\n🌈 Vetify Color Patterns:');
  patternResults.forEach(result => {
    console.log(`  ${result.status} ${result.pattern} (${result.matches} matches)`);
  });
  
  // Overall status
  const allClassesFound = classResults.every(r => r.found);
  const allPatternsFound = patternResults.every(r => r.matches > 0);
  const sizeOK = stats.totalSize < 400;
  
  console.log('\n' + '=' .repeat(50));
  if (allClassesFound && allPatternsFound && sizeOK) {
    console.log('🎉 CSS verification PASSED! All checks successful.');
    console.log('✅ Ready for deployment to Vercel.');
  } else {
    console.log('❌ CSS verification FAILED. Issues detected:');
    if (!allClassesFound) console.log('  - Missing critical CSS classes');
    if (!allPatternsFound) console.log('  - Missing Vetify color patterns');
    if (!sizeOK) console.log('  - CSS bundle too large');
  }
  
  return allClassesFound && allPatternsFound && sizeOK;
}

// Main execution
async function main() {
  try {
    console.log('🔍 Starting CSS verification...');
    
    const cssFiles = getCSSFiles();
    const cssContents = readCSSContent(cssFiles);
    
    const classResults = verifyCriticalClasses(cssContents);
    const patternResults = verifyVetifyPatterns(cssContents);
    const stats = calculateCSSStats(cssContents);
    
    const success = generateReport(classResults, patternResults, stats);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ CSS verification failed:', error.message);
    process.exit(1);
  }
}

main();
