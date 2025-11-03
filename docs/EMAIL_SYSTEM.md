# Vetify Email System Documentation

## Overview

Vetify uses Resend for transactional email delivery. The system includes professional Spanish-language email templates for appointment confirmations, reminders, inventory alerts, and treatment notifications.

## Architecture

### Core Components

```
src/lib/email/
├── email-service.ts          # Main Resend service wrapper
├── types.ts                   # TypeScript type definitions
├── inventory-alerts.ts        # Inventory low stock alerts
└── reminder-alerts.ts         # Treatment & appointment reminders

src/lib/notifications/
└── notification-logger.ts     # Database logging service

src/app/api/
├── inventory/alerts/          # Manual & cron inventory alerts
└── reminders/process/         # Cron reminder processing
```

### Database

**EmailLog Model** - Tracks all sent emails:
- Status: PENDING → SENT → DELIVERED/BOUNCED/FAILED
- Tenant-isolated logs
- Full audit trail with timestamps
- Resend message ID tracking

## Email Templates

All templates are fully responsive, Spanish-language, and branded:

### 1. Appointment Confirmation
**Trigger**: When appointment is created
**Recipient**: Pet owner (customer email)
**Content**:
- Appointment date & time
- Pet name & service
- Veterinarian name (if assigned)
- Clinic contact information
- Optional notes

### 2. Appointment Reminder
**Trigger**: 24 hours before appointment
**Recipient**: Pet owner
**Content**:
- Same as confirmation
- Emphasizes upcoming date
- Cancellation/reschedule information

### 3. Low Stock Alert
**Trigger**: Daily cron job or manual trigger
**Recipient**: Clinic staff with MANAGE_INVENTORY permission
**Content**:
- List of low stock items
- Current vs. minimum stock levels
- Product categories
- Alert timestamp

### 4. Treatment Reminder
**Trigger**: When reminder due date arrives
**Recipient**: Pet owner
**Content**:
- Pet name & treatment type
- Due date
- Veterinarian information
- Clinic contact details

## Environment Variables

Add these to your `.env` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@vetify.pro
RESEND_FROM_NAME=Vetify
RESEND_REPLY_TO=support@vetify.pro

# Cron Job Security
CRON_SECRET=your-secret-token-here
```

### Getting Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Create an API key in the dashboard
4. Add to `.env` file

## API Endpoints

### Manual Inventory Alert
```http
POST /api/inventory/alerts
Authorization: Required (authenticated user)
```

Manually trigger low stock alert for current tenant.

**Response:**
```json
{
  "success": true,
  "message": "Alert sent for 3 low stock items",
  "itemsCount": 3
}
```

### Cron: Check All Tenants Inventory
```http
GET /api/inventory/alerts?secret=CRON_SECRET
```

Check inventory for all active tenants and send alerts.

**Response:**
```json
{
  "success": true,
  "tenantsChecked": 15,
  "alertsSent": 3,
  "errors": {},
  "timestamp": "2025-11-03T14:30:00.000Z"
}
```

### Cron: Process All Reminders
```http
GET /api/reminders/process?secret=CRON_SECRET
```

Process treatment reminders and appointment reminders.

**Response:**
```json
{
  "success": true,
  "treatmentReminders": {
    "processed": 5,
    "sent": 5
  },
  "appointmentReminders": {
    "processed": 12,
    "sent": 10
  },
  "errors": [],
  "timestamp": "2025-11-03T14:30:00.000Z"
}
```

## Cron Job Setup

### Using Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/inventory/alerts?secret=YOUR_CRON_SECRET",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/reminders/process?secret=YOUR_CRON_SECRET",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedules:**
- Inventory alerts: Daily at 9:00 AM
- Reminders: Every hour

### Using External Cron (cron-job.org, EasyCron)

Set up HTTP GET requests:

1. **Inventory Alerts**
   URL: `https://your-domain.com/api/inventory/alerts?secret=YOUR_SECRET`
   Schedule: Daily at 9:00 AM

2. **Reminders**
   URL: `https://your-domain.com/api/reminders/process?secret=YOUR_SECRET`
   Schedule: Every hour

## Usage Examples

### Sending Test Email

```typescript
import { sendAppointmentConfirmation } from '@/lib/email/email-service';

const emailData = {
  template: 'appointment-confirmation' as const,
  to: {
    email: 'customer@example.com',
    name: 'Juan Pérez',
  },
  subject: 'Confirmación de Cita - Max',
  tenantId: 'tenant-uuid',
  data: {
    appointmentId: 'appt-uuid',
    petName: 'Max',
    ownerName: 'Juan Pérez',
    appointmentDate: new Date('2025-11-04T10:00:00'),
    appointmentTime: '10:00',
    serviceName: 'Consulta General',
    clinicName: 'Clínica Veterinaria Central',
    clinicPhone: '+52 55 1234 5678',
    clinicAddress: 'Av. Principal 123, CDMX',
  },
};

const result = await sendAppointmentConfirmation(emailData);

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Error:', result.error);
}
```

### Querying Email Logs

```typescript
import { getEmailLogs, getEmailStats } from '@/lib/notifications/notification-logger';

// Get recent emails for tenant
const logs = await getEmailLogs('tenant-uuid', {
  limit: 50,
  template: 'APPOINTMENT_CONFIRMATION',
  status: 'SENT',
});

// Get email statistics
const stats = await getEmailStats('tenant-uuid');
console.log(`Delivery rate: ${stats.deliveryRate}%`);
console.log(`Bounce rate: ${stats.bounceRate}%`);
```

## Testing

### Test Email Sending (Development)

```bash
# Set dry run mode in .env
NODE_ENV=test

# Email service will log instead of sending
# Check console output for email details
```

### Manual Test via API

```bash
# Trigger inventory alert
curl -X POST http://localhost:3000/api/inventory/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Process reminders (with cron secret)
curl "http://localhost:3000/api/reminders/process?secret=dev-secret-change-in-prod"
```

### Verify Email Logs

```bash
# Open Prisma Studio
pnpm prisma studio

# Navigate to EmailLog table
# Check status, sentAt, error fields
```

## Monitoring

### Email Delivery Status

Check the `EmailLog` table for:
- **SENT**: Email accepted by Resend
- **DELIVERED**: Email delivered to recipient
- **BOUNCED**: Email bounced (invalid address)
- **FAILED**: Error sending email

### Common Issues

#### Emails Not Sending
1. Check `RESEND_API_KEY` is set
2. Verify domain is verified in Resend
3. Check EmailLog table for error messages
4. Review server logs for exceptions

#### Low Delivery Rate
1. Check bounce rate in EmailLog
2. Verify email addresses are valid
3. Review Resend dashboard for issues
4. Check spam folder

#### Reminders Not Processing
1. Verify cron job is running
2. Check cron secret matches env variable
3. Review API logs for errors
4. Verify appointments/reminders exist in database

## Security

### Email Address Validation

All email addresses are validated before sending:
- Format validation (RFC 5322)
- Tenant isolation (only send to tenant's customers/staff)
- Permission checks for staff emails

### Cron Job Protection

Cron endpoints require secret token:
- Set `CRON_SECRET` in environment variables
- Use strong random value in production
- Rotate regularly
- Never commit to git

### Rate Limiting

Resend free tier limits:
- 100 emails/day (development)
- 3,000 emails/month

For production, consider Resend Pro.

## Troubleshooting

### Email Stuck in PENDING
- Check if Resend API is responding
- Verify API key is valid
- Review error logs in EmailLog table

### Bounced Emails
- Update customer email address
- Remove invalid emails from system
- Monitor bounce rate

### Cron Job Not Running
- Verify cron service is configured
- Check cron secret matches
- Review server logs for errors
- Test endpoint manually

## Future Enhancements

### Phase 2 Features
- [ ] React Email templates (more sophisticated)
- [ ] Email template customization per tenant
- [ ] Unsubscribe functionality
- [ ] Email preferences (opt-in/opt-out)
- [ ] Email scheduling (send later)
- [ ] Multi-language support (English)
- [ ] Email analytics dashboard
- [ ] Resend webhook integration for delivery status

### n8n Integration
- [ ] WhatsApp notifications via n8n
- [ ] SMS reminders via n8n
- [ ] Complex multi-step email sequences
- [ ] Marketing automation workflows

## Support

For issues or questions:
- Create issue in GitHub repository
- Email: support@vetify.pro
- Documentation: https://docs.vetify.pro

## License

This email system is part of Vetify and follows the project's license.
