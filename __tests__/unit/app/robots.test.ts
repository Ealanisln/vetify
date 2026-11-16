import robots from '@/app/robots';

type Rule = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };

function rulesOf(result: ReturnType<typeof robots>): Rule[] {
  return Array.isArray(result.rules) ? result.rules : [result.rules];
}

function blocksEverything(result: ReturnType<typeof robots>): boolean {
  const rules = rulesOf(result);
  return rules.length === 1 && rules[0].userAgent === '*' && rules[0].disallow === '/' && !rules[0].allow;
}

describe('robots.txt', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.VERCEL_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it.each(['https://vetify.pro', 'https://www.vetify.pro', 'https://www.vetify.pro/'])(
    'allows crawling on the production host %s',
    (baseUrl) => {
      process.env.NEXT_PUBLIC_BASE_URL = baseUrl;

      const result = robots();
      const host = baseUrl.replace(/\/+$/, '');

      expect(blocksEverything(result)).toBe(false);
      expect(rulesOf(result)[0]).toMatchObject({ userAgent: '*', allow: '/' });
      expect(result.sitemap).toBe(`${host}/sitemap.xml`);
      expect(result.host).toBe(host);
    }
  );

  it.each([
    ['a Vercel preview URL', { VERCEL_URL: 'vetify-git-feature-abc.vercel.app' }],
    ['localhost', {}],
    ['another domain', { NEXT_PUBLIC_BASE_URL: 'https://staging.vetify.pro' }],
    ['a look-alike domain', { NEXT_PUBLIC_BASE_URL: 'https://www.vetify.pro.evil.com' }],
    ['plain http', { NEXT_PUBLIC_BASE_URL: 'http://www.vetify.pro' }],
  ])('blocks all crawling on %s', (_label, env) => {
    Object.assign(process.env, env);

    const result = robots();

    expect(blocksEverything(result)).toBe(true);
    expect(result.sitemap).toBeUndefined();
  });
});
