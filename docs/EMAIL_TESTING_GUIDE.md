# Email System Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Vetify email system with real email delivery.

## Prerequisites

Before testing, ensure you have:

1. **Resend API Key** - Sign up at [resend.com](https://resend.com) and get an API key
2. **Verified Domain** - Verify your sending domain in Resend dashboard
3. **Environment Variables** - Set the following in your `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx           # Your Resend API key
RESEND_FROM_EMAIL=notifications@vetify.pro # Your verified sending email
RESEND_FROM_NAME=Vetify                    # Sender name
RESEND_REPLY_TO=soporte@vetify.pro         # Reply-to address

# Cron Job Security (for automated tests only)
CRON_SECRET=your-secret-token-here
```

4. **Development Server Running** - `pnpm dev` should be running on `localhost:3000`

## Test 1: Appointment Confirmation Email

### Setup
1. Log into your tenant dashboard
2. Navigate to Appointments section
3. Have a customer with a valid email address ready

### Steps
1. Create a new appointment:
   - Select a customer with email
   - Choose a pet
   - Set date/time
   - Enter service reason
   - Click "Create Appointment"

2. Check email delivery:
   - Check the customer's email inbox
   - Verify email was received
   - Verify all fields are correctly displayed:
     - Pet name
     - Owner name
     - Appointment date and time
     - Service name
     - Clinic information
     - Veterinarian name (if assigned)
     - Notes (if provided)

3. Check Prisma Studio:
   ```bash
   pnpm prisma studio
   ```
   - Navigate to `EmailLog` table
   - Find the most recent entry
   - Verify `status` is `SENT`
   - Verify `template` is `APPOINTMENT_CONFIRMATION`
   - Verify `recipientEmail` matches customer email
   - Check `resendId` is populated
   - Verify `sentAt` timestamp is set

### Expected Result
✅ Email received within seconds
✅ All information displayed correctly
✅ Branding and styling look professional
✅ Email renders correctly on mobile
✅ EmailLog entry created with status `SENT`

---

## Test 2: Low Stock Alert (Manual Trigger)

### Setup
1. Ensure you have inventory items with stock below minimum
2. Ensure your user has `MANAGE_INVENTORY` permission
3. Have Postman or curl ready

### Steps

**Option A: Using curl**
```bash
# Get your auth token from browser cookies (kinde_token)
curl -X POST http://localhost:3000/api/inventory/alerts \
  -H "Cookie: kinde_token=YOUR_TOKEN_HERE"
```

**Option B: Using Postman**
1. Create new POST request to `http://localhost:3000/api/inventory/alerts`
2. Add cookie header with your auth token
3. Send request

### Expected Response
```json
{
  "success": true,
  "message": "Alert sent for X low stock items",
  "itemsCount": X
}
```

### Email Verification
1. Check inbox of staff members with MANAGE_INVENTORY permission
2. Verify email contains:
   - Clinic name
   - List of low stock items
   - Current vs minimum stock levels
   - Product categories
   - Alert timestamp

3. Check Prisma Studio:
   - Navigate to `EmailLog` table
   - Verify `template` is `LOW_STOCK_ALERT`
   - Verify all staff members are listed in logs

### Expected Result
✅ Alert received by all inventory managers
✅ All low stock items listed correctly
✅ Stock levels accurate
✅ EmailLog entries created

---

## Test 3: Treatment Reminder Processing

### Setup
1. Create reminder entries in database with `dueDate` <= current time:
   ```sql
   INSERT INTO "Reminder" (
     "id", "tenantId", "customerId", "petId", "type",
     "title", "message", "dueDate", "status", "createdAt", "updatedAt"
   ) VALUES (
     gen_random_uuid(),
     'your-tenant-id',
     'your-customer-id',
     'your-pet-id',
     'TREATMENT',
     'Vacuna Antirrábica',
     'Vacunación anual obligatoria',
     NOW(),
     'PENDING',
     NOW(),
     NOW()
   );
   ```

2. Ensure customer has valid email address

### Steps
1. Call the reminder processing endpoint:
   ```bash
   curl "http://localhost:3000/api/reminders/process?secret=YOUR_CRON_SECRET"
   ```

2. Check response:
   ```json
   {
     "success": true,
     "treatmentReminders": {
       "processed": 1,
       "sent": 1
     },
     "appointmentReminders": {
       "processed": 0,
       "sent": 0
     },
     "errors": [],
     "timestamp": "2025-11-03T..."
   }
   ```

3. Verify customer email:
   - Check inbox
   - Verify pet name
   - Verify treatment name
   - Verify due date
   - Verify clinic information

4. Check Prisma Studio:
   - `Reminder` status should be `SENT`
   - `Reminder` `sentAt` should be populated
   - `EmailLog` entry created with template `TREATMENT_REMINDER`

### Expected Result
✅ Reminder emails sent successfully
✅ Reminder status updated to SENT
✅ EmailLog entries created
✅ All information displayed correctly

---

## Test 4: Appointment Reminder (24 Hours Before)

### Setup
1. Create appointment 24-25 hours in the future:
   ```sql
   INSERT INTO "Appointment" (
     "id", "tenantId", "customerId", "petId", "dateTime",
     "reason", "status", "createdAt", "updatedAt"
   ) VALUES (
     gen_random_uuid(),
     'your-tenant-id',
     'your-customer-id',
     'your-pet-id',
     NOW() + INTERVAL '24 hours 15 minutes',
     'Consulta General',
     'SCHEDULED',
     NOW(),
     NOW()
   );
   ```

### Steps
1. Call reminder processing endpoint:
   ```bash
   curl "http://localhost:3000/api/reminders/process?secret=YOUR_CRON_SECRET"
   ```

2. Check response shows appointment reminders processed

3. Verify customer email:
   - Check inbox
   - Verify "Recordatorio de Cita" subject
   - Verify all appointment details
   - Verify hours until appointment is displayed

4. Check EmailLog for duplicate prevention:
   - Run endpoint again immediately
   - Should NOT send duplicate email
   - Check EmailLog - should only have ONE entry per appointment

### Expected Result
✅ Reminder sent 24 hours before appointment
✅ No duplicate emails sent
✅ All appointment details correct
✅ EmailLog prevents duplicates

---

## Test 5: Email Template Rendering

### Visual Testing

Test each template with various data scenarios:

1. **Appointment Confirmation**
   - With veterinarian assigned
   - Without veterinarian
   - With notes
   - Without notes
   - With long clinic address
   - With special characters in names (José, María, Ñoño)

2. **Appointment Reminder**
   - 24 hours before
   - Different service types
   - Long service names

3. **Low Stock Alert**
   - 1 item
   - Multiple items (5+)
   - Items without categories
   - Different measurement units

4. **Treatment Reminder**
   - VACCINATION type
   - MEDICATION type
   - CHECKUP type
   - OTHER type
   - With notes
   - Without notes

### Expected Results
✅ All templates render correctly
✅ Responsive design works on mobile
✅ Dark mode email client compatibility
✅ Special characters display correctly
✅ Images/branding load properly
✅ Links are clickable (if any)

---

## Test 6: Error Handling

### Test Invalid API Key
1. Set `RESEND_API_KEY` to invalid value
2. Try creating appointment
3. Check console logs for error
4. Verify EmailLog shows `status: FAILED`
5. Verify error message is logged

### Test Invalid Email Address
1. Update customer email to invalid format
2. Try triggering any email
3. Verify graceful handling
4. Check EmailLog for FAILED status

### Test Missing Environment Variables
1. Remove `RESEND_FROM_EMAIL`
2. Try sending email
3. Should log error but not crash application

### Expected Results
✅ Errors logged but don't crash app
✅ EmailLog records failures
✅ User still receives success response for appointment creation
✅ Error details available in logs for debugging

---

## Test 7: Cron Job Security

### Test Without Secret
```bash
curl "http://localhost:3000/api/inventory/alerts"
```
Expected: `401 Unauthorized`

### Test With Wrong Secret
```bash
curl "http://localhost:3000/api/inventory/alerts?secret=wrong-secret"
```
Expected: `401 Unauthorized`

### Test With Correct Secret
```bash
curl "http://localhost:3000/api/inventory/alerts?secret=YOUR_CRON_SECRET"
```
Expected: `200 OK` with response data

### Expected Results
✅ Endpoints protected by secret
✅ Invalid secrets rejected
✅ Valid secrets accepted

---

## Test 8: Performance & Load Testing

### Test Multiple Emails
1. Create 10 low stock items
2. Add 5 staff members with inventory permissions
3. Trigger inventory alert
4. Verify all 5 staff receive email within reasonable time

### Test Database Logging Performance
1. Send 50 test emails rapidly
2. Check EmailLog table for all 50 entries
3. Verify no missing logs
4. Check query performance in console

### Expected Results
✅ Emails sent asynchronously (non-blocking)
✅ All emails logged to database
✅ No performance degradation
✅ Appointment creation remains fast

---

## Test 9: Email Log Queries

### Test via Prisma Studio
```bash
pnpm prisma studio
```

1. Navigate to `EmailLog` table
2. Filter by `tenantId`
3. Filter by `template`
4. Filter by `status`
5. Sort by `createdAt`

### Test Programmatically
Add to a test file or API route:
```typescript
import { getEmailLogs, getEmailStats } from '@/lib/notifications/notification-logger';

// Get recent emails
const logs = await getEmailLogs('tenant-id', {
  limit: 10,
  template: 'APPOINTMENT_CONFIRMATION',
});

// Get statistics
const stats = await getEmailStats('tenant-id');
console.log('Delivery rate:', stats.deliveryRate);
console.log('Bounce rate:', stats.bounceRate);
```

### Expected Results
✅ Logs retrieved correctly
✅ Filters work as expected
✅ Statistics calculated accurately
✅ Queries perform well

---

## Test 10: Production Readiness

### Pre-Production Checklist

1. **Environment Variables**
   ```bash
   # Verify all are set in production
   vercel env ls
   ```
   - [ ] RESEND_API_KEY
   - [ ] RESEND_FROM_EMAIL
   - [ ] RESEND_FROM_NAME
   - [ ] RESEND_REPLY_TO
   - [ ] CRON_SECRET

2. **Domain Verification**
   - [ ] Domain verified in Resend
   - [ ] SPF records configured
   - [ ] DKIM records configured
   - [ ] DMARC policy set

3. **Cron Jobs**
   - [ ] Inventory alerts: Daily at 9 AM
   - [ ] Reminders: Hourly
   - [ ] Test both cron jobs manually

4. **Monitoring**
   - [ ] Set up Resend webhook for delivery status (future)
   - [ ] Monitor EmailLog table for failures
   - [ ] Set up alerts for high bounce rates

5. **Rate Limits**
   - [ ] Verify Resend plan supports expected volume
   - [ ] Test sending limits (100/day on free tier)

### Expected Results
✅ All environment variables set
✅ Domain fully verified
✅ Cron jobs configured and tested
✅ Monitoring in place

---

## Troubleshooting Common Issues

### Email Not Received
1. Check spam folder
2. Verify Resend dashboard for delivery status
3. Check EmailLog for `resendId` and status
4. Verify customer email is valid
5. Check Resend API key is correct

### EmailLog Shows FAILED
1. Check `error` field in EmailLog
2. Common errors:
   - "Invalid API key" → Check RESEND_API_KEY
   - "Domain not verified" → Verify domain in Resend
   - "Rate limit exceeded" → Upgrade Resend plan

### Cron Job Not Running
1. Verify secret matches `CRON_SECRET` environment variable
2. Check Vercel logs for errors
3. Test endpoint manually with curl
4. Verify cron schedule in `vercel.json`

### Template Not Rendering
1. Check browser console for errors
2. Verify all required fields provided
3. Test with minimal data first
4. Check for special characters causing issues

---

## Success Criteria

After completing all tests, verify:

- [x] All 4 email templates send successfully
- [x] All emails render correctly on desktop and mobile
- [x] EmailLog entries created for every send
- [x] No errors in console logs
- [x] Spanish characters display correctly
- [x] Branding and styling look professional
- [x] Duplicate prevention works
- [x] Error handling is graceful
- [x] Cron endpoints are secure
- [x] Performance is acceptable

## Next Steps

Once manual testing is complete:

1. Configure production cron jobs
2. Set up Resend webhooks for delivery tracking (Phase 2)
3. Monitor EmailLog for first week of production
4. Gather user feedback on email content
5. Plan Phase 2 enhancements:
   - React Email templates
   - Email template customization per tenant
   - Unsubscribe functionality
   - Email preferences
   - Multi-language support

---

## Support

If you encounter issues during testing:

1. Check `docs/EMAIL_SYSTEM.md` for architecture details
2. Review Resend dashboard for API errors
3. Check Prisma Studio EmailLog for error details
4. Create GitHub issue with error logs
5. Email: soporte@vetify.pro
