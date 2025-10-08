# Fix Plan: Styling & Layout Issues on Vercel Deployment

## 🎯 Feature/Fix Overview

**Name**: Resolve CSS/Styling Loading Issue on Development Deployment

**Type**: Bug Fix

**Priority**: P0-Critical

**Complexity**: XS (<4h)

**Sprint**: Hot Fix | **Epic**: Production Stability

### Problem Statement (Jobs To Be Done)
**When** accessing the development deployment URL, **I want to** see the properly styled landing page, **so that** users can interact with the application as designed.

**Current State**: 
- Development branch deployment (https://vetify-git-development-emmanuel-alanis-projects.vercel.app/) shows broken styling
- Elements are misaligned, missing CSS classes, "Modo claro" badge visible
- Navigation and hero section layout completely broken
- **Note**: Inline critical CSS already added to `src/app/layout.tsx` (lines 110-351) as emergency fix

**Desired State**: 
- All deployments should display consistent styling matching the working preview URL
- Proper Tailwind CSS compilation and loading
- Consistent theme application
- Remove inline critical CSS once external CSS loading is fixed

**Impact**: Critical user experience issue preventing proper evaluation of features

### Success Metrics
- [ ] **Functional**: Landing page renders with correct styling on all deployment URLs
- [ ] **Visual**: Layout matches design specifications (screenshot 2)
- [ ] **Consistency**: All Vercel preview deployments show identical styling
- [ ] **Performance**: CSS bundle loads on first paint without FOUC
- [ ] **Cleanup**: Remove inline critical CSS from layout after fix is verified

### Dependencies & Risks
**Technical Risks**: 
- CSS bundle not being generated correctly in Vercel build
- PostCSS/Tailwind configuration issue in production environment
- Asset copying script (`scripts/copy-assets.mjs`) may be interfering
- Custom webpack configuration in `next.config.js` may affect CSS bundling
- Vercel build cache corruption

**Mitigation Strategy**: 
- Compare build outputs between working and broken deployments
- Clear Vercel build cache
- Review custom webpack config (CopyPlugin may cause issues)
- Verify CSS import chain with src/ directory structure
- Test without copy-assets.mjs script

---

## 🔍 Root Cause Analysis

### Hypothesis 1: Build Cache Corruption
**Evidence**: Different deployment URLs from same codebase show different results

**Investigation Steps**:
1. Check Vercel deployment logs for both URLs
2. Compare build outputs between working (`j68hb95av`) and broken (`git-development`) deployments
3. Look for CSS bundle size differences
4. Check for build warnings/errors

### Hypothesis 2: CSS Import Order or Missing Imports
**Evidence**: Layout structure exists but styling missing

**Investigation Steps**:
1. Verify `globals.css` is imported in root layout
2. Check if Tailwind directives are present (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
3. Confirm `tailwind.config.ts` content paths include all component directories
4. Verify PostCSS configuration exists and is correct

### Hypothesis 3: Environment-Specific Configuration
**Evidence**: Git branch deployment behaves differently than preview deployment

**Investigation Steps**:
1. Check for environment-specific CSS imports or conditional styling
2. Verify no theme-related environment variables are missing
3. Compare Vercel project settings between preview and git deployments
4. Check for `.env` file differences

### Hypothesis 4: Next.js App Router CSS Loading Issue
**Evidence**: Next.js 15 has specific CSS loading patterns

**Investigation Steps**:
1. Verify CSS is imported in correct location (root `layout.tsx`)
2. Check for multiple competing CSS imports
3. Verify no CSS-in-JS conflicts
4. Check Next.js configuration for CSS-related settings

---

## 🔧 Investigation Checklist

### Step 1: Compare Git History
```bash
# In your terminal at /Users/ealanis/Development/current-projects/vetify
git diff b125d227856e0f6b65885874759e2c97e4fed759 HEAD --name-only | grep -E '\.(css|tsx?|config|mjs)'
```
**Expected Outcome**: Identify any CSS, config, layout, or script files changed since last working commit

### Step 2: Verify Core Files Exist and Are Correct

Check these critical files:

**✅ src/app/layout.tsx** (VERIFIED)
- [x] Imports `@/app/globals.css` on line 7
- [x] CSS import is at top before component imports
- ⚠️ Has inline critical CSS (lines 110-351) as emergency workaround
- [ ] Check if inline CSS is conflicting with external CSS

**✅ src/app/globals.css** (VERIFIED)
- [x] Contains `@tailwind base;` (line 1)
- [x] Contains `@tailwind components;` (line 2)
- [x] Contains `@tailwind utilities;` (line 3)
- [x] Custom @layer base and @layer components properly defined
- [x] No syntax errors detected

**✅ tailwind.config.ts** (VERIFIED)
- [x] Content paths include: `'./src/**/*.{js,ts,jsx,tsx,mdx}'`
- [x] Content paths include: `'./app/**/*.{js,ts,jsx,tsx,mdx}'`
- [x] Content paths include: `'./pages/**/*.{js,ts,jsx,tsx,mdx}'`
- [x] Content paths include: `'./components/**/*.{js,ts,jsx,tsx,mdx}'`
- [x] Safelist for critical classes configured
- [x] Custom plugins for animations and line-clamp

**✅ config/postcss.config.mjs** (VERIFIED)
- [x] Includes `tailwindcss: {}` plugin
- [x] Includes `autoprefixer: {}` plugin
- [x] Uses ESM export format

**✅ package.json** (VERIFIED)
- [x] `tailwindcss@^3.4.1` in devDependencies
- [x] `postcss@^8` in devDependencies
- [x] `autoprefixer@^10.4.21` in devDependencies
- [x] Uses `pnpm@9.15.9` as package manager
- ⚠️ Custom `vercel-build` script: `prisma generate && next build && node scripts/copy-assets.mjs`

### Step 3: Check Vercel Deployment Settings

**In Vercel Dashboard**:
1. [ ] Go to project settings → Environment Variables
2. [ ] Verify no CSS-related env vars differ between environments
3. [ ] Check Build & Development Settings
   - Build Command: Should be `pnpm vercel-build` (as per vercel.json)
   - Install Command: Should be `pnpm install --frozen-lockfile`
   - Output Directory: `.next` (default for Next.js)
4. [ ] Verify Framework Preset is set to "Next.js"
5. [ ] Check if Node.js version matches (should be >=20.0.0 per engines in package.json)

### Step 4: Check Build Logs

**For both deployments**:
1. [ ] Access deployment in Vercel dashboard
2. [ ] View build logs
3. [ ] Search for:
   - "CSS" - verify CSS bundle generation
   - "Tailwind" - check Tailwind processing
   - "PostCSS" - verify PostCSS plugin execution
   - "copy-assets" - check if copy-assets.mjs runs successfully
   - "CopyPlugin" - verify webpack CopyPlugin status
4. [ ] Check for any warnings about:
   - Missing modules
   - Failed asset copying
   - PostCSS configuration issues
5. [ ] Compare bundle sizes between deployments (look for `.css` files in build output)

### Step 5: Review Vercel Configuration Files

**✅ vercel.json** (VERIFIED)
- [x] Framework: "nextjs"
- [x] Install command: "pnpm install --frozen-lockfile"
- [x] Build command: "pnpm vercel-build"
- [x] Custom CSS headers configured for `/_next/static/css/(.*)` with immutable cache
- [ ] Verify these settings are actually applied in Vercel dashboard

### Step 6: Local Build Verification

```bash
# In /Users/ealanis/Development/current-projects/vetify

# Clean everything
rm -rf .next node_modules pnpm-lock.yaml .turbo

# Fresh install with pnpm
pnpm install --frozen-lockfile

# Build locally (same as Vercel)
pnpm vercel-build

# Check if CSS is generated
ls -lh .next/static/css/

# Check build output
cat .next/build-manifest.json | grep -i css

# Verify copy-assets script output
ls -lh .next/static/media/
```

**Expected**: 
- Should see CSS files with reasonable sizes (>50KB for this app with Tailwind)
- At least one main CSS bundle in `.next/static/css/`
- No errors from copy-assets.mjs script

---

## ✅ Resolution Steps (In Priority Order)

### Fix #1: Clear Vercel Build Cache (Most Likely - 80% Success Rate)
1. Go to Vercel Dashboard → Your Project (Vetify) → Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Go to Deployments → development branch → Redeploy
5. Verify styling loads correctly at both URLs
6. **Expected Result**: CSS should load properly without inline styles

### Fix #2: Review Inline Critical CSS Conflict
**File**: `src/app/layout.tsx` (lines 110-351)

**Current Issue**: Inline critical CSS may be:
- Overriding external CSS
- Causing specificity conflicts
- Making debugging harder

**Action**: 
```typescript
// TEMPORARY TEST: Comment out inline styles to verify external CSS loads
// If external CSS works, gradually remove inline styles

// Lines 110-351 in src/app/layout.tsx - Comment out the <style> tag
{/* CRITICAL CSS INLINED - Nuclear option for Vercel deployment fix */}
{/* <style dangerouslySetInnerHTML={{ __html: `...` }} /> */}
```

**Test on Vercel**: 
- Deploy without inline CSS
- Check if external CSS loads
- If successful, permanently remove inline styles

### Fix #3: Remove Unnecessary copy-assets.mjs Script (HIGH PRIORITY)
**File**: `scripts/copy-assets.mjs`

**Issue Identified**: Script copies entire `public/` folder to `.next/static/media/` AFTER build completes
- ❌ This is unnecessary for Vercel (handles public folder automatically)
- ❌ May interfere with Next.js static file handling
- ❌ Could cause timing issues with CSS bundle generation
- ❌ Duplicates assets unnecessarily

**Action**: Simplify vercel.json build command

```json
// vercel.json - RECOMMENDED CHANGE
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "prisma generate && next build",  // Remove copy-assets.mjs
  // ... rest of config
}
```

**Testing**:
1. Update vercel.json locally
2. Commit and push to development branch
3. Verify assets still load from `/logo/*`, `/favicon/*`, etc.
4. Check if CSS now loads correctly

### Fix #4: Review Webpack CopyPlugin Configuration
**File**: `next.config.js` (lines 61-78)

**Potential Issue**: CopyPlugin copying public assets to `.next/static/media` may:
- Interfere with CSS bundling
- Cause build timing issues
- Not be necessary for Vercel (handles public folder automatically)

**Action**: 
1. Check if CopyPlugin is actually needed
2. Test build without it (temporarily comment out)
3. Verify if public assets are still accessible

### Fix #5: Verify PostCSS Configuration Location
**Current**: `config/postcss.config.mjs`
**Standard**: Root level `postcss.config.mjs`

**Action**:
```bash
# Check if Next.js finds the PostCSS config
# May need to move or symlink

# Option 1: Copy to root
cp config/postcss.config.mjs ./postcss.config.mjs

# Option 2: Update Next.js to look in config/
# (Check if next.config.js references it)
```

### Fix #6: Simplify Webpack Configuration (Nuclear Option)
**File**: `next.config.js`

**Action**: Temporarily disable custom webpack config to isolate issue

```javascript
// Comment out custom webpack configuration (lines 43-146)
// webpack: (config, { isServer, dev }) => { ... }

// Test if CSS loads without custom webpack modifications
```

### Fix #7: Check Tailwind Content Paths for src/ Directory
**File**: `tailwind.config.ts`

**Current Paths** (VERIFIED as correct):
- ✅ `./src/**/*.{js,ts,jsx,tsx,mdx}`
- ✅ `./app/**/*.{js,ts,jsx,tsx,mdx}` (for backwards compatibility)
- ✅ `./pages/**/*.{js,ts,jsx,tsx,mdx}`
- ✅ `./components/**/*.{js,ts,jsx,tsx,mdx}`

**Note**: These are already correct, no changes needed

### Fix #8: Force Fresh Build with Cache Invalidation
If above fixes don't work:

```bash
# Local test
rm -rf .next node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile
pnpm vercel-build

# If successful locally, force Vercel rebuild
git commit --allow-empty -m "force: Rebuild CSS bundle [skip ci]"
git push origin development

# In Vercel Dashboard:
# - Clear Build Cache
# - Clear Data Cache
# - Redeploy
```

---

## 🧪 Testing Plan

### Pre-Testing: CSS Bundle Verification
```bash
# After any fix, verify CSS is generated
ls -lh .next/static/css/

# Should see files like:
# app-layout-[hash].css (main app styles)
# [route]-[hash].css (page-specific styles)

# Check CSS content
cat .next/static/css/*.css | head -50
# Should see Tailwind reset, custom classes, etc.
```

### Manual Testing Checklist
After implementing fix:

1. [ ] Clear browser cache completely (Cmd+Shift+R / Ctrl+Shift+R)
2. [ ] Visit development deployment URL (https://vetify-git-development-emmanuel-alanis-projects.vercel.app/)
3. [ ] Open DevTools → Network → Filter by CSS
4. [ ] Verify CSS files load with 200 status (not 404)
5. [ ] Check hero section displays correctly (proper alignment, colors)
6. [ ] Verify navigation bar styling is correct (no "Modo claro" badge visible)
7. [ ] Check responsive layout on mobile viewport (375px width)
8. [ ] Verify dark mode toggle works (if applicable)
9. [ ] Check browser console for CSS-related errors
10. [ ] Verify page load time hasn't increased significantly (<3s)
11. [ ] Test public assets load correctly:
    - [ ] Logo images (`/logo/*`)
    - [ ] Favicon (`/favicon/*`)
    - [ ] OG image (`/og-image.jpg`)

### CSS Loading Verification
```javascript
// In browser console, verify styles are applied
getComputedStyle(document.querySelector('nav')).backgroundColor
// Should return proper color value, not 'rgba(0, 0, 0, 0)'

// Check if Tailwind classes are processed
document.querySelector('.btn-primary')?.className
// Should have CSS applied
```

### Cross-Browser Testing
- [ ] Chrome (latest) - Desktop
- [ ] Firefox (latest) - Desktop
- [ ] Safari (latest) - Desktop
- [ ] Mobile Safari (iOS) - Test on actual device
- [ ] Chrome Mobile (Android) - Test on actual device or emulator

### Performance Testing
```bash
# Use Lighthouse CLI or DevTools
# Target scores:
# - Performance: >90
# - First Contentful Paint: <1.8s
# - Largest Contentful Paint: <2.5s
# - Cumulative Layout Shift: <0.1
```

---

## 📋 Prevention Measures

### Pre-Commit Checks
1. Always test build locally before pushing:
```bash
# Use the same command as Vercel
pnpm vercel-build

# Verify build output
pnpm start

# Open http://localhost:3000 and inspect
```

2. Check for CSS bundle generation:
```bash
ls -lh .next/static/css/
# Should show files with reasonable sizes (>50KB)

cat .next/build-manifest.json | jq '.pages' | grep css
# Should show CSS files mapped to pages
```

3. Verify no conflicting inline styles:
```bash
# Search for inline critical CSS that might conflict
grep -r "dangerouslySetInnerHTML" src/app/layout.tsx
# Should return nothing after fix is applied
```

### CI/CD Enhancement
Add to GitHub Actions workflow:
```yaml
name: CSS Bundle Verification

on:
  push:
    branches: [development, main]
  pull_request:
    branches: [development, main]

jobs:
  verify-css:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build project
        run: pnpm vercel-build
      
      - name: Verify CSS bundle exists
        run: |
          if [ ! -d ".next/static/css" ]; then
            echo "❌ CSS bundle not generated!"
            exit 1
          fi
          
          CSS_FILES=$(find .next/static/css -name "*.css" | wc -l)
          if [ "$CSS_FILES" -eq 0 ]; then
            echo "❌ No CSS files found in bundle!"
            exit 1
          fi
          
          echo "✅ CSS bundle verified: $CSS_FILES files found"
      
      - name: Check CSS bundle size
        run: |
          TOTAL_SIZE=$(du -sh .next/static/css | cut -f1)
          echo "📦 Total CSS bundle size: $TOTAL_SIZE"
```

### Documentation Updates
Add to project README.md:

#### CSS/Styling Architecture
- **Global Styles**: Located at `src/app/globals.css`
- **Tailwind Config**: `tailwind.config.ts` with custom Vetify theme
- **PostCSS**: `config/postcss.config.mjs` (Note: in config folder, not root)
- **Build Process**: Uses Next.js 15 with App Router
- **Package Manager**: pnpm (required, do not use npm/yarn)

#### Common Styling Issues
1. **Missing CSS in deployment**: 
   - Clear Vercel build cache
   - Verify vercel.json build command doesn't include copy-assets.mjs
   - Check PostCSS config is accessible

2. **Tailwind classes not working**:
   - Verify file is in content paths (tailwind.config.ts)
   - Check for typos in class names
   - Ensure @tailwind directives exist in globals.css

3. **Dark mode issues**:
   - Using class-based dark mode (`darkMode: "class"`)
   - Check ThemeProvider in src/app/providers.tsx

---

## 🚨 Rollback Plan

If fixes don't work:

### Option 1: Immediate Rollback (5 minutes)
```bash
# Revert to last known working commit
git checkout b125d227856e0f6b65885874759e2c97e4fed759

# Create emergency hotfix branch
git checkout -b hotfix/css-emergency

# Force push to development (with team notification)
git push origin hotfix/css-emergency

# In Vercel: Change development branch to hotfix/css-emergency
```

### Option 2: Revert Specific Changes (10 minutes)
```bash
# If issue started with recent changes, revert them
git log --oneline -10  # Find problematic commits

# Revert specific commits (safest approach)
git revert [commit-hash] [commit-hash]
git push origin development
```

### Option 3: Keep Inline CSS Temporarily (Current State)
- Inline critical CSS is already in place (lines 110-351 of src/app/layout.tsx)
- This ensures basic styling works while investigating
- Not ideal for performance, but functional
- Use this as fallback while testing other fixes

### Option 4: Temporary Domain Redirect
- In Vercel Dashboard:
  - Go to Settings → Domains
  - Temporarily point development domain to working preview deployment
  - Allows investigation without affecting user-facing URLs

### Recovery Testing
After rollback:
1. [ ] Verify CSS loads on development URL
2. [ ] Test critical user paths (homepage, login, signup)
3. [ ] Confirm no other functionality broken
4. [ ] Document what changes caused the issue
5. [ ] Create isolated branch for CSS fix testing

---

## 📊 Implementation Timeline

**Total Estimated Time**: 2-4 hours

### Phase 1: Quick Wins (45 min)
1. **Clear Vercel Build Cache** (15 min)
   - Dashboard action + redeploy
   - Highest success rate for this issue type
   
2. **Remove copy-assets.mjs from build** (15 min)
   - Update vercel.json
   - Test deployment
   - Likely culprit for timing issues
   
3. **Comment out inline CSS** (15 min)
   - Test if external CSS loads without conflict
   - Deploy and verify

### Phase 2: Configuration Review (30-60 min)
4. **PostCSS config location** (15 min)
   - Copy to root if needed
   - Verify Next.js detects it
   
5. **Webpack config review** (15-30 min)
   - Test without CopyPlugin
   - Isolate CSS bundling issues
   
6. **Build verification** (15 min)
   - Clean local build
   - Compare with Vercel output

### Phase 3: Testing & Documentation (45-60 min)
7. **Cross-browser testing** (20 min)
   - Desktop browsers
   - Mobile devices
   
8. **Performance verification** (10 min)
   - Lighthouse scores
   - CSS bundle size check
   
9. **Documentation** (15-30 min)
   - Document root cause
   - Update prevention measures
   - Clean up inline CSS if successful

---

## 📝 Notes & Observations

### Current State Analysis
- ✅ All core files verified (layout, globals.css, configs)
- ✅ Tailwind and PostCSS configurations correct
- ⚠️ Inline critical CSS present (emergency workaround)
- ⚠️ Custom build script includes copy-assets.mjs (suspicious)
- ⚠️ Complex webpack config with CopyPlugin (potential issue)
- ⚠️ PostCSS in config/ folder, not root (may cause detection issues)

### Key Differences from Standard Setup
1. **Custom Build Pipeline**: Includes asset copying post-build
2. **Inline Critical CSS**: Already attempted as fix
3. **Complex Webpack Config**: Custom CopyPlugin, path aliases
4. **Non-standard PostCSS location**: In config/ instead of root

### Comparison Notes
- Keep both deployment URLs active during investigation
- Take screenshots of DevTools Network tab showing CSS files
- Check response headers for CSS files (Content-Type, Cache-Control)
- Monitor build logs for timing of CSS generation vs asset copying
- Verify if working URL has different build pipeline

### Next Actions (Priority Order)
1. ⭐ **HIGHEST**: Clear Vercel build cache + redeploy
2. ⭐ **HIGH**: Remove copy-assets.mjs from vercel.json build command
3. ⭐ **MEDIUM**: Test deployment without inline critical CSS
4. **LOW**: Move PostCSS config to root if above don't work
5. **NUCLEAR**: Simplify webpack config

**Success Indicator**: CSS loads from `/_next/static/css/[hash].css` with 200 status and proper Content-Type header

---

## 📦 Vetify-Specific Configuration Summary

### Current Setup (Verified)
```plaintext
Project Structure:
  /Users/ealanis/Development/current-projects/vetify/
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx         # Root layout with CSS import (line 7)
  │   │   ├── globals.css        # Tailwind directives + custom styles
  │   │   └── ...
  │   ├── components/            # React components
  │   ├── lib/                   # Utilities
  │   └── ...
  ├── public/                    # Static assets (auto-served by Next.js)
  ├── config/
  │   ├── postcss.config.mjs    # ⚠️ Non-standard location
  │   └── ...
  ├── tailwind.config.ts         # Tailwind configuration
  ├── next.config.js            # Next.js config with custom webpack
  ├── vercel.json               # Vercel deployment config
  └── package.json              # Uses pnpm@9.15.9
```

### Build Pipeline
```bash
# Vercel Build Command (from vercel.json)
pnpm install --frozen-lockfile
prisma generate && next build && node scripts/copy-assets.mjs
                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                  # This may be causing issues!
```

### Key Files Review

**✅ src/app/layout.tsx**
- Line 7: `import '@/app/globals.css'`
- Lines 110-351: Inline critical CSS (to be removed after fix)
- Uses Inter font from Google Fonts
- Proper metadata and viewport configuration

**✅ src/app/globals.css**
- Complete Tailwind setup with @layer directives
- Custom component classes (.btn-primary, .card, etc.)
- Dark mode styles with @media queries
- Custom calendar and form styling

**✅ tailwind.config.ts**
- Vetify custom color palette (primary, accent, blush, slate)
- Comprehensive content paths including src/ directory
- Safelist for dynamic classes
- Custom animations and utilities
- Dark mode: class-based

**✅ config/postcss.config.mjs**
- Located in config/ folder (non-standard)
- Contains tailwindcss and autoprefixer plugins
- ESM format

**⚠️ next.config.js**
- Complex webpack configuration
- CopyPlugin copying public/ to .next/static/media/
- Custom path aliases
- Sentry integration
- TypeScript errors ignored on Vercel

**⚠️ vercel.json**
- Custom build command includes copy-assets.mjs
- CSS headers configured for caching
- Framework: Next.js

### Recommended Changes

#### 1. Update vercel.json (Immediate)
```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "prisma generate && next build",
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/_next/static/css/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Content-Type",
          "value": "text/css; charset=utf-8"
        }
      ]
    }
  ]
}
```

#### 2. Remove Inline CSS from src/app/layout.tsx (After Fix Verified)
```typescript
// Remove lines 110-351 (entire <style dangerouslySetInnerHTML=... block)
// Keep only the external CSS import on line 7
```

#### 3. Optional: Move PostCSS Config to Root
```bash
# If Next.js has trouble finding config in config/
cp config/postcss.config.mjs ./postcss.config.mjs
```

#### 4. Optional: Simplify Webpack Config (If Issues Persist)
```javascript
// In next.config.js, comment out CopyPlugin (lines 61-78)
// Vercel handles public/ folder automatically
```

### Environment Verification
```bash
# Node version (from package.json engines)
node --version  # Should be >= 20.0.0

# pnpm version
pnpm --version  # Should be 9.15.9

# Verify Vercel CLI (optional)
vercel --version
vercel env ls  # Check environment variables
```

### Success Criteria
- [ ] CSS bundle generated in `.next/static/css/`
- [ ] CSS files load with 200 status on deployment
- [ ] No inline critical CSS in layout.tsx
- [ ] Styles match local development
- [ ] Dark mode works correctly
- [ ] No FOUC (Flash of Unstyled Content)
- [ ] Public assets accessible without copy-assets.mjs