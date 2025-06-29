# Business Hours Setup Guide

This guide explains how to configure business hours for the appointment availability system in Vetify.

## Current Configuration

The appointment availability system is configured with default business hours in the file `/src/app/api/appointments/availability/route.ts`. Here's the current configuration:

```javascript
const BUSINESS_HOURS = {
  start: 8,         // 8:00 AM
  end: 18,         // 6:00 PM  
  lunchStart: 13,  // 1:00 PM
  lunchEnd: 14,    // 2:00 PM
  slotDuration: 15, // 15 minutes per slot
  workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0 = Sunday, 6 = Saturday)
};
```

## How to Customize Business Hours

### 1. Change Operating Hours

To modify when your clinic is open:

```javascript
const BUSINESS_HOURS = {
  start: 9,         // Opens at 9:00 AM
  end: 17,         // Closes at 5:00 PM
  // ... rest of config
};
```

### 2. Modify Lunch Break

To change lunch hours or disable lunch break:

```javascript
// Custom lunch hours
const BUSINESS_HOURS = {
  lunchStart: 12,  // 12:00 PM
  lunchEnd: 13,    // 1:00 PM
  // ... rest of config
};

// No lunch break (work continuously)
const BUSINESS_HOURS = {
  lunchStart: 0,   // Set to 0
  lunchEnd: 0,     // Set to 0
  // ... rest of config
};
```

### 3. Change Working Days

To modify which days your clinic operates:

```javascript
// Monday to Friday only
workingDays: [1, 2, 3, 4, 5]

// Tuesday to Saturday  
workingDays: [2, 3, 4, 5, 6]

// Every day including Sunday
workingDays: [0, 1, 2, 3, 4, 5, 6]
```

**Day codes:**
- 0 = Sunday
- 1 = Monday  
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

### 4. Adjust Appointment Slot Duration

To change how long each time slot is:

```javascript
const BUSINESS_HOURS = {
  slotDuration: 30, // 30-minute slots
  // or
  slotDuration: 20, // 20-minute slots
  // ... rest of config
};
```

## Common Configurations

### Standard Veterinary Clinic
```javascript
const BUSINESS_HOURS = {
  start: 8,         // 8:00 AM
  end: 18,         // 6:00 PM
  lunchStart: 13,  // 1:00 PM  
  lunchEnd: 14,    // 2:00 PM
  slotDuration: 30, // 30-minute appointments
  workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
};
```

### Emergency Clinic (24/7)
```javascript
const BUSINESS_HOURS = {
  start: 0,         // Midnight
  end: 24,         // Midnight next day
  lunchStart: 0,   // No lunch break
  lunchEnd: 0,     
  slotDuration: 15, // 15-minute slots
  workingDays: [0, 1, 2, 3, 4, 5, 6], // Every day
};
```

### Part-time Clinic
```javascript
const BUSINESS_HOURS = {
  start: 9,         // 9:00 AM
  end: 15,         // 3:00 PM
  lunchStart: 12,  // 12:00 PM
  lunchEnd: 13,    // 1:00 PM
  slotDuration: 45, // 45-minute appointments
  workingDays: [1, 3, 5], // Monday, Wednesday, Friday only
};
```

## After Making Changes

1. Save the changes to `/src/app/api/appointments/availability/route.ts`
2. Restart your development server or redeploy to production
3. Test the appointment booking system to ensure the new hours work correctly

## Troubleshooting

### "No hay horarios disponibles para esta fecha" (No available times for this date)

This message appears when:

1. **Selected day is not in workingDays**: Check if the day you're selecting is included in the `workingDays` array
2. **All time slots are booked**: The selected date has no available appointment slots
3. **Date is in the past**: Cannot book appointments for past dates
4. **Outside business hours**: The system only shows slots within the configured business hours

### API Returning 400 Errors

If you see 400 errors in the console:

1. Check that the date format is correct (YYYY-MM-DD)
2. Verify the duration parameter is a valid number between 15-300
3. Ensure the business hours configuration has valid values

### Calendar Not Showing Available Slots

1. Verify your business hours configuration is correct
2. Check that the selected date falls on a working day
3. Ensure there are no conflicting appointments in the database
4. Check browser console for any JavaScript errors

## Database Considerations

In the future, business hours can be moved to the database for per-tenant configuration. The current implementation uses a constant in the code for simplicity.

For multiple clinics or different schedules per staff member, consider:

1. Creating a `business_hours` table
2. Linking business hours to specific staff members
3. Allowing different hours for different services
4. Supporting special schedules for holidays or events 