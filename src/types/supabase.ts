export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      AdminAuditLog: {
        Row: {
          action: Database["public"]["Enums"]["AdminAction"]
          createdAt: string
          id: string
          metadata: Json | null
          performedBy: string | null
          targetEmail: string
          targetUserId: string
        }
        Insert: {
          action: Database["public"]["Enums"]["AdminAction"]
          createdAt?: string
          id?: string
          metadata?: Json | null
          performedBy?: string | null
          targetEmail: string
          targetUserId: string
        }
        Update: {
          action?: Database["public"]["Enums"]["AdminAction"]
          createdAt?: string
          id?: string
          metadata?: Json | null
          performedBy?: string | null
          targetEmail?: string
          targetUserId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AdminAuditLog_performedBy_fkey"
            columns: ["performedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      // ... (continuing with all other tables - truncated for readability in this example)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      AdminAction: "ASSIGNED" | "REMOVED" | "SETUP_COMPLETED"
      AppointmentRequestStatus:
        | "PENDING"
        | "CONFIRMED"
        | "REJECTED"
        | "CANCELLED"
        | "CONVERTED_TO_APPOINTMENT"
      AppointmentStatus:
        | "SCHEDULED"
        | "CONFIRMED"
        | "CHECKED_IN"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED_CLIENT"
        | "CANCELLED_CLINIC"
        | "NO_SHOW"
      DewormingType: "INTERNAL" | "EXTERNAL" | "BOTH"
      DrawerStatus: "OPEN" | "CLOSED" | "RECONCILED"
      InventoryCategory:
        | "MEDICINE"
        | "VACCINE"
        | "DEWORMER"
        | "FLEA_TICK_PREVENTION"
        | "FOOD_PRESCRIPTION"
        | "FOOD_REGULAR"
        | "SUPPLEMENT"
        | "ACCESSORY"
        | "CONSUMABLE_CLINIC"
        | "SURGICAL_MATERIAL"
        | "LAB_SUPPLIES"
        | "HYGIENE_GROOMING"
        | "OTHER"
      InventoryStatus:
        | "ACTIVE"
        | "INACTIVE"
        | "LOW_STOCK"
        | "OUT_OF_STOCK"
        | "EXPIRED"
        | "DISCONTINUED"
      InviteStatus: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"
      MedicalOrderStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      MovementType:
        | "PURCHASE_IN"
        | "SALE_OUT"
        | "RETURN_IN"
        | "ADJUSTMENT_IN"
        | "ADJUSTMENT_OUT"
        | "TRANSFER_IN"
        | "TRANSFER_OUT"
        | "EXPIRY_OUT"
      PaymentMethod:
        | "CASH"
        | "CREDIT_CARD"
        | "DEBIT_CARD"
        | "BANK_TRANSFER"
        | "MOBILE_PAYMENT"
        | "CHECK"
        | "INSURANCE"
        | "OTHER"
      PlanType: "PROFESIONAL" | "CLINICA" | "EMPRESA"
      ReminderStatus: "PENDING" | "SENT" | "ERROR" | "DISMISSED"
      ReminderType:
        | "APPOINTMENT"
        | "TREATMENT"
        | "MEDICATION"
        | "FOOD_REORDER"
        | "CHECKUP"
        | "BIRTHDAY"
        | "OTHER"
      SaleStatus:
        | "PENDING"
        | "PAID"
        | "PARTIALLY_PAID"
        | "COMPLETED"
        | "CANCELLED"
        | "REFUNDED"
        | "PARTIALLY_REFUNDED"
      ServiceCategory:
        | "CONSULTATION"
        | "SURGERY"
        | "VACCINATION"
        | "DEWORMING"
        | "PREVENTATIVE_CARE"
        | "GROOMING"
        | "BOARDING"
        | "DENTAL_CARE"
        | "LABORATORY_TEST"
        | "IMAGING_RADIOLOGY"
        | "HOSPITALIZATION"
        | "EMERGENCY_CARE"
        | "EUTHANASIA"
        | "OTHER"
      SubscriptionStatus:
        | "ACTIVE"
        | "TRIALING"
        | "PAST_DUE"
        | "CANCELED"
        | "UNPAID"
        | "INCOMPLETE"
        | "INCOMPLETE_EXPIRED"
        | "INACTIVE"
      TenantStatus: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "PENDING_SETUP"
      TransactionType:
        | "SALE_CASH"
        | "REFUND_CASH"
        | "DEPOSIT"
        | "WITHDRAWAL"
        | "ADJUSTMENT_IN"
        | "ADJUSTMENT_OUT"
      TreatmentStatus:
        | "SCHEDULED"
        | "COMPLETED"
        | "OVERDUE"
        | "CANCELLED"
        | "SKIPPED"
      TreatmentType:
        | "VACCINATION"
        | "DEWORMING"
        | "FLEA_TICK"
        | "OTHER_PREVENTATIVE"
      VaccinationStage: "PUPPY_KITTEN" | "ADULT" | "SENIOR" | "BOOSTER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
