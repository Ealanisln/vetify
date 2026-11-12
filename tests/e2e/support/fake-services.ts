/**
 * Fake external services for authenticated E2E runs, started by Playwright's
 * webServer only when TEST_AUTH_ENABLED=true. Binds to loopback only.
 *
 * - Kinde issuer: GET /.well-known/jwks.json (the app validates sessions here
 *   when KINDE_ISSUER_URL=http://127.0.0.1:<port>) and POST /test-auth/token,
 *   which mints a session for the seeded owner.
 * - Resend: POST /emails (the app sends here when RESEND_BASE_URL points at
 *   this server), so invitation emails "send" without a real API key.
 *   GET /test-auth/emails lets a spec read what was sent.
 *
 * Every /test-auth/* route answers 404 unless the x-test-auth-secret header
 * matches TEST_AUTH_SECRET. The process exits at startup if a guard fails.
 *
 * Run: npx tsx tests/e2e/support/fake-services.ts
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createTestAuthIssuer, hasValidTestAuthSecret, type TestAuthUser } from './test-auth';
import { FAKE_SERVICES_PORT, FAKE_SERVICES_URL, TEST_AUTH_SECRET_HEADER } from './constants';

interface CapturedEmail {
  id: string;
  to: string[];
  subject: string;
  html: string;
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function start() {
  let issuer: ReturnType<typeof createTestAuthIssuer>;
  try {
    issuer = createTestAuthIssuer(FAKE_SERVICES_URL);
  } catch (error) {
    console.error(`[fake-services] refusing to start: ${(error as Error).message}`);
    process.exit(1);
  }

  const emails: CapturedEmail[] = [];

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', FAKE_SERVICES_URL);
    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { ok: true });
      }

      if (req.method === 'GET' && url.pathname === '/.well-known/jwks.json') {
        return send(res, 200, issuer.jwks());
      }

      if (req.method === 'POST' && url.pathname === '/emails') {
        const body = await readJson(req);
        const to = Array.isArray(body.to) ? body.to.map(String) : [String(body.to)];
        const email = { id: randomUUID(), to, subject: String(body.subject ?? ''), html: String(body.html ?? '') };
        emails.push(email);
        return send(res, 200, { id: email.id });
      }

      if (url.pathname.startsWith('/test-auth/')) {
        const header = req.headers[TEST_AUTH_SECRET_HEADER];
        if (!hasValidTestAuthSecret(Array.isArray(header) ? header[0] : header)) {
          return send(res, 404, { error: 'Not found' });
        }

        if (req.method === 'POST' && url.pathname === '/test-auth/token') {
          const body = (await readJson(req)) as Partial<TestAuthUser>;
          if (!body.sub || !body.email) return send(res, 400, { error: 'sub and email are required' });
          return send(res, 200, issuer.mint(body as TestAuthUser));
        }

        if (req.method === 'GET' && url.pathname === '/test-auth/emails') {
          const to = url.searchParams.get('to');
          return send(res, 200, { emails: to ? emails.filter((email) => email.to.includes(to)) : emails });
        }
      }

      return send(res, 404, { error: 'Not found' });
    } catch (error) {
      console.error('[fake-services] request failed', error);
      return send(res, 500, { error: 'Internal error' });
    }
  });

  server.listen(FAKE_SERVICES_PORT, '127.0.0.1', () => {
    console.log(`[fake-services] listening on ${FAKE_SERVICES_URL}`);
  });
}

start();
