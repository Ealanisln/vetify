#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Write minimal tsconfig.json for Vercel (in project root)
// Always write to project root, regardless of where script is executed from
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

// Ensure the directory exists
if (!fs.existsSync(projectRoot)) {
  console.error(`Project root does not exist: ${projectRoot}`);
  process.exit(1);
}

try {
  fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
  console.log(`✅ Created minimal tsconfig.json for Vercel build at ${tsconfigPath}`);
} catch (error) {
  console.error(`❌ Failed to create tsconfig.json: ${error.message}`);
  console.error(`Attempted path: ${tsconfigPath}`);
  console.error(`Project root: ${projectRoot}`);
  console.error(`Current directory: ${process.cwd()}`);
  process.exit(1);
}
