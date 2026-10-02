/**
 * @jest-environment node
 */

// Regression: ISSUE-002 / ISSUE-003 — public domain and trial length in SEO config
// Found by /qa on 2026-10-02
// Report: .gstack/qa-reports/run-20261002T185412Z/qa-report-development-vetify-pro-2026-10-02.md

import { getDisplayHost, PAGE_METADATA, SITE_METADATA } from '@/lib/seo/config';
import { TRIAL_PERIOD_DAYS } from '@/lib/constants';

describe('getDisplayHost', () => {
  const original = process.env.NEXT_PUBLIC_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = original;
  });

  it.each([
    ['https://vetify.pro', 'vetify.pro'],
    ['https://development.vetify.pro/', 'development.vetify.pro'],
    ['http://localhost:3000', 'localhost:3000'],
  ])('renders %s as %s', (baseUrl, expected) => {
    process.env.NEXT_PUBLIC_BASE_URL = baseUrl;
    expect(getDisplayHost()).toBe(expected);
  });
});

describe('trial length in SEO copy', () => {
  it.each([
    ['site', SITE_METADATA.siteDescription],
    ['home', PAGE_METADATA.home.description],
    ['pricing', PAGE_METADATA.pricing.description],
  ])('%s description advertises the real trial length', (_page, description) => {
    expect(description.es).toContain(`${TRIAL_PERIOD_DAYS} días`);
    expect(description.en).toContain(`${TRIAL_PERIOD_DAYS} days`);
  });
});
