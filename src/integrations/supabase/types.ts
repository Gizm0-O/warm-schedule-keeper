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
      birthdays: {
        Row: {
          created_at: string
          day: number
          id: string
          month: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day: number
          id?: string
          month: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          month?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean
          color: string
          created_at: string
          date: string
          end_hour: number | null
          hour: number | null
          id: string
          recurrence: string
          recurrence_end_date: string | null
          series_id: string | null
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
          recurrence?: string
          recurrence_end_date?: string | null
          series_id?: string | null
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
          recurrence?: string
          recurrence_end_date?: string | null
          series_id?: string | null
          title?: string
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          position: number
          status: string
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          position?: number
          status?: string
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          position?: number
          status?: string
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      earned_rewards: {
        Row: {
          activated_at: string | null
          completed_at: string | null
          created_at: string
          earned_at: string
          id: string
          label: string
          source_reward_id: string | null
          status: string
          todo_id: string | null
          todo_text: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string
          earned_at?: string
          id?: string
          label: string
          source_reward_id?: string | null
          status?: string
          todo_id?: string | null
          todo_text?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string
          earned_at?: string
          id?: string
          label?: string
          source_reward_id?: string | null
          status?: string
          todo_id?: string | null
          todo_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finance_entries: {
        Row: {
          actual: number
          category: string | null
          created_at: string
          created_by: string | null
          due_day: string | null
          id: string
          month: string
          name: string
          note: string | null
          planned: number
          section: string
          updated_at: string
        }
        Insert: {
          actual?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          due_day?: string | null
          id?: string
          month: string
          name: string
          note?: string | null
          planned?: number
          section: string
          updated_at?: string
        }
        Update: {
          actual?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          due_day?: string | null
          id?: string
          month?: string
          name?: string
          note?: string | null
          planned?: number
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_ideas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          recipient: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          recipient: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          recipient?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      gift_wishes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          owner: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          owner: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          owner?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      hourly_tasks: {
        Row: {
          color: string
          created_at: string
          hours_worked: number
          id: string
          kind: string
          milestone_bonus_percent: number
          milestone_hours: number
          month: string
          name: string
          person: string
          rate_per_hour: number
          unit_amount: number
          updated_at: string
          xp_per_hour: number
        }
        Insert: {
          color?: string
          created_at?: string
          hours_worked?: number
          id?: string
          kind?: string
          milestone_bonus_percent?: number
          milestone_hours?: number
          month?: string
          name: string
          person?: string
          rate_per_hour?: number
          unit_amount?: number
          updated_at?: string
          xp_per_hour?: number
        }
        Update: {
          color?: string
          created_at?: string
          hours_worked?: number
          id?: string
          kind?: string
          milestone_bonus_percent?: number
          milestone_hours?: number
          month?: string
          name?: string
          person?: string
          rate_per_hour?: number
          unit_amount?: number
          updated_at?: string
          xp_per_hour?: number
        }
        Relationships: []
      }
      idea_comments: {
        Row: {
          author_name: string | null
          body: string
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          created_by: string
          created_by_name: string | null
          description: string | null
          difficulty: number
          id: string
          image_url: string | null
          name: string
          priority: string
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string | null
          cost?: number
          created_at?: string
          created_by: string
          created_by_name?: string | null
          description?: string | null
          difficulty?: number
          id?: string
          image_url?: string | null
          name: string
          priority?: string
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          description?: string | null
          difficulty?: number
          id?: string
          image_url?: string | null
          name?: string
          priority?: string
          status?: string
          updated_at?: string
          url?: string | null
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
          total_xp: number
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
          total_xp?: number
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
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          todo_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          todo_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          todo_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      price_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          note: string | null
          price: number
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          note?: string | null
          price: number
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          price?: number
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          person_key: string | null
          status: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          person_key?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          person_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string | null
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
      task_custom_rewards: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_token: boolean
          label: string
          position: number
          repeat_on_recurring: boolean
          todo_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_token?: boolean
          label: string
          position?: number
          repeat_on_recurring?: boolean
          todo_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_token?: boolean
          label?: string
          position?: number
          repeat_on_recurring?: boolean
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
      task_xp: {
        Row: {
          created_at: string
          id: string
          todo_id: string
          updated_at: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          todo_id: string
          updated_at?: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          todo_id?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      todos: {
        Row: {
          amount: number | null
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          deadline: string | null
          id: string
          person: string
          recurrence: string
          recurrence_days: number[] | null
          story_month: string | null
          story_number: number | null
          text: string
        }
        Insert: {
          amount?: number | null
          category: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          person: string
          recurrence?: string
          recurrence_days?: number[] | null
          story_month?: string | null
          story_number?: number | null
          text: string
        }
        Update: {
          amount?: number | null
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          person?: string
          recurrence?: string
          recurrence_days?: number[] | null
          story_month?: string | null
          story_number?: number | null
          text?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          owner: string
          reason: string
          shift_key: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          owner?: string
          reason: string
          shift_key?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          owner?: string
          reason?: string
          shift_key?: string | null
        }
        Relationships: []
      }
      tokens_balance: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_monthly_grant: string | null
          last_weekly_grant: string | null
          owner: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_monthly_grant?: string | null
          last_weekly_grant?: string | null
          owner: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_monthly_grant?: string | null
          last_weekly_grant?: string | null
          owner?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      email_has_account: { Args: { _email: string }; Returns: boolean }
      generate_stories_for_month: {
        Args: { p_month: string }
        Returns: undefined
      }
      get_admin_uid: { Args: never; Returns: string }
      get_barca_uid: { Args: never; Returns: string }
      get_email_by_username: { Args: { _username: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      person_to_user_id: { Args: { _person: string }; Returns: string }
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
