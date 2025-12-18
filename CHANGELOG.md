# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-12-17

### Added
- API v1 authentication system (VETIF-36)
  - API key authentication with SHA-256 hashed keys
  - Location-scoped API keys for multi-branch access control
  - Granular permission scopes (read:pets, write:appointments, etc.)
  - Configurable rate limiting per API key (default 1000 req/hour)
  - API key management utilities with secure key generation
- Per-location sales tracking (VETIF-95)
  - Added locationId to Sale model for branch-specific reporting
  - Location-based filtering in sales queries
  - Performance indexes for location-scoped sales queries
- Comprehensive testing infrastructure with GitHub Actions CI
  - Unit tests with Jest (49 suites, 1600+ tests)
  - Integration tests for API routes (40+ suites, 600+ tests)
  - E2E tests with Playwright (490 tests across Chrome, Firefox, Safari)
  - Coverage reporting with configurable thresholds
  - Pre-commit hooks for lint-staged and unit tests
- Extended integration test coverage (Phase 2 testing initiative)
  - Admin Billing & Pricing API tests (VETIF-94)
  - Stripe checkout and webhook integration tests (VETIF-93)
  - Subscription API tests including upgrades/downgrades (VETIF-92)
  - Settings & Onboarding API tests (VETIF-61)
  - Hook unit tests for useErrorHandler and useThemeAware (VETIF-60)
- Email notification system for appointments
  - Configurable notification templates
  - Support for appointment reminders and confirmations
  - New email template types in database enum
- Dark mode support for tenant public pages
  - Theme-aware styling for customer-facing pages
  - Consistent dark mode experience across all views
- Notification preferences in settings
  - User-configurable email and push notification settings
  - Per-notification-type toggle controls
- Location support in inventory management
  - Branch location assignment for inventory items
  - Storage location field for precise item placement
  - Location-based filtering in inventory views

### Fixed
- Dark mode border inconsistencies across dashboard components
- Business hours save failing with null locationId
- Inventory modal styling and proper location field support
- Stats cards alignment in inventory dashboard
- Inventory table overflow handling for proper layout

### Changed
- Coverage threshold reduced to 5% (establishing initial baseline)
- Pre-commit hooks now run unit tests on changed files only
- Performance indexes added to frequently queried tables

### Security
- Added Email Log model for audit trail of sent notifications
- Performance indexes improve query response times

### Known Issues
- xlsx package has 2 high-severity vulnerabilities (no patch available yet)
  - GHSA-4r6h-8v6p-xvw6: Prototype Pollution
  - GHSA-5pgg-2g8v-p4x9: ReDoS
