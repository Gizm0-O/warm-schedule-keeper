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
      calendar_events: {
        Row: {
          all_day: boolean
          color: string
          created_at: string
          date: string
          end_hour: number | null
          hour: number | null
          id: string
          title: string
        }
        Insert: {
          all_day?: boolean
          color: string
          created_at?: string
          date: string
          end_hour?: number | null
          hour?: number | null
          id?: string
          title: string
        }
        Update: {
          all_day?: boolean
          color?: string
          created_at?: string
          date?: string
          end_hour?: number | null
          hour?: number | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      hourly_tasks: {
        Row: {
          color: string
          created_at: string
          hours_worked: number
          id: string
          milestone_bonus_percent: number
          milestone_hours: number
          month: string
          name: string
          person: string
          rate_per_hour: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          hours_worked?: number
          id?: string
          milestone_bonus_percent?: number
          milestone_hours?: number
          month?: string
          name: string
          person?: string
          rate_per_hour?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          hours_worked?: number
          id?: string
          milestone_bonus_percent?: number
          milestone_hours?: number
          month?: string
          name?: string
          person?: string
          rate_per_hour?: number
          updated_at?: string
        }
        Relationships: []
      }
      italy_savings: {
        Row: {
          amount: number
          bonus_percent: number | null
          created_at: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          bonus_percent?: number | null
          created_at?: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          bonus_percent?: number | null
          created_at?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      monthly_archives: {
        Row: {
          allowance_amount: number
          base_amount: number
          bonus_amount: number
          bonuses_snapshot: Json
          closed_at: string
          completed_late: number
          completed_missed: number
          completed_on_time: number
          config_snapshot: Json
          created_at: string
          earnings_snapshot: Json
          hourly_tasks_snapshot: Json
          id: string
          month: string
          to_hand_over: number
          total_bonus_percent: number
          total_earned: number
          total_percent: number
          updated_at: string
        }
        Insert: {
          allowance_amount?: number
          base_amount?: number
          bonus_amount?: number
          bonuses_snapshot?: Json
          closed_at?: string
          completed_late?: number
          completed_missed?: number
          completed_on_time?: number
          config_snapshot?: Json
          created_at?: string
          earnings_snapshot?: Json
          hourly_tasks_snapshot?: Json
          id?: string
          month: string
          to_hand_over?: number
          total_bonus_percent?: number
          total_earned?: number
          total_percent?: number
          updated_at?: string
        }
        Update: {
          allowance_amount?: number
          base_amount?: number
          bonus_amount?: number
          bonuses_snapshot?: Json
          closed_at?: string
          completed_late?: number
          completed_missed?: number
          completed_on_time?: number
          config_snapshot?: Json
          created_at?: string
          earnings_snapshot?: Json
          hourly_tasks_snapshot?: Json
          id?: string
          month?: string
          to_hand_over?: number
          total_bonus_percent?: number
          total_earned?: number
          total_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      rewards_config: {
        Row: {
          base_percent: number
          bonus_late: number
          bonus_per_task: number
          created_at: string
          id: string
          max_tasks: number
          month: string
          monthly_earnings: number
          updated_at: string
        }
        Insert: {
          base_percent?: number
          bonus_late?: number
          bonus_per_task?: number
          created_at?: string
          id?: string
          max_tasks?: number
          month: string
          monthly_earnings?: number
          updated_at?: string
        }
        Update: {
          base_percent?: number
          bonus_late?: number
          bonus_per_task?: number
          created_at?: string
          id?: string
          max_tasks?: number
          month?: string
          monthly_earnings?: number
          updated_at?: string
        }
        Relationships: []
      }
      shift_overrides: {
        Row: {
          created_at: string
          id: string
          override_type: string
          shift_key: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          override_type: string
          shift_key: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          override_type?: string
          shift_key?: string
          value?: Json
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          bought: boolean
          category: string
          created_at: string
          id: string
          name: string
          quantity: number
        }
        Insert: {
          bought?: boolean
          category?: string
          created_at?: string
          id?: string
          name: string
          quantity?: number
        }
        Update: {
          bought?: boolean
          category?: string
          created_at?: string
          id?: string
          name?: string
          quantity?: number
        }
        Relationships: []
      }
      task_bonus_amounts: {
        Row: {
          amount: number
          created_at: string
          id: string
          todo_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          todo_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          todo_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_bonuses: {
        Row: {
          created_at: string
          id: string
          status: string
          todo_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          todo_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          todo_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_earnings: {
        Row: {
          amount: number
          bonus_percent: number | null
          bonus_type: string | null
          completed_at: string
          created_at: string
          deadline: string | null
          id: string
          todo_id: string
          todo_text: string
        }
        Insert: {
          amount: number
          bonus_percent?: number | null
          bonus_type?: string | null
          completed_at?: string
          created_at?: string
          deadline?: string | null
          id?: string
          todo_id: string
          todo_text: string
        }
        Update: {
          amount?: number
          bonus_percent?: number | null
          bonus_type?: string | null
          completed_at?: string
          created_at?: string
          deadline?: string | null
          id?: string
          todo_id?: string
          todo_text?: string
        }
        Relationships: []
      }
      task_ready: {
        Row: {
          created_at: string
          id: string
          todo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          todo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          todo_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          amount: number | null
          category: string
          completed: boolean
          created_at: string
          deadline: string | null
          id: string
          person: string
          recurrence: string
          story_month: string | null
          story_number: number | null
          text: string
        }
        Insert: {
          amount?: number | null
          category: string
          completed?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          person: string
          recurrence?: string
          story_month?: string | null
          story_number?: number | null
          text: string
        }
        Update: {
          amount?: number | null
          category?: string
          completed?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          person?: string
          recurrence?: string
          story_month?: string | null
          story_number?: number | null
          text?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          done: boolean
          id: string
          name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          name: string
          quantity?: number
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          name?: string
          quantity?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_stories_for_month: {
        Args: { p_month: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
