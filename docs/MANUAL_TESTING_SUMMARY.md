# Manual Testing Quick Reference - Vetify

**Project:** Vetify Web App  
**Module:** Testing e Integración  
**Plane URL:** https://plane.alanis.dev/alanis-side-projects/projects/95c5423a-ae3c-40bb-a457-ae0c44fee48b/issues/

---

## 📊 Test Suite Overview

**Total Test Suites:** 15 (including master tracking issue)  
**Estimated Duration:** 8-12 hours  
**Status:** Ready to Execute

---

## 🎯 Quick Access: Test Cases by Issue ID

### 🔴 **URGENT Priority** (Must Pass for Production)

| ID | Test Name | Focus Area |
|----|-----------|------------|
| **VETIF-15** | Authentication & Onboarding Flow | Login, registration, tenant isolation |
| **VETIF-16** | Customer & Pet Management | CRUD, CASCADE/SET NULL deletions |
| **VETIF-17** | Appointment Management | Calendar, emails, public booking |
| **VETIF-20** | Sales & Point of Sale | Transactions, cash drawer, decimal precision |
| **VETIF-22** | Subscription & Billing | Stripe, feature gates, trial system |
| **VETIF-26** | Security & Access Control | Multi-tenant isolation, XSS, CSRF |

### 🟡 **HIGH Priority**

| ID | Test Name | Focus Area |
|----|-----------|------------|
| **VETIF-18** | Medical History Module | Consultations, treatments, vaccinations |
| **VETIF-19** | Inventory Management | Stock tracking, low alerts, decimal precision |
| **VETIF-21** | Reports & Analytics | Tiered reports by subscription plan |
| **VETIF-23** | Email System (Resend) | Confirmations, reminders, alerts |
| **VETIF-25** | Performance & Load Testing | Core Web Vitals, API speed, large datasets |
| **VETIF-28** | Error Handling & Edge Cases | Network errors, validation, edge cases |

### 🟢 **MEDIUM Priority**

| ID | Test Name | Focus Area |
|----|-----------|------------|
| **VETIF-24** | Settings & Configuration | Clinic settings, users, business hours |
| **VETIF-27** | Browser & Device Compatibility | Cross-browser, responsive, accessibility |

### 📋 **Master Tracking Issue**

| ID | Test Name | Purpose |
|----|-----------|---------|
| **VETIF-29** | 📋 Manual Testing Suite - Vetify Web App | Overview, progress tracking, documentation |

---

## ✅ Critical Tests Checklist (Production Blockers)

Before deploying to production, these **MUST PASS**:

- [ ] **Multi-Tenant Isolation** (VETIF-26)
  - No cross-tenant data leakage via URL manipulation
  - RLS policies enforced at database level
  - Console shows no RLS violations

- [ ] **Authentication Security** (VETIF-15, VETIF-26)
  - Login/logout flows work correctly
  - Session management secure
  - Password reset functional

- [ ] **Subscription & Billing** (VETIF-22)
  - Stripe integration working (test mode)
  - Feature gates enforced by plan
  - Trial system functional (30 days)

- [ ] **Data Integrity** (VETIF-16, VETIF-19, VETIF-20)
  - CASCADE deletions work (customers → pets)
  - SET NULL preserves history (appointments, sales)
  - Decimal precision maintained (prices, quantities)

- [ ] **Email Notifications** (VETIF-23)
  - Appointment confirmations sent
  - Reminders sent 24h before
  - Low stock alerts working

- [ ] **Core Workflows** (VETIF-17, VETIF-20)
  - Create appointments successfully
  - Process sales transactions
  - Cash drawer open/close working

---

## 🚀 Quick Start Guide

### 1. **Environment Setup** (5 minutes)

```bash
# Start development server
pnpm dev

# Verify database connection
pnpm prisma db pull

# Check Stripe configuration
pnpm stripe:verify
```

### 2. **Create Test Tenants** (10 minutes)

Create 3 test tenants via registration:
- **Tenant A:** Plan Básico (email: test-basico@example.com)
- **Tenant B:** Plan Profesional (email: test-pro@example.com)
- **Tenant C:** Plan Corporativo (email: test-corp@example.com)

### 3. **Prepare Test Data** (15 minutes per tenant)

For each tenant, create:
- 3-5 Customers
- 5-10 Pets
- 10+ Appointments
- 5-10 Inventory items
- 5+ Sales transactions

### 4. **Execute Tests** (8-12 hours)

Recommended order:
1. Start with **URGENT** priority tests
2. Execute **HIGH** priority tests
3. Complete **MEDIUM** priority tests
4. Re-test any failures after fixes

### 5. **Document Results**

For each test:
- ✅ Mark as **Pass** in Plane
- ❌ Mark as **Fail** with bug report
- 📸 Add screenshots for issues
- 🐛 Create separate bug issues for failures

---

## 📝 Bug Report Template

When you find a bug, report it in Plane:

```markdown
## [Component] Brief Description

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** 
**Actual:** 

**Environment:** Browser | OS | Tenant | User
**Screenshots:** [Attach]
**Console Errors:** [Paste]

**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low
```

---

## 🔗 Key Documentation Links

- **Full Testing Guide:** `/docs/MANUAL_TESTING_GUIDE.md`
- **Original Checklist:** `/docs/MANUAL_UI_TESTING_CHECKLIST.md`
- **Production Readiness:** `/docs/PRODUCTION_READINESS_CHECKLIST.md`
- **RLS Configuration:** `/docs/RLS_CONFIGURATION.md`
- **Email System:** `/docs/EMAIL_SYSTEM.md`
- **Deployment Guide:** `/deployment/VERCEL_SETUP_INSTRUCTIONS.md`

---

## 📊 Test Execution Tracker

Use this to track your progress:

| Test Suite | Status | Pass/Fail | Notes | Date |
|------------|--------|-----------|-------|------|
| VETIF-15 | ⚪ Todo |  |  |  |
| VETIF-16 | ⚪ Todo |  |  |  |
| VETIF-17 | ⚪ Todo |  |  |  |
| VETIF-18 | ⚪ Todo |  |  |  |
| VETIF-19 | ⚪ Todo |  |  |  |
| VETIF-20 | ⚪ Todo |  |  |  |
| VETIF-21 | ⚪ Todo |  |  |  |
| VETIF-22 | ⚪ Todo |  |  |  |
| VETIF-23 | ⚪ Todo |  |  |  |
| VETIF-24 | ⚪ Todo |  |  |  |
| VETIF-25 | ⚪ Todo |  |  |  |
| VETIF-26 | ⚪ Todo |  |  |  |
| VETIF-27 | ⚪ Todo |  |  |  |
| VETIF-28 | ⚪ Todo |  |  |  |

**Overall Progress:** 0/14 completed  
**Pass Rate:** N/A  
**Bugs Found:** 0  
**Critical Blockers:** 0

---

## 🎯 Key Metrics to Track

### Performance
- **LCP (Largest Contentful Paint):** Target < 2.5s
- **FCP (First Contentful Paint):** Target < 1.8s
- **API Response Time:** Target < 1s
- **Database Queries:** Target < 1s

### Quality
- **Test Coverage:** 100% of 14 suites
- **Pass Rate:** Target 100% for critical tests
- **Accessibility:** WCAG AA compliance
- **Browser Support:** Chrome, Firefox, Safari, Edge

### Security
- **Multi-Tenant Isolation:** 100% (no leakage)
- **XSS Prevention:** All forms sanitized
- **Rate Limiting:** Active on auth endpoints
- **Security Headers:** All present

---

## 🔍 Common Issues to Watch For

Based on the existing checklist:

1. **Multi-tenant isolation failures**
   - Test by URL manipulation
   - Check browser console for RLS errors

2. **Decimal precision issues**
   - Test with values like 15.75, 99.99
   - Verify persistence after reload

3. **Deletion behavior**
   - Verify CASCADE (customers → pets)
   - Verify SET NULL (appointments, sales)

4. **Email delivery**
   - Check spam folders
   - Verify Resend dashboard for failures

5. **Subscription feature gates**
   - Test direct URL access to premium features
   - Verify upgrade prompts shown

6. **Performance on large datasets**
   - Test with 500+ customers
   - Verify pagination works

---

## 📞 Questions or Issues?

- **Plane Module:** Testing e Integración
- **Documentation:** `/docs/` directory
- **Project:** Vetify (VETIF)

---

**Created:** November 5, 2025  
**Version:** 1.0

