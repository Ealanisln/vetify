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

// Write minimal tsconfig.json for Vercel (in project root)
// Always write to project root, regardless of where script is executed from
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, '..');
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
console.log(`✅ Created minimal tsconfig.json for Vercel build at ${tsconfigPath}`);
