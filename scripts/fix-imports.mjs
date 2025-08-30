#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

console.log('🔧 Starting @/components/* to relative import transformation...');
console.log(`📁 Project root: ${projectRoot}`);
console.log(`📁 Source directory: ${srcDir}`);

// Track transformations for potential reversion
const transformationLog = [];

/**
 * Get relative path from one file to another
 */
function getRelativePath(fromFile, toPath) {
  const fromDir = path.dirname(fromFile);
  const relativePath = path.relative(fromDir, toPath);
  
  // Ensure the path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    return `./${relativePath}`;
  }
  return relativePath;
}

/**
 * Transform @/components/* imports to relative paths
 */
function transformFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Regex to match @/components/* imports
  const importRegex = /from\s+['"`]@\/components\/([^'"`]+)['"`]/g;
  const dynamicImportRegex = /import\s*\(\s*['"`]@\/components\/([^'"`]+)['"`]\s*\)/g;
  
  let newContent = content;
  let hasChanges = false;
  
  // Transform regular imports
  newContent = newContent.replace(importRegex, (match, componentPath) => {
    const targetPath = path.join(srcDir, 'components', componentPath);
    const relativePath = getRelativePath(filePath, targetPath);
    
    transformationLog.push({
      file: path.relative(projectRoot, filePath),
      original: `@/components/${componentPath}`,
      relative: relativePath,
      type: 'import'
    });
    
    hasChanges = true;
    return `from '${relativePath}'`;
  });
  
  // Transform dynamic imports
  newContent = newContent.replace(dynamicImportRegex, (match, componentPath) => {
    const targetPath = path.join(srcDir, 'components', componentPath);
    const relativePath = getRelativePath(filePath, targetPath);
    
    transformationLog.push({
      file: path.relative(projectRoot, filePath),
      original: `@/components/${componentPath}`,
      relative: relativePath,
      type: 'dynamic-import'
    });
    
    hasChanges = true;
    return `import('${relativePath}')`;
  });
  
  // Also handle @/lib, @/utils, @/types, @/hooks imports
  const otherAliases = ['lib', 'utils', 'types', 'hooks'];
  
  otherAliases.forEach(alias => {
    const aliasRegex = new RegExp(`from\\s+['"\`]@\\/${alias}\\/([^'"\`]+)['"\`]`, 'g');
    const aliasDynamicRegex = new RegExp(`import\\s*\\(\\s*['"\`]@\\/${alias}\\/([^'"\`]+)['"\`]\\s*\\)`, 'g');
    
    newContent = newContent.replace(aliasRegex, (match, modulePath) => {
      const targetPath = path.join(srcDir, alias, modulePath);
      const relativePath = getRelativePath(filePath, targetPath);
      
      transformationLog.push({
        file: path.relative(projectRoot, filePath),
        original: `@/${alias}/${modulePath}`,
        relative: relativePath,
        type: 'import'
      });
      
      hasChanges = true;
      return `from '${relativePath}'`;
    });
    
    newContent = newContent.replace(aliasDynamicRegex, (match, modulePath) => {
      const targetPath = path.join(srcDir, alias, modulePath);
      const relativePath = getRelativePath(filePath, targetPath);
      
      transformationLog.push({
        file: path.relative(projectRoot, filePath),
        original: `@/${alias}/${modulePath}`,
        relative: relativePath,
        type: 'dynamic-import'
      });
      
      hasChanges = true;
      return `import('${relativePath}')`;
    });
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Transformed: ${path.relative(projectRoot, filePath)}`);
    return true;
  }
  
  return false;
}

/**
 * Recursively find all TypeScript/JavaScript files
 */
function findSourceFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Main transformation function
 */
function main() {
  try {
    const sourceFiles = findSourceFiles(srcDir);
    console.log(`📊 Found ${sourceFiles.length} source files to process`);
    
    let transformedCount = 0;
    
    for (const file of sourceFiles) {
      if (transformFile(file)) {
        transformedCount++;
      }
    }
    
    // Save transformation log for potential reversion
    const logPath = path.join(projectRoot, 'import-transformation-log.json');
    fs.writeFileSync(logPath, JSON.stringify(transformationLog, null, 2));
    
    console.log(`\n🎉 Transformation complete!`);
    console.log(`📊 Files processed: ${sourceFiles.length}`);
    console.log(`✅ Files transformed: ${transformedCount}`);
    console.log(`📝 Total transformations: ${transformationLog.length}`);
    console.log(`💾 Transformation log saved to: ${path.relative(projectRoot, logPath)}`);
    
    if (transformationLog.length > 0) {
      console.log(`\n📋 Sample transformations:`);
      transformationLog.slice(0, 5).forEach(log => {
        console.log(`   ${log.file}: ${log.original} → ${log.relative}`);
      });
      
      if (transformationLog.length > 5) {
        console.log(`   ... and ${transformationLog.length - 5} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during transformation:', error);
    process.exit(1);
  }
}

main();
