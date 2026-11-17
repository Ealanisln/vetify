/**
 * @jest-environment node
 *
 * The local web server Playwright starts must not inherit the real Upstash
 * credentials from .env: Next.js keeps any var already set in process.env, so
 * blanking them here turns rate limiting off instead of letting every request
 * wait on an unreachable Redis.
 */
jest.mock('@playwright/test', () => ({
  defineConfig: (config: unknown) => config,
  devices: new Proxy({}, { get: () => ({}) }),
}));

type WebServer = { command: string; env?: Record<string, string> };

function loadWebServers(configPath: string, env: Record<string, string | undefined>): WebServer[] {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
  }
  try {
    let config: { webServer?: WebServer | WebServer[] } = {};
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a synchronous load
      config = require(configPath).default;
    });
    const { webServer } = config;
    if (!webServer) return [];
    return Array.isArray(webServer) ? webServer : [webServer];
  } finally {
    process.env = saved;
  }
}

const appServer = (servers: WebServer[]) =>
  servers.find((server) => /pnpm (dev|start)/.test(server.command));

describe.each([
  ['playwright.config.ts', '../../../playwright.config'],
  ['playwright.weekly.config.ts', '../../../playwright.weekly.config'],
])('%s web server env', (_name, configPath) => {
  it.each([
    ['local', { CI: undefined, TEST_AUTH_ENABLED: undefined }],
    ['CI', { CI: 'true', TEST_AUTH_ENABLED: 'true' }],
  ])('blanks the Upstash credentials (%s)', (_label, env) => {
    const server = appServer(loadWebServers(configPath, { TARGET: undefined, ...env }));

    expect(server).toBeDefined();
    expect(server?.env).toMatchObject({
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
    });
  });
});
