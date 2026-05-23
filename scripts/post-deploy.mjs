#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const args = process.argv.slice(2)
const withLocal = args.includes('--with-local')
const prodUrl = process.env.PROD_URL || 'https://www.vetify.pro'

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function log(line) {
  process.stdout.write(line + '\n')
}

function header(label) {
  const bar = '─'.repeat(Math.max(0, 60 - label.length))
  log('')
  log(`${colors.cyan}${colors.bold}── ${label} ${bar}${colors.reset}`)
}

function runStep(name, cmd, env = {}) {
  return new Promise((resolve) => {
    header(name)
    log(`${colors.dim}$ ${cmd}${colors.reset}`)
    const child = spawn(cmd, {
      cwd: repoRoot,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    })
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

function safetyCheckLocalDb() {
  const url = process.env.DATABASE_URL || ''
  // Refuse to run local seed/tests if DATABASE_URL looks like production.
  const prodHints = ['supabase.co', 'vetify-prod', 'pooler.supabase']
  const looksProd = prodHints.some((hint) => url.includes(hint))
  if (looksProd) {
    log('')
    log(`${colors.red}${colors.bold}✖ DATABASE_URL looks like a production database.${colors.reset}`)
    log(`${colors.red}  Refusing to run local authenticated suite to prevent data damage.${colors.reset}`)
    log(`${colors.dim}  Switch to a local DB (e.g. pnpm env:localhost) and try again.${colors.reset}`)
    return false
  }
  return true
}

async function main() {
  log(`${colors.bold}Vetify post-deploy validation${colors.reset}`)
  log(`${colors.dim}target prod URL: ${prodUrl}${colors.reset}`)
  log(`${colors.dim}with-local:      ${withLocal ? 'yes' : 'no (pass --with-local to also run authenticated suite)'}${colors.reset}`)

  const results = []

  // ── Capa 1: prod read-only smoke ────────────────────────────────────────
  const prodCode = await runStep(
    'Capa 1 · Prod read-only smoke',
    'pnpm test:post-deploy:prod',
    { PROD_URL: prodUrl }
  )
  results.push({ name: 'Prod smoke', code: prodCode })

  // ── Capa 2: local authenticated suite (opt-in) ─────────────────────────
  if (withLocal) {
    if (!safetyCheckLocalDb()) {
      results.push({ name: 'Local authenticated suite', code: 1, skipped: 'unsafe DATABASE_URL' })
    } else {
      const localCode = await runStep(
        'Capa 2 · Local authenticated suite',
        'pnpm test:post-deploy:local'
      )
      results.push({ name: 'Local authenticated suite', code: localCode })
    }
  }

  // ── Resumen ────────────────────────────────────────────────────────────
  header('Resumen')
  let allPassed = true
  for (const r of results) {
    if (r.skipped) {
      log(`${colors.yellow}⚠ ${r.name}: skipped (${r.skipped})${colors.reset}`)
      allPassed = false
    } else if (r.code === 0) {
      log(`${colors.green}✓ ${r.name}${colors.reset}`)
    } else {
      log(`${colors.red}✖ ${r.name} (exit ${r.code})${colors.reset}`)
      allPassed = false
    }
  }

  if (!withLocal) {
    log('')
    log(`${colors.dim}Para validar también flujos autenticados (CRUD mascotas/clientes/citas):${colors.reset}`)
    log(`${colors.dim}  1. asegúrate de estar apuntando a una DB local (pnpm env:localhost)${colors.reset}`)
    log(`${colors.dim}  2. siembra el tenant CI: pnpm tsx scripts/seed-ci-plans.ts && pnpm tsx scripts/seed-ci-test-data.ts${colors.reset}`)
    log(`${colors.dim}  3. corre: pnpm test:post-deploy --with-local${colors.reset}`)
  }

  log('')
  log(`${colors.bold}Checklist manual:${colors.reset} docs/post-deploy-manual-checklist.md`)
  log(`${colors.dim}Cubre los flujos que no se pueden automatizar de forma segura:${colors.reset}`)
  log(`${colors.dim}signup real, Stripe checkout, recepción de webhook, Sentry post-deploy.${colors.reset}`)
  log('')

  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  log(`${colors.red}Fatal: ${err?.message || err}${colors.reset}`)
  process.exit(1)
})
