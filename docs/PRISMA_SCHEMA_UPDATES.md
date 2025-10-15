# Prisma Schema Updates Required

After applying the critical fixes migration, update your `prisma/schema.prisma` to match:

## 1. Update Cascading Rules

```prisma
// ==========================================
// FIX: CashDrawer Relations
// ==========================================
model CashDrawer {
  id               String            @id @default(uuid())
  tenantId         String
  openedAt         DateTime          @default(now())
  closedAt         DateTime?
  openedById       String
  closedById       String?
  initialAmount    Decimal           @db.Decimal(10, 2)
  finalAmount      Decimal?          @db.Decimal(10, 2)
  expectedAmount   Decimal?          @db.Decimal(10, 2)
  difference       Decimal?          @db.Decimal(10, 2)
  status           DrawerStatus      @default(OPEN)
  notes            String?           @db.Text
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  
  // ✅ FIXED: Changed from Restrict to SetNull
  closedBy         User?             @relation("CashDrawer_closedByToUser", fields: [closedById], references: [id], onDelete: SetNull)
  openedBy         User              @relation("CashDrawer_openedByToUser", fields: [openedById], references: [id])
  tenant           Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  cashTransactions CashTransaction[]

  @@index([tenantId])
  @@index([openedAt])
  @@index([status])
  @@index([openedById])
  @@index([closedById])
  @@index([tenantId, status, openedAt])  // ✅ NEW: Composite index
}

// ==========================================
// FIX: SaleItem Relations
// ==========================================
model SaleItem {
  id            String         @id @default(uuid())
  saleId        String
  itemId        String?
  serviceId     String?
  description   String
  quantity      Decimal        @db.Decimal(8, 2)
  unitPrice     Decimal        @db.Decimal(10, 2)
  discount      Decimal        @default(0) @db.Decimal(10, 2)
  total         Decimal        @db.Decimal(10, 2)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt  // ✅ NEW: Add updatedAt
  
  // ✅ FIXED: Changed from Restrict to SetNull
  inventoryItem InventoryItem? @relation(fields: [itemId], references: [id], onDelete: SetNull)
  sale          Sale           @relation(fields: [saleId], references: [id], onDelete: Cascade)
  service       Service?       @relation(fields: [serviceId], references: [id], onDelete: SetNull)

  @@index([saleId])
  @@index([itemId])
  @@index([serviceId])
}

// ==========================================
// FIX: Customer Relations
// ==========================================
model Pet {
  id                 String              @id @default(uuid())
  tenantId           String
  customerId         String
  internalId         String?
  name               String
  species            String
  breed              String
  dateOfBirth        DateTime
  gender             String
  weight             Decimal?            @db.Decimal(6, 2)
  weightUnit         String?
  microchipNumber    String?
  isNeutered         Boolean             @default(false)
  isDeceased         Boolean             @default(false)
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  
  appointments       Appointment[]
  medicalHistories   MedicalHistory[]
  medicalOrders      MedicalOrder[]
  tenant             Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ✅ FIXED: Changed from Restrict to Cascade
  customer           Customer            @relation(fields: [customerId], references: [id], onDelete: Cascade)
  reminders          Reminder[]
  sales              Sale[]
  treatmentRecords   TreatmentRecord[]
  treatmentSchedules TreatmentSchedule[]

  // ✅ OPTIMIZED: Reordered indexes (most specific first)
  @@index([tenantId, customerId])
  @@index([tenantId])
  @@index([customerId])
  @@index([name])
}

model Appointment {
  id          String            @id @default(uuid())
  tenantId    String
  petId       String
  customerId  String
  staffId     String?
  userId      String?
  dateTime    DateTime
  duration    Int               @default(30)
  reason      String
  notes       String?           @db.Text
  status      AppointmentStatus @default(SCHEDULED)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  tenant      Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  pet         Pet               @relation(fields: [petId], references: [id], onDelete: Cascade)
  // ✅ FIXED: Changed from Restrict to SetNull
  customer    Customer          @relation(fields: [customerId], references: [id], onDelete: SetNull)
  staff       Staff?            @relation(fields: [staffId], references: [id])
  user        User?             @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([petId])
  @@index([customerId])
  @@index([staffId])
  @@index([userId])
  @@index([dateTime])
  @@index([status])
  @@index([tenantId, status, dateTime])  // ✅ NEW: Composite index
}

model Reminder {
  id         String         @id @default(uuid())
  tenantId   String
  petId      String?
  customerId String
  userId     String?
  type       ReminderType
  title      String
  message    String
  dueDate    DateTime
  status     ReminderStatus @default(PENDING)
  sentAt     DateTime?
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
  
  tenant     Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  pet        Pet?           @relation(fields: [petId], references: [id], onDelete: Cascade)
  // ✅ FIXED: Changed from Restrict to SetNull
  customer   Customer       @relation(fields: [customerId], references: [id], onDelete: SetNull)
  user       User?          @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([petId])
  @@index([customerId])
  @@index([userId])
  @@index([dueDate])
  @@index([status])
  @@index([tenantId, status, dueDate])  // ✅ NEW: Composite index
}

model Sale {
  id           String        @id @default(uuid())
  tenantId     String
  customerId   String
  petId        String?
  userId       String?
  staffId      String?
  saleNumber   String        @unique
  subtotal     Decimal       @db.Decimal(10, 2)
  tax          Decimal       @default(0) @db.Decimal(10, 2)
  discount     Decimal       @default(0) @db.Decimal(10, 2)
  total        Decimal       @db.Decimal(10, 2)
  status       SaleStatus    @default(PENDING)
  notes        String?       @db.Text
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  
  tenant       Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ✅ FIXED: Changed from Restrict to SetNull
  customer     Customer      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  pet          Pet?          @relation(fields: [petId], references: [id])
  user         User?         @relation(fields: [userId], references: [id])
  staff        Staff?        @relation(fields: [staffId], references: [id])
  items        SaleItem[]
  payments     SalePayment[]
  medicalOrder MedicalOrder?

  @@index([tenantId])
  @@index([customerId])
  @@index([petId])
  @@index([userId])
  @@index([staffId])
  @@index([saleNumber])
  @@index([status])
  @@index([createdAt])
  @@index([tenantId, status, createdAt])  // ✅ NEW: Composite index
}
```

## 2. Add Missing Timestamps

```prisma
model Prescription {
  id           String        @id @default(uuid())
  orderId      String
  productId    String
  quantity     Decimal       @db.Decimal(8, 2)
  unitPrice    Decimal       @db.Decimal(10, 2)
  dosage       String?
  frequency    String?
  duration     String?
  instructions String?       @db.Text
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt  // ✅ NEW: Add this
  
  order        MedicalOrder  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product      InventoryItem @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
}

model CashTransaction {
  id                String           @id @default(uuid())
  drawerId          String
  amount            Decimal          @db.Decimal(10, 2)
  type              TransactionType
  description       String?
  relatedId         String?
  relatedType       String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt  // ✅ NEW: Add this
  
  cashDrawer        CashDrawer       @relation(fields: [drawerId], references: [id], onDelete: Cascade)
  SalePayment       SalePayment?

  @@index([drawerId])
  @@index([relatedId, relatedType])
  @@index([type])
}

model SalePayment {
  id                String           @id @default(uuid())
  saleId            String
  paymentMethod     PaymentMethod
  amount            Decimal          @db.Decimal(10, 2)
  paymentDate       DateTime         @default(now())
  transactionId     String?
  notes             String?
  cashTransactionId String?          @unique
  createdAt         DateTime         @default(now())  // ✅ NEW: Add this (if missing)
  updatedAt         DateTime         @updatedAt       // ✅ NEW: Add this
  
  cashTransaction   CashTransaction? @relation(fields: [cashTransactionId], references: [id])
  sale              Sale             @relation(fields: [saleId], references: [id], onDelete: Cascade)

  @@index([saleId])
  @@index([paymentMethod])
  @@index([paymentDate])
  @@index([cashTransactionId])
}

model InventoryMovement {
  id                String        @id @default(uuid())
  tenantId          String
  itemId            String
  type              MovementType
  quantity          Decimal       @db.Decimal(8, 2)
  date              DateTime      @default(now())
  reason            String?
  staffId           String?
  relatedRecordId   String?
  relatedRecordType String?
  notes             String?       @db.Text
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt  // ✅ NEW: Add this
  
  item              InventoryItem @relation(fields: [itemId], references: [id])
  staff             Staff?        @relation(fields: [staffId], references: [id])
  tenant            Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([itemId, date])
  @@index([staffId])
  @@index([type])
}
```

## 3. Optimize Decimal Precision

Update all monetary and quantity fields:

```prisma
model Sale {
  subtotal     Decimal       @db.Decimal(10, 2)  // ✅ Was: Decimal(65,30)
  tax          Decimal       @default(0) @db.Decimal(10, 2)
  discount     Decimal       @default(0) @db.Decimal(10, 2)
  total        Decimal       @db.Decimal(10, 2)
}

model InventoryItem {
  quantity       Decimal             @default(0) @db.Decimal(8, 2)
  minStock       Decimal?            @db.Decimal(8, 2)
  cost           Decimal?            @db.Decimal(10, 2)
  price          Decimal?            @db.Decimal(10, 2)
}

model Pet {
  weight             Decimal?            @db.Decimal(6, 2)
}

model Plan {
  monthlyPrice        Decimal    @db.Decimal(10, 2)
  annualPrice         Decimal    @db.Decimal(10, 2)
}

model Service {
  price       Decimal    @db.Decimal(10, 2)
}

model TenantSettings {
  taxRate              Decimal  @default(0) @db.Decimal(5, 4)  // For percentages like 0.1650
}
```

## 4. Add New Composite Indexes

```prisma
model InventoryItem {
  // ... existing indexes
  @@index([tenantId, status, quantity])  // ✅ NEW: For low stock queries
}

model Staff {
  // ... existing indexes
  @@index([tenantId, isActive])  // ✅ NEW: For active staff lookup
}

model Service {
  // ... existing indexes
  @@index([tenantId, isActive, category])  // ✅ NEW: For filtered service lookup
}

model TreatmentSchedule {
  // ... existing indexes
  @@index([tenantId, status, scheduledDate])  // ✅ NEW: For overdue treatment lookup
}

model MedicalHistory {
  // ... existing indexes
  @@index([tenantId, visitDate])  // ✅ NEW: For date range queries
}
```

## 5. Add Text Annotations

```prisma
model Customer {
  notes            String?             @db.Text  // ✅ Add @db.Text
  reviewNotes      String?             @db.Text  // ✅ Already has it
}

model Pet {
  // No large text fields
}

model Appointment {
  notes       String?           @db.Text  // ✅ Add @db.Text
}

model MedicalHistory {
  reasonForVisit String    @db.Text  // ✅ Add @db.Text if long
  diagnosis      String?   @db.Text
  treatment      String?   @db.Text
  notes          String?   @db.Text
}

model CashDrawer {
  notes            String?  @db.Text  // ✅ Add @db.Text
}

model Sale {
  notes        String?       @db.Text  // ✅ Add @db.Text
}
```

## 6. Add Check Constraints

Note: Prisma doesn't support CHECK constraints in schema yet. They must be added via raw SQL in migrations. But you can document them as comments:

```prisma
model Sale {
  total        Decimal       @db.Decimal(10, 2)  // CHECK: total >= 0
}

model InventoryItem {
  quantity     Decimal       @default(0) @db.Decimal(8, 2)  // CHECK: quantity >= 0
}

model SalePayment {
  amount       Decimal       @db.Decimal(10, 2)  // CHECK: amount > 0
}

model Appointment {
  duration     Int           @default(30)  // CHECK: duration BETWEEN 5 AND 480
}

model TenantSettings {
  taxRate      Decimal       @default(0) @db.Decimal(5, 4)  // CHECK: taxRate BETWEEN 0 AND 1
}
```

## 7. Run After Schema Update

```bash
# 1. Format the schema
npx prisma format

# 2. Validate the schema
npx prisma validate

# 3. Generate Prisma Client
npx prisma generate

# 4. Create and apply the migration
npx prisma migrate dev --name fix_production_critical_issues

# 5. Verify in production (dry-run first)
npx prisma migrate deploy --preview-feature
```

## 8. Verify Changes

After updating the schema and running migrations:

```bash
# Check migration status
npx prisma migrate status

# Introspect database to verify
npx prisma db pull --print

# Run a test query
npx prisma studio
```

