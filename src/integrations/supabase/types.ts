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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          assigned_to: string | null
          code: string
          created_at: string
          id: string
          notes: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          used: boolean
          used_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          code: string
          created_at?: string
          id?: string
          notes?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          used?: boolean
          used_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          code?: string
          created_at?: string
          id?: string
          notes?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          reason: string | null
          success: boolean
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          reason?: string | null
          success?: boolean
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          reason?: string | null
          success?: boolean
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          area: string | null
          budget_max: number | null
          budget_min: number | null
          category_slug: string
          city: string
          created_at: string
          customer_id: string
          description: string
          id: string
          preferred_time: string | null
          responses_count: number
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          urgent: boolean
        }
        Insert: {
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category_slug: string
          city?: string
          created_at?: string
          customer_id: string
          description: string
          id?: string
          preferred_time?: string | null
          responses_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          urgent?: boolean
        }
        Update: {
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category_slug?: string
          city?: string
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          preferred_time?: string | null
          responses_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          urgent?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_unlocked: boolean
          area: string | null
          bio: string | null
          category: string | null
          city: string | null
          created_at: string
          documents_verified: boolean
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          mobile: string | null
          mobile_verified: boolean
          photo_url: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          role: Database["public"]["Enums"]["user_type"]
          updated_at: string
          verified: boolean
        }
        Insert: {
          access_unlocked?: boolean
          area?: string | null
          bio?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          documents_verified?: boolean
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id: string
          mobile?: string | null
          mobile_verified?: boolean
          photo_url?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          role?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          access_unlocked?: boolean
          area?: string | null
          bio?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          documents_verified?: boolean
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          mobile?: string | null
          mobile_verified?: boolean
          photo_url?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          role?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_job_phone: { Args: { _job_id: string }; Returns: string }
      get_public_profile: {
        Args: { _id: string }
        Returns: {
          area: string
          bio: string
          category: string
          city: string
          experience_years: number
          full_name: string
          id: string
          photo_url: string
          plan: Database["public"]["Enums"]["plan_tier"]
          role: Database["public"]["Enums"]["user_type"]
          verified: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_access_code: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      job_status: "active" | "closed" | "completed"
      plan_tier: "free" | "premium" | "professional"
      user_type: "customer" | "worker"
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

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      job_status: ["active", "closed", "completed"],
      plan_tier: ["free", "premium", "professional"],
      user_type: ["customer", "worker"],
    },
  },
} as const
