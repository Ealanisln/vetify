/**
 * Validation Schemas Tests
 * VETIF-50: Phase 1 - Security Infrastructure
 *
 * Tests cover:
 * - Customer validation schemas
 * - Pet validation schemas
 * - Medical record schemas
 * - Appointment schemas
 * - Staff schemas
 * - Billing schemas
 * - Inventory schemas
 * - Webhook schemas
 */

import {
  customerSchemas,
  petSchemas,
  medicalSchemas,
  appointmentSchemas,
  staffSchemas,
  billingSchemas,
  inventorySchemas,
  webhookSchemas,
} from '@/lib/security/validation-schemas';

describe('Validation Schemas', () => {
  describe('Customer Schemas', () => {
    describe('create', () => {
      it('should validate a valid customer creation', () => {
        const validCustomer = {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+14155551234',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'California',
          postalCode: '94102',
          country: 'US',
        };

        expect(() => customerSchemas.create.parse(validCustomer)).not.toThrow();
      });

      it('should validate minimal customer with just name and email', () => {
        const minimalCustomer = {
          name: 'Jane Doe',
          email: 'jane@example.com',
        };

        expect(() => customerSchemas.create.parse(minimalCustomer)).not.toThrow();
      });

      it('should validate customer with emergency contact', () => {
        const customer = {
          name: 'John Doe',
          email: 'john@example.com',
          emergencyContact: {
            name: 'Jane Doe',
            phone: '+14155551234',
            relationship: 'Spouse',
          },
        };

        expect(() => customerSchemas.create.parse(customer)).not.toThrow();
      });

      it('should reject invalid email', () => {
        const invalid = {
          name: 'John Doe',
          email: 'invalid-email',
        };

        expect(() => customerSchemas.create.parse(invalid)).toThrow();
      });

      it('should reject invalid phone format', () => {
        const invalid = {
          name: 'John Doe',
          email: 'john@example.com',
          phone: 'abc-phone', // Contains letters and non-digits
        };

        expect(() => customerSchemas.create.parse(invalid)).toThrow();
      });

      it('should lowercase email', () => {
        const customer = {
          name: 'John Doe',
          email: 'JOHN@EXAMPLE.COM',
        };

        const result = customerSchemas.create.parse(customer);
        expect(result.email).toBe('john@example.com');
      });
    });

    describe('update', () => {
      it('should validate partial updates', () => {
        const update = {
          name: 'Updated Name',
        };

        expect(() => customerSchemas.update.parse(update)).not.toThrow();
      });

      it('should validate empty object (no updates)', () => {
        expect(() => customerSchemas.update.parse({})).not.toThrow();
      });
    });

    describe('query', () => {
      it('should validate search query', () => {
        const query = {
          search: 'john',
          page: '1',
          limit: '10',
        };

        const result = customerSchemas.query.parse(query);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
      });

      it('should reject invalid page format', () => {
        const query = {
          page: 'abc',
        };

        expect(() => customerSchemas.query.parse(query)).toThrow();
      });
    });
  });

  describe('Pet Schemas', () => {
    describe('create', () => {
      it('should validate a valid pet creation', () => {
        const validPet = {
          name: 'Buddy',
          species: 'DOG',
          breed: 'Golden Retriever',
          color: 'Golden',
          gender: 'MALE',
          customerId: 'cust_123',
        };

        expect(() => petSchemas.create.parse(validPet)).not.toThrow();
      });

      it('should validate all species types', () => {
        const species = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'FERRET', 'REPTILE', 'FISH', 'OTHER'];

        species.forEach((spec) => {
          const pet = {
            name: 'Pet',
            species: spec,
            customerId: 'cust_123',
          };
          expect(() => petSchemas.create.parse(pet)).not.toThrow();
        });
      });

      it('should validate all gender types', () => {
        const genders = ['MALE', 'FEMALE', 'UNKNOWN'];

        genders.forEach((gender) => {
          const pet = {
            name: 'Pet',
            species: 'DOG',
            gender,
            customerId: 'cust_123',
          };
          expect(() => petSchemas.create.parse(pet)).not.toThrow();
        });
      });

      it('should validate microchip ID format', () => {
        const pet = {
          name: 'Buddy',
          species: 'DOG',
          customerId: 'cust_123',
          microchipId: 'ABC-123-456',
        };

        expect(() => petSchemas.create.parse(pet)).not.toThrow();
      });

      it('should reject invalid microchip ID', () => {
        const pet = {
          name: 'Buddy',
          species: 'DOG',
          customerId: 'cust_123',
          microchipId: 'invalid@chip#id',
        };

        expect(() => petSchemas.create.parse(pet)).toThrow();
      });

      it('should reject invalid species', () => {
        const pet = {
          name: 'Buddy',
          species: 'DRAGON',
          customerId: 'cust_123',
        };

        expect(() => petSchemas.create.parse(pet)).toThrow();
      });
    });

    describe('update', () => {
      it('should validate partial updates', () => {
        const update = {
          name: 'New Name',
          weight: 15.5,
        };

        expect(() => petSchemas.update.parse(update)).not.toThrow();
      });
    });
  });

  describe('Medical Schemas', () => {
    describe('consultation', () => {
      it('should validate a valid consultation', () => {
        const consultation = {
          petId: 'pet_123',
          veterinarian_id: 'vet_456',
          reason: 'Annual checkup',
          status: 'SCHEDULED',
        };

        expect(() => medicalSchemas.consultation.parse(consultation)).not.toThrow();
      });

      it('should validate all consultation types', () => {
        const types = ['ROUTINE_CHECKUP', 'EMERGENCY', 'FOLLOW_UP', 'VACCINATION', 'SURGERY', 'DENTAL', 'GROOMING', 'OTHER'];

        types.forEach((type) => {
          const consultation = {
            petId: 'pet_123',
            veterinarian_id: 'vet_456',
            reason: 'Test',
            type,
          };
          expect(() => medicalSchemas.consultation.parse(consultation)).not.toThrow();
        });
      });

      it('should validate all status types', () => {
        const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

        statuses.forEach((status) => {
          const consultation = {
            petId: 'pet_123',
            veterinarian_id: 'vet_456',
            reason: 'Test',
            status,
          };
          expect(() => medicalSchemas.consultation.parse(consultation)).not.toThrow();
        });
      });
    });

    describe('vaccination', () => {
      it('should validate a valid vaccination record', () => {
        const vaccination = {
          petId: 'pet_123',
          vaccineType: 'Rabies',
          vaccineBrand: 'PetVax',
          batchNumber: 'BATCH-2024-001',
          administeredDate: '2024-01-15T10:00:00Z',
          nextDueDate: '2025-01-15T10:00:00Z',
          staffId: 'staff_789',
        };

        expect(() => medicalSchemas.vaccination.parse(vaccination)).not.toThrow();
      });

      it('should validate batch number format', () => {
        const vaccination = {
          petId: 'pet_123',
          vaccineType: 'Rabies',
          batchNumber: 'ABC-123-DEF',
          administeredDate: '2024-01-15T10:00:00Z',
          staffId: 'staff_789',
        };

        expect(() => medicalSchemas.vaccination.parse(vaccination)).not.toThrow();
      });

      it('should reject invalid batch number', () => {
        const vaccination = {
          petId: 'pet_123',
          vaccineType: 'Rabies',
          batchNumber: 'invalid@batch#number',
          administeredDate: '2024-01-15T10:00:00Z',
          staffId: 'staff_789',
        };

        expect(() => medicalSchemas.vaccination.parse(vaccination)).toThrow();
      });
    });

    describe('vitals', () => {
      it('should validate valid vital signs', () => {
        const vitals = {
          petId: 'pet_123',
          weight: 25.5,
          temperature: 38.5,
          heartRate: 80,
          respiratoryRate: 20,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          recordedBy: 'staff_123',
          recordedAt: '2024-01-15T10:00:00Z',
        };

        expect(() => medicalSchemas.vitals.parse(vitals)).not.toThrow();
      });

      it('should validate temperature range (35-45 C)', () => {
        const validTemps = [35, 38.5, 40, 45];

        validTemps.forEach((temp) => {
          const vitals = {
            petId: 'pet_123',
            temperature: temp,
            recordedBy: 'staff_123',
            recordedAt: '2024-01-15T10:00:00Z',
          };
          expect(() => medicalSchemas.vitals.parse(vitals)).not.toThrow();
        });
      });

      it('should reject out of range temperature', () => {
        const invalidTemps = [30, 50];

        invalidTemps.forEach((temp) => {
          const vitals = {
            petId: 'pet_123',
            temperature: temp,
            recordedBy: 'staff_123',
            recordedAt: '2024-01-15T10:00:00Z',
          };
          expect(() => medicalSchemas.vitals.parse(vitals)).toThrow();
        });
      });

      it('should validate heart rate range (10-300 BPM)', () => {
        const validRates = [10, 80, 150, 300];

        validRates.forEach((rate) => {
          const vitals = {
            petId: 'pet_123',
            heartRate: rate,
            recordedBy: 'staff_123',
            recordedAt: '2024-01-15T10:00:00Z',
          };
          expect(() => medicalSchemas.vitals.parse(vitals)).not.toThrow();
        });
      });

      it('should reject out of range heart rate', () => {
        const invalidRates = [5, 350];

        invalidRates.forEach((rate) => {
          const vitals = {
            petId: 'pet_123',
            heartRate: rate,
            recordedBy: 'staff_123',
            recordedAt: '2024-01-15T10:00:00Z',
          };
          expect(() => medicalSchemas.vitals.parse(vitals)).toThrow();
        });
      });
    });

    describe('treatment', () => {
      it('should validate all treatment types', () => {
        const types = ['MEDICATION', 'SURGERY', 'THERAPY', 'PROCEDURE', 'DIAGNOSTIC', 'OTHER'];

        types.forEach((type) => {
          const treatment = {
            petId: 'pet_123',
            type,
            name: 'Treatment',
            startDate: '2024-01-15T10:00:00Z',
            staffId: 'staff_123',
          };
          expect(() => medicalSchemas.treatment.parse(treatment)).not.toThrow();
        });
      });

      it('should validate all treatment statuses', () => {
        const statuses = ['ACTIVE', 'COMPLETED', 'DISCONTINUED', 'PAUSED'];

        statuses.forEach((status) => {
          const treatment = {
            petId: 'pet_123',
            type: 'MEDICATION',
            name: 'Treatment',
            startDate: '2024-01-15T10:00:00Z',
            staffId: 'staff_123',
            status,
          };
          expect(() => medicalSchemas.treatment.parse(treatment)).not.toThrow();
        });
      });
    });
  });

  describe('Appointment Schemas', () => {
    describe('create', () => {
      it('should validate a valid appointment', () => {
        const appointment = {
          dateTime: '2024-01-20T14:00:00Z',
          duration: 30,
          customerId: 'cust_123',
          petId: 'pet_456',
          reason: 'Annual checkup',
          type: 'ROUTINE_CHECKUP',
        };

        expect(() => appointmentSchemas.create.parse(appointment)).not.toThrow();
      });

      it('should validate all appointment types', () => {
        const types = ['ROUTINE_CHECKUP', 'EMERGENCY', 'FOLLOW_UP', 'VACCINATION', 'SURGERY', 'DENTAL', 'GROOMING', 'CONSULTATION', 'OTHER'];

        types.forEach((type) => {
          const appointment = {
            dateTime: '2024-01-20T14:00:00Z',
            customerId: 'cust_123',
            petId: 'pet_456',
            reason: 'Test',
            type,
          };
          expect(() => appointmentSchemas.create.parse(appointment)).not.toThrow();
        });
      });

      it('should validate all status types', () => {
        const statuses = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'];

        statuses.forEach((status) => {
          const appointment = {
            dateTime: '2024-01-20T14:00:00Z',
            customerId: 'cust_123',
            petId: 'pet_456',
            reason: 'Test',
            type: 'ROUTINE_CHECKUP',
            status,
          };
          expect(() => appointmentSchemas.create.parse(appointment)).not.toThrow();
        });
      });

      it('should validate all priority levels', () => {
        const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

        priorities.forEach((priority) => {
          const appointment = {
            dateTime: '2024-01-20T14:00:00Z',
            customerId: 'cust_123',
            petId: 'pet_456',
            reason: 'Test',
            type: 'ROUTINE_CHECKUP',
            priority,
          };
          expect(() => appointmentSchemas.create.parse(appointment)).not.toThrow();
        });
      });

      it('should validate duration range (15-480 minutes)', () => {
        const validDurations = [15, 30, 60, 120, 480];

        validDurations.forEach((duration) => {
          const appointment = {
            dateTime: '2024-01-20T14:00:00Z',
            customerId: 'cust_123',
            petId: 'pet_456',
            reason: 'Test',
            type: 'ROUTINE_CHECKUP',
            duration,
          };
          expect(() => appointmentSchemas.create.parse(appointment)).not.toThrow();
        });
      });

      it('should reject invalid duration', () => {
        const invalidDurations = [10, 500];

        invalidDurations.forEach((duration) => {
          const appointment = {
            dateTime: '2024-01-20T14:00:00Z',
            customerId: 'cust_123',
            petId: 'pet_456',
            reason: 'Test',
            type: 'ROUTINE_CHECKUP',
            duration,
          };
          expect(() => appointmentSchemas.create.parse(appointment)).toThrow();
        });
      });
    });

    describe('query', () => {
      it('should validate date range query', () => {
        const query = {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          status: 'SCHEDULED',
        };

        expect(() => appointmentSchemas.query.parse(query)).not.toThrow();
      });
    });
  });

  describe('Staff Schemas', () => {
    describe('create', () => {
      it('should validate a valid staff member', () => {
        const staff = {
          name: 'Dr. Smith',
          email: 'dr.smith@vetify.com',
          phone: '+14155551234',
          position: 'VETERINARIAN',
          licenseNumber: 'VET-2024-001',
        };

        expect(() => staffSchemas.create.parse(staff)).not.toThrow();
      });

      it('should validate all position types', () => {
        const positions = ['VETERINARIAN', 'VETERINARY_TECHNICIAN', 'ASSISTANT', 'RECEPTIONIST', 'MANAGER', 'GROOMER', 'OTHER'];

        positions.forEach((position) => {
          const staff = {
            name: 'Staff Member',
            email: 'staff@vetify.com',
            position,
          };
          expect(() => staffSchemas.create.parse(staff)).not.toThrow();
        });
      });

      it('should validate schedule format', () => {
        const staff = {
          name: 'Dr. Smith',
          email: 'dr.smith@vetify.com',
          position: 'VETERINARIAN',
          schedule: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
          },
        };

        expect(() => staffSchemas.create.parse(staff)).not.toThrow();
      });

      it('should reject invalid schedule time format', () => {
        const staff = {
          name: 'Dr. Smith',
          email: 'dr.smith@vetify.com',
          position: 'VETERINARIAN',
          schedule: {
            monday: { start: '9:00 AM', end: '5:00 PM' }, // Invalid format
          },
        };

        expect(() => staffSchemas.create.parse(staff)).toThrow();
      });
    });
  });

  describe('Billing Schemas', () => {
    describe('invoice', () => {
      it('should validate a valid invoice', () => {
        const invoice = {
          customerId: 'cust_123',
          items: [
            {
              description: 'Consultation',
              quantity: 1,
              unitPrice: 50,
              total: 50,
            },
          ],
          subtotal: 50,
          tax: 5,
          total: 55,
        };

        expect(() => billingSchemas.invoice.parse(invoice)).not.toThrow();
      });

      it('should require at least one item', () => {
        const invoice = {
          customerId: 'cust_123',
          items: [],
          subtotal: 0,
          total: 0,
        };

        expect(() => billingSchemas.invoice.parse(invoice)).toThrow();
      });

      it('should validate currency code', () => {
        const invoice = {
          customerId: 'cust_123',
          items: [{ description: 'Item', quantity: 1, unitPrice: 10, total: 10 }],
          subtotal: 10,
          total: 10,
          currency: 'MXN',
        };

        expect(() => billingSchemas.invoice.parse(invoice)).not.toThrow();
      });
    });

    describe('payment', () => {
      it('should validate a valid payment', () => {
        const payment = {
          invoiceId: 'inv_123',
          amount: 100,
          method: 'CARD',
          reference: 'ch_12345',
        };

        expect(() => billingSchemas.payment.parse(payment)).not.toThrow();
      });

      it('should validate all payment methods', () => {
        const methods = ['CASH', 'CARD', 'CHECK', 'BANK_TRANSFER', 'OTHER'];

        methods.forEach((method) => {
          const payment = {
            invoiceId: 'inv_123',
            amount: 100,
            method,
          };
          expect(() => billingSchemas.payment.parse(payment)).not.toThrow();
        });
      });
    });
  });

  describe('Inventory Schemas', () => {
    describe('item', () => {
      it('should validate a valid inventory item', () => {
        const item = {
          name: 'Dog Food Premium',
          category: 'FOOD',
          unit: 'KILOGRAM',
          costPrice: 25,
          salePrice: 35,
          minStock: 10,
          currentStock: 50,
        };

        expect(() => inventorySchemas.item.parse(item)).not.toThrow();
      });

      it('should validate all category types', () => {
        const categories = ['MEDICATION', 'SUPPLIES', 'EQUIPMENT', 'FOOD', 'TOYS', 'OTHER'];

        categories.forEach((category) => {
          const item = {
            name: 'Item',
            category,
            unit: 'PIECE',
            costPrice: 10,
            salePrice: 15,
            minStock: 5,
            currentStock: 20,
          };
          expect(() => inventorySchemas.item.parse(item)).not.toThrow();
        });
      });

      it('should validate all unit types', () => {
        const units = ['PIECE', 'BOX', 'BOTTLE', 'VIAL', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'OTHER'];

        units.forEach((unit) => {
          const item = {
            name: 'Item',
            category: 'MEDICATION',
            unit,
            costPrice: 10,
            salePrice: 15,
            minStock: 5,
            currentStock: 20,
          };
          expect(() => inventorySchemas.item.parse(item)).not.toThrow();
        });
      });

      it('should validate SKU format', () => {
        const item = {
          name: 'Item',
          category: 'MEDICATION',
          unit: 'PIECE',
          costPrice: 10,
          salePrice: 15,
          minStock: 5,
          currentStock: 20,
          sku: 'SKU-2024-001',
        };

        expect(() => inventorySchemas.item.parse(item)).not.toThrow();
      });

      it('should reject invalid SKU format', () => {
        const item = {
          name: 'Item',
          category: 'MEDICATION',
          unit: 'PIECE',
          costPrice: 10,
          salePrice: 15,
          minStock: 5,
          currentStock: 20,
          sku: 'invalid@sku#format',
        };

        expect(() => inventorySchemas.item.parse(item)).toThrow();
      });
    });

    describe('stockMovement', () => {
      it('should validate a valid stock movement', () => {
        const movement = {
          itemId: 'item_123',
          type: 'IN',
          quantity: 50,
          reason: 'Restock from supplier',
        };

        expect(() => inventorySchemas.stockMovement.parse(movement)).not.toThrow();
      });

      it('should validate all movement types', () => {
        const types = ['IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED'];

        types.forEach((type) => {
          const movement = {
            itemId: 'item_123',
            type,
            quantity: type === 'IN' ? 10 : -10,
            reason: 'Test movement',
          };
          expect(() => inventorySchemas.stockMovement.parse(movement)).not.toThrow();
        });
      });

      it('should allow negative quantities for adjustments', () => {
        const movement = {
          itemId: 'item_123',
          type: 'ADJUSTMENT',
          quantity: -5,
          reason: 'Inventory correction',
        };

        expect(() => inventorySchemas.stockMovement.parse(movement)).not.toThrow();
      });
    });
  });

  describe('Webhook Schemas', () => {
    describe('stripe', () => {
      it('should validate a valid Stripe webhook payload', () => {
        const payload = {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              amount_total: 5000,
            },
          },
          created: 1704067200,
          livemode: false,
        };

        expect(() => webhookSchemas.stripe.parse(payload)).not.toThrow();
      });
    });

    describe('whatsapp', () => {
      it('should validate a valid WhatsApp webhook payload', () => {
        const payload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: '123',
              changes: [],
            },
          ],
        };

        expect(() => webhookSchemas.whatsapp.parse(payload)).not.toThrow();
      });
    });

    describe('n8n', () => {
      it('should validate a valid n8n webhook payload', () => {
        const payload = {
          workflowId: 'workflow_123',
          executionId: 'exec_456',
          data: { key: 'value' },
        };

        expect(() => webhookSchemas.n8n.parse(payload)).not.toThrow();
      });
    });
  });
});

describe('Schema Security Edge Cases', () => {
  it('should sanitize XSS in customer name', () => {
    const customer = {
      name: '<script>alert("xss")</script>John Doe',
      email: 'john@example.com',
    };

    const result = customerSchemas.create.parse(customer);
    expect(result.name).not.toContain('<script>');
    expect(result.name).toContain('John Doe');
  });

  it('should sanitize XSS in pet notes', () => {
    const pet = {
      name: 'Buddy',
      species: 'DOG',
      customerId: 'cust_123',
      notes: '<script>evil()</script>Good dog',
    };

    const result = petSchemas.create.parse(pet);
    expect(result.notes).not.toContain('<script>');
  });

  it('should sanitize XSS in medical diagnosis', () => {
    const consultation = {
      petId: 'pet_123',
      veterinarian_id: 'vet_456',
      reason: 'Checkup',
      diagnosis: '<script>steal()</script>Healthy',
    };

    const result = medicalSchemas.consultation.parse(consultation);
    expect(result.diagnosis).not.toContain('<script>');
  });

  it('should sanitize XSS in appointment notes', () => {
    const appointment = {
      dateTime: '2024-01-20T14:00:00Z',
      customerId: 'cust_123',
      petId: 'pet_456',
      reason: 'Checkup',
      type: 'ROUTINE_CHECKUP' as const,
      notes: '<iframe src="evil.com"></iframe>Needs follow-up',
    };

    const result = appointmentSchemas.create.parse(appointment);
    expect(result.notes).not.toContain('<iframe');
  });
});
