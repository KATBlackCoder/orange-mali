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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      form_fields: {
        Row: {
          created_at: string | null
          form_id: string | null
          id: string
          label: string
          options: Json | null
          ordre: number
          requis: boolean | null
          type: string
        }
        Insert: {
          created_at?: string | null
          form_id?: string | null
          id?: string
          label: string
          options?: Json | null
          ordre: number
          requis?: boolean | null
          type: string
        }
        Update: {
          created_at?: string | null
          form_id?: string | null
          id?: string
          label?: string
          options?: Json | null
          ordre?: number
          requis?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          actif: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          nom: string
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          nom: string
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          must_change_password: boolean
          parent_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          telephone: string
          zone: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id: string
          last_name: string
          must_change_password?: boolean
          parent_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telephone: string
          zone?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          must_change_password?: boolean
          parent_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telephone?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      row_values: {
        Row: {
          created_at: string | null
          field_id: string | null
          id: string
          row_id: string | null
          valeur: string | null
        }
        Insert: {
          created_at?: string | null
          field_id?: string | null
          id?: string
          row_id?: string | null
          valeur?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string | null
          id?: string
          row_id?: string | null
          valeur?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "row_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "row_values_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "submission_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_rows: {
        Row: {
          created_at: string | null
          id: string
          ordre: number
          submission_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordre: number
          submission_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ordre?: number
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_rows_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          commentaire: string | null
          created_at: string | null
          form_id: string | null
          id: string
          statut: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string | null
          form_id?: string | null
          id?: string
          statut?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string | null
          form_id?: string | null
          id?: string
          statut?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
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
      current_role_name: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "chef" | "sous_chef" | "superviseur" | "employe"
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
      user_role: ["chef", "sous_chef", "superviseur", "employe"],
    },
  },
} as const
