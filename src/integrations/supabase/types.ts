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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_analytics: {
        Row: {
          ad_id: string
          created_at: string
          event_type: string
          id: string
          user_id: string | null
          view_duration_seconds: number | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type: string
          id?: string
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analytics_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          approval_status: string | null
          click_url: string | null
          clicks: number | null
          created_at: string
          created_by: string
          delay_seconds: number
          duration_seconds: number
          id: string
          impressions: number | null
          is_active: boolean
          max_views_per_day: number
          media_type: string
          media_url: string
          skip_after_seconds: number
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          click_url?: string | null
          clicks?: number | null
          created_at?: string
          created_by: string
          delay_seconds?: number
          duration_seconds?: number
          id?: string
          impressions?: number | null
          is_active?: boolean
          max_views_per_day?: number
          media_type?: string
          media_url: string
          skip_after_seconds?: number
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          click_url?: string | null
          clicks?: number | null
          created_at?: string
          created_by?: string
          delay_seconds?: number
          duration_seconds?: number
          id?: string
          impressions?: number | null
          is_active?: boolean
          max_views_per_day?: number
          media_type?: string
          media_url?: string
          skip_after_seconds?: number
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          is_active: boolean
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          feature_name: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          feature_name: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          feature_name?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          id: string
          page_name: string
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          page_name: string
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          page_name?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          budget: number
          cost_per_1000_impressions: number | null
          cost_per_day: number | null
          created_at: string
          description: string | null
          duration_days: number
          expires_at: string | null
          id: string
          is_featured: boolean | null
          media_type: string
          media_url: string
          starts_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          budget?: number
          cost_per_1000_impressions?: number | null
          cost_per_day?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number
          expires_at?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string
          media_url: string
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          budget?: number
          cost_per_1000_impressions?: number | null
          cost_per_day?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number
          expires_at?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string
          media_url?: string
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue_records: {
        Row: {
          ad_id: string | null
          amount: number
          created_by: string
          description: string | null
          id: string
          promotion_id: string | null
          recorded_at: string
          type: string
        }
        Insert: {
          ad_id?: string | null
          amount?: number
          created_by: string
          description?: string | null
          id?: string
          promotion_id?: string | null
          recorded_at?: string
          type?: string
        }
        Update: {
          ad_id?: string | null
          amount?: number
          created_by?: string
          description?: string | null
          id?: string
          promotion_id?: string | null
          recorded_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_records_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_records_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          created_at: string
          day: string
          end_time: string
          id: string
          name: string
          start_time: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          end_time: string
          id?: string
          name: string
          start_time: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          type?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin" | "user"
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
    },
  },
} as const
