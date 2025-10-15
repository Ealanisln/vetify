-- Migration 04: Operational Tables
-- Creates appointment, reminder, medical, and treatment tables

-- =============================================
-- APPOINTMENT TABLE
-- =============================================

CREATE TABLE "Appointment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "staffId" TEXT,
  "userId" TEXT,
  "dateTime" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER NOT NULL DEFAULT 30,
  "reason" TEXT NOT NULL,
  "notes" TEXT,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Appointment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "Appointment_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "Appointment_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "Appointment_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "Appointment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "Appointment" IS 'Scheduled appointments';

-- =============================================
-- APPOINTMENT REQUEST TABLE
-- =============================================

CREATE TABLE "AppointmentRequest" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "petName" TEXT NOT NULL,
  "service" TEXT,
  "preferredDate" TIMESTAMP(3),
  "preferredTime" TEXT,
  "notes" TEXT,
  "status" "AppointmentRequestStatus" NOT NULL DEFAULT 'PENDING',
  "source" TEXT NOT NULL DEFAULT 'PUBLIC_BOOKING',
  "identificationStatus" TEXT,
  "similarCustomerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppointmentRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "AppointmentRequest_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE "AppointmentRequest" IS 'Public booking appointment requests';
COMMENT ON COLUMN "AppointmentRequest"."identificationStatus" IS 'existing, new, needs_review';

-- =============================================
-- REMINDER TABLE
-- =============================================

CREATE TABLE "Reminder" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "petId" TEXT,
  "customerId" TEXT NOT NULL,
  "userId" TEXT,
  "type" "ReminderType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Reminder_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "Reminder_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "Reminder_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "Reminder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "Reminder" IS 'Automated reminders for appointments, treatments, etc.';

-- =============================================
-- MEDICAL HISTORY TABLE
-- =============================================

CREATE TABLE "MedicalHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "visitDate" TIMESTAMP(3) NOT NULL,
  "reasonForVisit" TEXT NOT NULL,
  "diagnosis" TEXT,
  "treatment" TEXT,
  "notes" TEXT,
  "medicalOrderId" TEXT UNIQUE,
  "staffId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MedicalHistory_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "MedicalHistory_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "MedicalHistory_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "MedicalHistory" IS 'Medical visit history for pets';

-- =============================================
-- TREATMENT RECORD TABLE
-- =============================================

CREATE TABLE "TreatmentRecord" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "treatmentType" "TreatmentType" NOT NULL,
  "productName" TEXT NOT NULL,
  "administrationDate" TIMESTAMP(3) NOT NULL,
  "batchNumber" TEXT,
  "manufacturer" TEXT,
  "staffId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "vaccineStage" "VaccinationStage",
  "dewormingType" "DewormingType",

  CONSTRAINT "TreatmentRecord_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "TreatmentRecord_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "TreatmentRecord_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "TreatmentRecord" IS 'Records of vaccinations, deworming, etc.';

-- =============================================
-- TREATMENT SCHEDULE TABLE
-- =============================================

CREATE TABLE "TreatmentSchedule" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "treatmentType" "TreatmentType" NOT NULL,
  "productName" TEXT,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "status" "TreatmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "reminderSent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "vaccineStage" "VaccinationStage",
  "dewormingType" "DewormingType",

  CONSTRAINT "TreatmentSchedule_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "TreatmentSchedule_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "TreatmentSchedule" IS 'Scheduled preventative treatments';

-- =============================================
-- INVENTORY MOVEMENT TABLE
-- =============================================

CREATE TABLE "InventoryMovement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "type" "MovementType" NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  "staffId" TEXT,
  "relatedRecordId" TEXT,
  "relatedRecordType" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryMovement_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "InventoryMovement_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "InventoryMovement_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "InventoryMovement" IS 'Track inventory stock changes';

-- =============================================
-- INDEXES
-- =============================================

-- Appointment indexes
CREATE INDEX "Appointment_tenantId_idx" ON "Appointment"("tenantId");
CREATE INDEX "Appointment_petId_idx" ON "Appointment"("petId");
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");
CREATE INDEX "Appointment_staffId_idx" ON "Appointment"("staffId");
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");
CREATE INDEX "Appointment_dateTime_idx" ON "Appointment"("dateTime");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- AppointmentRequest indexes
CREATE INDEX "AppointmentRequest_tenantId_status_idx" ON "AppointmentRequest"("tenantId", "status");
CREATE INDEX "AppointmentRequest_tenantId_createdAt_idx" ON "AppointmentRequest"("tenantId", "createdAt");
CREATE INDEX "AppointmentRequest_tenantId_identificationStatus_idx" ON "AppointmentRequest"("tenantId", "identificationStatus");

-- Reminder indexes
CREATE INDEX "Reminder_tenantId_idx" ON "Reminder"("tenantId");
CREATE INDEX "Reminder_petId_idx" ON "Reminder"("petId");
CREATE INDEX "Reminder_customerId_idx" ON "Reminder"("customerId");
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");
CREATE INDEX "Reminder_dueDate_idx" ON "Reminder"("dueDate");
CREATE INDEX "Reminder_status_idx" ON "Reminder"("status");

-- MedicalHistory indexes
CREATE INDEX "MedicalHistory_tenantId_idx" ON "MedicalHistory"("tenantId");
CREATE INDEX "MedicalHistory_petId_idx" ON "MedicalHistory"("petId");
CREATE INDEX "MedicalHistory_visitDate_idx" ON "MedicalHistory"("visitDate");
CREATE INDEX "MedicalHistory_medicalOrderId_idx" ON "MedicalHistory"("medicalOrderId");
CREATE INDEX "MedicalHistory_staffId_idx" ON "MedicalHistory"("staffId");

-- TreatmentRecord indexes
CREATE INDEX "TreatmentRecord_tenantId_idx" ON "TreatmentRecord"("tenantId");
CREATE INDEX "TreatmentRecord_petId_administrationDate_idx" ON "TreatmentRecord"("petId", "administrationDate");
CREATE INDEX "TreatmentRecord_treatmentType_idx" ON "TreatmentRecord"("treatmentType");
CREATE INDEX "TreatmentRecord_staffId_idx" ON "TreatmentRecord"("staffId");

-- TreatmentSchedule indexes
CREATE INDEX "TreatmentSchedule_tenantId_idx" ON "TreatmentSchedule"("tenantId");
CREATE INDEX "TreatmentSchedule_petId_scheduledDate_status_idx" ON "TreatmentSchedule"("petId", "scheduledDate", "status");
CREATE INDEX "TreatmentSchedule_status_scheduledDate_idx" ON "TreatmentSchedule"("status", "scheduledDate");

-- InventoryMovement indexes
CREATE INDEX "InventoryMovement_tenantId_idx" ON "InventoryMovement"("tenantId");
CREATE INDEX "InventoryMovement_itemId_date_idx" ON "InventoryMovement"("itemId", "date");
CREATE INDEX "InventoryMovement_staffId_idx" ON "InventoryMovement"("staffId");
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_appointment_updated_at BEFORE UPDATE ON "Appointment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointmentrequest_updated_at BEFORE UPDATE ON "AppointmentRequest"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_updated_at BEFORE UPDATE ON "Reminder"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicalhistory_updated_at BEFORE UPDATE ON "MedicalHistory"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatmentrecord_updated_at BEFORE UPDATE ON "TreatmentRecord"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatmentschedule_updated_at BEFORE UPDATE ON "TreatmentSchedule"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
