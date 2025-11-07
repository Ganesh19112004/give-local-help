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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_items: {
        Row: {
          condition: string | null
          donation_id: string
          id: string
          image_path: string | null
          item_name: string
          quantity: number
        }
        Insert: {
          condition?: string | null
          donation_id: string
          id?: string
          image_path?: string | null
          item_name: string
          quantity: number
        }
        Update: {
          condition?: string | null
          donation_id?: string
          id?: string
          image_path?: string | null
          item_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "donation_items_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number | null
          category: Database["public"]["Enums"]["donation_category"]
          created_at: string | null
          description: string | null
          donor_id: string
          id: string
          ngo_id: string | null
          pickup_address: string
          preferred_pickup_date: string | null
          status: Database["public"]["Enums"]["donation_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          category: Database["public"]["Enums"]["donation_category"]
          created_at?: string | null
          description?: string | null
          donor_id: string
          id?: string
          ngo_id?: string | null
          pickup_address: string
          preferred_pickup_date?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          category?: Database["public"]["Enums"]["donation_category"]
          created_at?: string | null
          description?: string | null
          donor_id?: string
          id?: string
          ngo_id?: string | null
          pickup_address?: string
          preferred_pickup_date?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_posts: {
        Row: {
          category: Database["public"]["Enums"]["donation_category"] | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          ngo_id: string
          quantity_needed: number | null
          title: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["donation_category"] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ngo_id: string
          quantity_needed?: number | null
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["donation_category"] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ngo_id?: string
          quantity_needed?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_posts_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngos: {
        Row: {
          active: boolean | null
          address: string | null
          approved_at: string | null
          approved_by: string | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          pincode: string | null
          profile_id: string
          registration_doc_path: string | null
          state: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          pincode?: string | null
          profile_id: string
          registration_doc_path?: string | null
          state?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          pincode?: string | null
          profile_id?: string
          registration_doc_path?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ngos_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_admins: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          profile_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          profile_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          profile_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      pickups: {
        Row: {
          created_at: string | null
          donation_id: string
          id: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["pickup_status"] | null
          updated_at: string | null
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string | null
          donation_id: string
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["pickup_status"] | null
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string | null
          donation_id?: string
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["pickup_status"] | null
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickups_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          full_name: string
          id: string
          lat: number | null
          lng: number | null
          phone: string | null
          pincode: string | null
          role: Database["public"]["Enums"]["app_role"]
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          full_name: string
          id: string
          lat?: number | null
          lng?: number | null
          phone?: string | null
          pincode?: string | null
          role: Database["public"]["Enums"]["app_role"]
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          lat?: number | null
          lng?: number | null
          phone?: string | null
          pincode?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state?: string | null
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
      volunteers: {
        Row: {
          created_at: string | null
          id: string
          ngo_id: string
          phone: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ngo_id: string
          phone?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ngo_id?: string
          phone?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "donor" | "ngo" | "admin" | "volunteer"
      donation_category:
        | "stationary"
        | "books"
        | "clothes"
        | "electronics"
        | "money"
      donation_status:
        | "Requested"
        | "Accepted"
        | "Volunteer Assigned"
        | "Picked Up"
        | "Delivered"
        | "Cancelled"
        | "Rejected"
      pickup_status:
        | "Assigned"
        | "En route"
        | "Picked Up"
        | "Delivered"
        | "Cancelled"
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
      app_role: ["donor", "ngo", "admin", "volunteer"],
      donation_category: [
        "stationary",
        "books",
        "clothes",
        "electronics",
        "money",
      ],
      donation_status: [
        "Requested",
        "Accepted",
        "Volunteer Assigned",
        "Picked Up",
        "Delivered",
        "Cancelled",
        "Rejected",
      ],
      pickup_status: [
        "Assigned",
        "En route",
        "Picked Up",
        "Delivered",
        "Cancelled",
      ],
    },
  },
} as const
