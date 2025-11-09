# Vetify Manual Testing Guide

**Version:** 1.0  
**Last Updated:** November 5, 2025  
**Project:** Vetify - Veterinary Practice Management Platform  
**Testing Module:** Testing e Integración

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Testing Categories](#testing-categories)
4. [Test Execution Workflow](#test-execution-workflow)
5. [Reporting Issues](#reporting-issues)
6. [Pass/Fail Criteria](#passfail-criteria)
7. [Test Cases by Module](#test-cases-by-module)

---

## 🎯 Overview

This manual testing guide provides comprehensive test cases for the Vetify web application. All test cases are organized and tracked in **Plane** under the **Testing e Integración** module.

### Purpose
- Validate all critical features work as expected
- Verify schema changes (CASCADE, SET NULL, indexes, decimal precision)
- Ensure multi-tenant isolation and security
- Test subscription-based feature gating
- Validate email notifications and integrations
- Confirm UI/UX across browsers and devices

### Scope
- **Application:** Vetify SaaS Platform
- **Environment:** Development / Staging
- **Testing Type:** Manual Functional Testing
- **Duration:** Estimated 8-12 hours for full suite

---

## 🛠️ Test Environment Setup

### Prerequisites

1. **Access Requirements:**
   - Development server running on `localhost:3000` (or staging URL)
   - Admin credentials for test tenant(s)
   - Access to multiple test tenants for isolation testing
   - Valid test payment cards (Stripe test mode)

2. **Browser Requirements:**
   - Latest Chrome (primary)
   - Latest Firefox
   - Latest Safari
   - Latest Edge
   - Mobile browsers (iOS Safari, Android Chrome)

3. **Tools:**
   - Browser DevTools (Console, Network, Performance tabs)
   - Postman or similar (optional, for API testing)
   - Screen reader (optional, for accessibility testing)
   - Accessibility browser extensions (e.g., Axe DevTools)

### Test Data Preparation

Before starting testing, create the following test data:

```bash
# Start development server
pnpm dev

# Verify database connection
pnpm prisma db pull
```

**Create Test Tenants:**
- **Tenant A (Plan Básico):** "TEST Clinic Alpha"
- **Tenant B (Plan Profesional):** "TEST Clinic Beta"  
- **Tenant C (Plan Corporativo):** "TEST Clinic Gamma"

**Create Test Data for Each Tenant:**
- 3-5 Customers with various profiles
- 5-10 Pets with different species/breeds
- 10+ Appointments (past, present, future)
- 5-10 Inventory items (medicines, services)
- 5+ Completed sales transactions
- 2-3 Staff users with different roles

---

## 📂 Testing Categories

### 1. **Functional Testing** (Priority: Urgent)
- Authentication & Onboarding
- Customer & Pet Management
- Appointment Management
- Medical History Module
- Inventory Management
- Sales & Point of Sale
- Subscription & Billing

### 2. **Integration Testing** (Priority: High)
- Email System (Resend)
- Stripe Payment Gateway
- WhatsApp Integration (if enabled)
- Supabase Storage

### 3. **Security & Access Control** (Priority: Urgent)
- Multi-tenant isolation
- Authentication security
- Role-based access control (RBAC)
- Input validation (XSS, SQL injection prevention)
- CSRF protection
- Rate limiting

### 4. **Performance Testing** (Priority: High)
- Page load times (Core Web Vitals)
- API response times
- Database query performance
- Concurrent user simulation
- Large data set handling

### 5. **Compatibility Testing** (Priority: Medium)
- Browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness
- Tablet optimization
- Screen size breakpoints
- Accessibility (WCAG AA)

### 6. **Error Handling** (Priority: High)
- Network errors
- Server errors (500)
- Form validation
- Edge cases (dates, decimals, text)
- Session timeout
- File upload errors

---

## 🔄 Test Execution Workflow

### Step 1: Review Test Case
- Open test issue in Plane: https://plane.alanis.dev/alanis-side-projects/projects/95c5423a-ae3c-40bb-a457-ae0c44fee48b/issues/
- Read objective and test steps
- Prepare necessary test data

### Step 2: Execute Test
- Follow each test step precisely
- Document actual results vs. expected results
- Capture screenshots of issues (if any)
- Note console errors or warnings

### Step 3: Log Results
- Mark test as **Pass** or **Fail** in Plane
- If fail: Create detailed bug report
- Add comments with timestamps and findings
- Tag with appropriate labels (e.g., `bug`, `critical`, `ui`)

### Step 4: Regression Testing
- After fixes, re-test failed cases
- Verify no new issues introduced
- Update issue status in Plane

---

## 🐛 Reporting Issues

When you find a bug during testing, report it in Plane with the following format:

```markdown
## Bug Title
Clear, concise description of the issue

## Steps to Reproduce
1. Navigate to...
2. Click on...
3. Enter...
4. Submit...

## Expected Result
What should happen

## Actual Result
What actually happened

## Environment
- Browser: Chrome 120.0
- OS: macOS 14.0
- Tenant: TEST Clinic Alpha
- User: admin@example.com

## Screenshots
[Attach screenshots]

## Console Errors
[Paste any console errors]

## Severity
- [ ] Critical (blocks core functionality)
- [ ] High (major feature broken)
- [ ] Medium (workaround available)
- [ ] Low (cosmetic/minor)
```

---

## ✅ Pass/Fail Criteria

### Pass Criteria
- ✅ All test steps completed successfully
- ✅ Expected results match actual results
- ✅ No console errors (except known warnings)
- ✅ No visual glitches or broken layouts
- ✅ Data persistence verified (after reload)
- ✅ Performance within acceptable limits

### Fail Criteria
- ❌ Core functionality broken
- ❌ Data loss or corruption
- ❌ Security vulnerabilities
- ❌ Multi-tenant data leakage
- ❌ Critical errors in console
- ❌ Unhandled exceptions
- ❌ Payment/billing failures

---

## 📋 Test Cases by Module

Below is a summary of all test cases. Click the Plane issue ID to view full details:

### 🔐 Authentication & Security

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-15 | Manual Testing: Authentication & Onboarding Flow | Urgent | Todo |
| VETIF-26 | Manual Testing: Security & Access Control | Urgent | Todo |

**Key Tests:**
- Registration with Spanish characters
- Login/logout flows
- Multi-tenant isolation (CRITICAL)
- Password reset
- RBAC enforcement
- XSS/SQL injection prevention
- Rate limiting

---

### 👥 Customer & Pet Management

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-16 | Manual Testing: Customer & Pet Management | Urgent | Todo |

**Key Tests:**
- CRUD operations
- CASCADE deletion (customers → pets)
- SET NULL behavior (customers → appointments, sales)
- Species/gender data standardization
- Search and filtering

---

### 📅 Appointment Management

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-17 | Manual Testing: Appointment Management | Urgent | Todo |

**Key Tests:**
- Create/edit/cancel appointments
- Calendar UI and navigation
- Email confirmations and reminders
- Public booking page (no login required)
- Timezone handling

---

### 🏥 Medical History

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-18 | Manual Testing: Medical History Module | High | Todo |

**Key Tests:**
- Consultations, treatments, vaccinations
- Inline veterinarian creation
- Vital signs with decimal precision
- Medical history timeline
- Enhanced form UX

---

### 📦 Inventory Management

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-19 | Manual Testing: Inventory Management | High | Todo |

**Key Tests:**
- CRUD operations
- Decimal quantity precision (15.75 units)
- Stock movements and history
- Low stock alerts and emails
- SET NULL on deletion (preserve sale history)

---

### 💰 Sales & Point of Sale

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-20 | Manual Testing: Sales & Point of Sale (Caja) | Urgent | Todo |

**Key Tests:**
- Create sales with multiple items
- Decimal precision in pricing ($99.99)
- Tax and discount calculations
- Cash drawer management
- User deletion with cash drawer history (SET NULL)
- Sales history and reporting

---

### 📊 Reports & Analytics

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-21 | Manual Testing: Reports & Analytics (Subscription Tiering) | High | Todo |

**Key Tests:**
- Basic reports (Plan Básico)
- Advanced reports (Plan Profesional+)
- Feature gate enforcement
- Custom date ranges
- Export to Excel/PDF
- Report performance (< 2 seconds)

---

### 💳 Subscription & Billing

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-22 | Manual Testing: Subscription & Billing System | Urgent | Todo |

**Key Tests:**
- 30-day free trial
- Plan upgrades (Básico → Profesional)
- Plan downgrades
- Feature gate enforcement
- Stripe checkout flow
- Billing portal access
- Duplicate subscription prevention
- Trial expiration handling

---

### 📧 Email System

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-23 | Manual Testing: Email System (Resend Integration) | High | Todo |

**Key Tests:**
- Appointment confirmation emails
- Appointment reminder emails (24h before)
- Appointment update emails
- Low stock inventory alerts
- Email delivery failures (graceful handling)
- Email templates and branding
- Mobile-responsive emails

---

### ⚙️ Settings & Configuration

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-24 | Manual Testing: Settings & Configuration | Medium | Todo |

**Key Tests:**
- Clinic profile settings
- User management (invite, roles, disable)
- Service catalog configuration
- Business hours configuration
- Notification preferences
- Tax configuration

---

### ⚡ Performance & Load Testing

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-25 | Manual Testing: Performance & Load Testing | High | Todo |

**Key Tests:**
- Core Web Vitals (LCP < 2.5s, FCP < 1.8s)
- API response times (< 1 second)
- Database query performance (with indexes)
- Concurrent user simulation
- Large data set handling (500+ customers)
- Mobile performance

---

### 🌐 Browser & Device Compatibility

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-27 | Manual Testing: Browser & Device Compatibility | Medium | Todo |

**Key Tests:**
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Responsive breakpoints (375px, 768px, 1440px, 1920px)
- Tablet optimization (landscape/portrait)
- Accessibility (WCAG AA)
  - Keyboard navigation
  - Screen reader compatibility
  - Color contrast
  - Text scaling (200%)
- Print functionality

---

### 🚨 Error Handling & Edge Cases

| Issue ID | Test Name | Priority | Status |
|----------|-----------|----------|--------|
| VETIF-28 | Manual Testing: Error Handling & Edge Cases | High | Todo |

**Key Tests:**
- Network errors (slow 3G, offline mode)
- Server errors (500)
- Form validation errors
- Edge cases:
  - Dates (past, future, leap year, DST)
  - Decimals (0.00, 0.01, 9999999.99)
  - Text (long strings, special chars, emoji)
  - Deletions (CASCADE vs SET NULL)
- Session timeout
- Concurrent modifications
- File upload errors
- 404 Not Found

---

## 📈 Testing Progress Tracking

Track overall testing progress in Plane:
- **Testing e Integración Module:** https://plane.alanis.dev/alanis-side-projects/projects/95c5423a-ae3c-40bb-a457-ae0c44fee48b/modules/

### Test Execution Checklist

- [ ] All 14 test suites reviewed
- [ ] Test environment prepared
- [ ] Test data created
- [ ] Functional tests executed
- [ ] Integration tests executed
- [ ] Security tests executed
- [ ] Performance tests executed
- [ ] Compatibility tests executed
- [ ] Error handling tests executed
- [ ] All critical bugs fixed and re-tested
- [ ] Regression testing completed
- [ ] Final sign-off obtained

---

## 🎯 Critical Tests (Must Pass Before Production)

These tests **MUST PASS** before deploying to production:

1. ✅ **Multi-Tenant Isolation (VETIF-26)**
   - No cross-tenant data leakage
   - RLS policies enforced

2. ✅ **Authentication Security (VETIF-15, VETIF-26)**
   - Login/logout working
   - Session management secure

3. ✅ **Subscription & Billing (VETIF-22)**
   - Stripe integration functional
   - Feature gates enforced

4. ✅ **Data Integrity (VETIF-16, VETIF-19, VETIF-20)**
   - CASCADE deletions correct
   - SET NULL preserves history
   - Decimal precision maintained

5. ✅ **Email Notifications (VETIF-23)**
   - Appointment confirmations sent
   - Low stock alerts working

6. ✅ **Core Workflows (VETIF-17, VETIF-20)**
   - Appointment creation
   - Sales transactions
   - Cash drawer management

---

## 📝 Sign-Off Template

After completing all tests:

```
## Test Execution Summary

**Tester Name:** _____________________  
**Date:** _____________________  
**Environment:** ☐ Development ☐ Staging  
**Total Test Suites:** 14  
**Test Suites Passed:** _____  
**Test Suites Failed:** _____  
**Success Rate:** _____%  

## Critical Issues Found
1. _____________________
2. _____________________

## Non-Critical Issues
1. _____________________
2. _____________________

## Recommendation
☐ **Ready for Production**  
☐ **Needs Fixes** (specify which issues must be resolved)

**Additional Notes:**
_____________________
_____________________

**Signature:** _____________________
```

---

## 🔗 Related Documentation

- **Manual UI Testing Checklist:** `/docs/MANUAL_UI_TESTING_CHECKLIST.md`
- **Production Readiness:** `/docs/PRODUCTION_READINESS_CHECKLIST.md`
- **Schema Changes:** `/docs/SCHEMA_CHANGES_APPLIED.md`
- **RLS Configuration:** `/docs/RLS_CONFIGURATION.md`
- **Email System:** `/docs/EMAIL_SYSTEM.md`
- **Deployment Guide:** `/deployment/VERCEL_SETUP_INSTRUCTIONS.md`

---

## 📞 Support & Questions

For questions about testing procedures:
- **Plane Project:** https://plane.alanis.dev/alanis-side-projects/projects/95c5423a-ae3c-40bb-a457-ae0c44fee48b/
- **Module:** Testing e Integración
- **Documentation:** `/docs/` directory

---

**Last Updated:** November 5, 2025  
**Version:** 1.0

