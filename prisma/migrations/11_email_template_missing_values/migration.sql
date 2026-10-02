-- =============================================================================
-- 11_email_template_missing_values
-- =============================================================================
-- EmailLog.template had no value for five templates the app already sends
-- (trial welcome, activation nudge, check-in, payment-failed alert and
-- data-retention warning), so logEmailSend failed its insert and every one of
-- those sends went unlogged. The email itself was delivered; only the audit
-- row and Resend delivery-status tracking were lost.
--
-- Additive only: existing rows and values are untouched.

ALTER TYPE "EmailTemplate" ADD VALUE 'TRIAL_WELCOME';
ALTER TYPE "EmailTemplate" ADD VALUE 'TRIAL_ACTIVATION_NUDGE';
ALTER TYPE "EmailTemplate" ADD VALUE 'TRIAL_CHECKIN';
ALTER TYPE "EmailTemplate" ADD VALUE 'PAYMENT_FAILED_ALERT';
ALTER TYPE "EmailTemplate" ADD VALUE 'DATA_RETENTION_WARNING';
