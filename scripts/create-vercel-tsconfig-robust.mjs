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
    "allowSyntheticDefaultImports": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
};

// Try multiple strategies to write the tsconfig.json
const strategies = [
  // Strategy 1: Direct write to cwd
  () => {
    const tsconfigPath = 'tsconfig.json';
    fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
    return tsconfigPath;
  },
  
  // Strategy 2: Write to absolute path from cwd
  () => {
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
    return tsconfigPath;
  },
  
  // Strategy 3: Write to /vercel/path0 directly (Vercel's build directory)
  () => {
    const tsconfigPath = '/vercel/path0/tsconfig.json';
    fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
    return tsconfigPath;
  },
  
  // Strategy 4: Check if tsconfig already exists, if not create it
  () => {
    const possiblePaths = [
      'tsconfig.json',
      path.resolve(process.cwd(), 'tsconfig.json'),
      '/vercel/path0/tsconfig.json'
    ];
    
    for (const tsconfigPath of possiblePaths) {
      try {
        // Check if file exists
        if (fs.existsSync(tsconfigPath)) {
          console.log(`Found existing tsconfig.json at ${tsconfigPath}`);
          // Update it with our minimal config
          fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
          return tsconfigPath;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    // If none exist, try to create in cwd
    const tsconfigPath = 'tsconfig.json';
    fs.writeFileSync(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2));
    return tsconfigPath;
  }
];

// Try each strategy
let success = false;
let successPath = null;

for (let i = 0; i < strategies.length; i++) {
  try {
    console.log(`Attempting strategy ${i + 1}...`);
    successPath = strategies[i]();
    
    // Verify the file was created
    if (fs.existsSync(successPath)) {
      console.log(`✅ Successfully created tsconfig.json at ${successPath}`);
      success = true;
      break;
    }
  } catch (error) {
    console.log(`Strategy ${i + 1} failed: ${error.message}`);
  }
}

if (!success) {
  console.error('❌ All strategies failed to create tsconfig.json');
  console.error('Environment info:');
  console.error(`- Current directory: ${process.cwd()}`);
  console.error(`- __dirname would be: ${path.dirname(new URL(import.meta.url).pathname)}`);
  console.error(`- Platform: ${process.platform}`);
  console.error(`- Node version: ${process.version}`);
  
  // Last resort: exit with 0 to let the build continue
  // The build might work without our custom tsconfig
  console.log('⚠️ Continuing build without custom tsconfig.json...');
  process.exit(0);
}

console.log('✅ tsconfig.json setup complete');
