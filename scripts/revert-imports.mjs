#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');
const logPath = path.join(projectRoot, 'import-transformation-log.json');

console.log('🔄 Starting reversion of relative imports back to path aliases...');

/**
 * Revert relative imports back to path aliases using the transformation log
 */
function revertImports() {
  // Check if transformation log exists
  if (!fs.existsSync(logPath)) {
    console.error('❌ Transformation log not found! Cannot revert without log.');
    console.error(`Expected log at: ${logPath}`);
    process.exit(1);
  }

  // Load the transformation log
  const transformationLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  console.log(`📊 Found ${transformationLog.length} transformations to revert`);

  // Group transformations by file
  const fileTransforms = {};
  transformationLog.forEach(transform => {
    const filePath = path.join(projectRoot, transform.file);
    if (!fileTransforms[filePath]) {
      fileTransforms[filePath] = [];
    }
    fileTransforms[filePath].push(transform);
  });

  let revertedFiles = 0;
  let totalReversions = 0;

  // Process each file
  Object.entries(fileTransforms).forEach(([filePath, transforms]) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found, skipping: ${path.relative(projectRoot, filePath)}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Apply all transformations for this file in reverse
    transforms.forEach(transform => {
      const relativeImport = transform.relative;
      const originalImport = transform.original;

      // Create the search patterns based on import type
      let searchPattern, replacement;
      
      if (transform.type === 'import') {
        searchPattern = `from '${relativeImport}'`;
        replacement = `from '${originalImport}'`;
      } else if (transform.type === 'dynamic-import') {
        searchPattern = `import('${relativeImport}')`;
        replacement = `import('${originalImport}')`;
      }

      // Perform the replacement
      if (content.includes(searchPattern)) {
        content = content.replace(searchPattern, replacement);
        hasChanges = true;
        totalReversions++;
      }
    });

    // Write the file back if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Reverted: ${path.relative(projectRoot, filePath)}`);
      revertedFiles++;
    }
  });

  console.log(`\n🎉 Reversion complete!`);
  console.log(`📊 Files reverted: ${revertedFiles}`);
  console.log(`🔄 Total reversions: ${totalReversions}`);
  
  // Optionally remove the transformation log
  console.log(`\n💡 Keep transformation log? (Y/n)`);
  console.log(`   Log location: ${path.relative(projectRoot, logPath)}`);
  console.log(`   You can manually delete it later if desired.`);
}

/**
 * Main function
 */
function main() {
  try {
    revertImports();
  } catch (error) {
    console.error('❌ Error during reversion:', error);
    process.exit(1);
  }
}

main();
