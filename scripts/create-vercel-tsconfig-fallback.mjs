#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Create a minimal tsconfig.json for Vercel builds
const minimalTsConfig = {
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noCheck": true,
    "checkJs": false,
    "allowSyntheticDefaultImports": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
};

// Use process.cwd() as the most reliable way to get the project root in Vercel
const projectRoot = process.cwd();
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

console.log(`Working directory: ${projectRoot}`);
console.log(`Target tsconfig path: ${tsconfigPath}`);

try {
  // Check if we can write to the directory
  fs.accessSync(projectRoot, fs.constants.W_OK);
  
  // Write the file
  fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
  console.log(`✅ Created minimal tsconfig.json for Vercel build`);
  
  // Verify it was created
  if (fs.existsSync(tsconfigPath)) {
    console.log(`✅ Verified: tsconfig.json exists at ${tsconfigPath}`);
  } else {
    console.error(`⚠️ Warning: File was written but cannot be verified`);
  }
} catch (error) {
  console.error(`❌ Failed to create tsconfig.json: ${error.message}`);
  console.error(`Working directory: ${projectRoot}`);
  console.error(`Target path: ${tsconfigPath}`);
  
  // Try alternative approach - write to a temp file first
  try {
    const tempPath = path.join(projectRoot, 'tsconfig.temp.json');
    fs.writeFileSync(tempPath, JSON.stringify(minimalTsConfig, null, 2));
    fs.renameSync(tempPath, tsconfigPath);
    console.log(`✅ Created tsconfig.json using temp file approach`);
  } catch (tempError) {
    console.error(`❌ Temp file approach also failed: ${tempError.message}`);
    process.exit(1);
  }
}
