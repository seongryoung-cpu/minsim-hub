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
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      candidate_careers: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          organization: string
          period: string
          sort_order: number
          title: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          organization: string
          period: string
          sort_order?: number
          title: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          organization?: string
          period?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_careers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_pledges: {
        Row: {
          candidate_id: string
          category: string
          created_at: string
          description: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          candidate_id: string
          category: string
          created_at?: string
          description: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          candidate_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_pledges_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          age: number | null
          created_at: string
          education: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          party: string
          party_color: string
          position: string
          region_name: string
          region_type: string
          slogan: string | null
          slug: string
          sort_order: number
          summary: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          education?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          party: string
          party_color?: string
          position: string
          region_name: string
          region_type?: string
          slogan?: string | null
          slug: string
          sort_order?: number
          summary: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          education?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          party?: string
          party_color?: string
          position?: string
          region_name?: string
          region_type?: string
          slogan?: string | null
          slug?: string
          sort_order?: number
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          article_url: string | null
          candidate_id: string | null
          category: string
          created_at: string
          id: string
          image_url: string | null
          published_at: string
          source: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          article_url?: string | null
          candidate_id?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          source: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          article_url?: string | null
          candidate_id?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          source?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          admin_user_id: string
          body: string
          created_at: string
          failed_count: number
          id: string
          sent_count: number
          target_type: string
          target_user_ids: string[] | null
          title: string
        }
        Insert: {
          admin_user_id: string
          body: string
          created_at?: string
          failed_count?: number
          id?: string
          sent_count?: number
          target_type?: string
          target_user_ids?: string[] | null
          title: string
        }
        Update: {
          admin_user_id?: string
          body?: string
          created_at?: string
          failed_count?: number
          id?: string
          sent_count?: number
          target_type?: string
          target_user_ids?: string[] | null
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          candidate_updates_enabled: boolean
          created_at: string
          id: string
          news_enabled: boolean
          policy_match_enabled: boolean
          quiz_enabled: boolean
          system_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_updates_enabled?: boolean
          created_at?: string
          id?: string
          news_enabled?: boolean
          policy_match_enabled?: boolean
          quiz_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_updates_enabled?: boolean
          created_at?: string
          id?: string
          news_enabled?: boolean
          policy_match_enabled?: boolean
          quiz_enabled?: boolean
          system_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      policy_candidate_alignments: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          intensity: number
          policy_card_id: string
          stance: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          intensity?: number
          policy_card_id: string
          stance: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          intensity?: number
          policy_card_id?: string
          stance?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_candidate_alignments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_candidate_alignments_policy_card_id_fkey"
            columns: ["policy_card_id"]
            isOneToOne: false
            referencedRelation: "policy_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_cards: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          left_label: string
          region_name: string
          right_label: string
          sort_order: number
          statement: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          left_label: string
          region_name?: string
          right_label: string
          sort_order?: number
          statement: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          left_label?: string
          region_name?: string
          right_label?: string
          sort_order?: number
          statement?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_match_results: {
        Row: {
          choices_json: Json
          created_at: string
          id: string
          preferred_candidate_id: string | null
          preferred_candidate_name: string | null
          region_name: string
          results_json: Json
          top_match_candidate_id: string | null
          top_match_candidate_name: string
          top_match_score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          choices_json?: Json
          created_at?: string
          id?: string
          preferred_candidate_id?: string | null
          preferred_candidate_name?: string | null
          region_name: string
          results_json?: Json
          top_match_candidate_id?: string | null
          top_match_candidate_name: string
          top_match_score: number
          total_questions?: number
          user_id: string
        }
        Update: {
          choices_json?: Json
          created_at?: string
          id?: string
          preferred_candidate_id?: string | null
          preferred_candidate_name?: string | null
          region_name?: string
          results_json?: Json
          top_match_candidate_id?: string | null
          top_match_candidate_name?: string
          top_match_score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_match_results_preferred_candidate_id_fkey"
            columns: ["preferred_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_match_results_top_match_candidate_id_fkey"
            columns: ["top_match_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          identity_ci: string | null
          identity_provider: string | null
          identity_verified_at: string | null
          phone_number: string | null
          phone_verified_at: string | null
          region_sido: string | null
          region_sigungu: string | null
          updated_at: string
          user_id: string
          verification_level: Database["public"]["Enums"]["verification_level"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          identity_ci?: string | null
          identity_provider?: string | null
          identity_verified_at?: string | null
          phone_number?: string | null
          phone_verified_at?: string | null
          region_sido?: string | null
          region_sigungu?: string | null
          updated_at?: string
          user_id: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          identity_ci?: string | null
          identity_provider?: string | null
          identity_verified_at?: string | null
          phone_number?: string | null
          phone_verified_at?: string | null
          region_sido?: string | null
          region_sigungu?: string | null
          updated_at?: string
          user_id?: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: number
          created_at: string
          difficulty: string
          explanation: string
          id: string
          is_active: boolean
          options: Json
          points: number
          question: string
          updated_at: string
        }
        Insert: {
          category: string
          correct_answer: number
          created_at?: string
          difficulty?: string
          explanation: string
          id?: string
          is_active?: boolean
          options: Json
          points?: number
          question: string
          updated_at?: string
        }
        Update: {
          category?: string
          correct_answer?: number
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          is_active?: boolean
          options?: Json
          points?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_stats: {
        Row: {
          correct_answers: number
          created_at: string
          current_streak: number
          id: string
          last_played_date: string | null
          longest_streak: number
          total_points: number
          total_quizzes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_played_date?: string | null
          longest_streak?: number
          total_points?: number
          total_quizzes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_played_date?: string | null
          longest_streak?: number
          total_points?: number
          total_quizzes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_response: string | null
          category: string | null
          content: string
          created_at: string
          id: string
          responded_at: string | null
          responded_by: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          content: string
          created_at?: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_followed_candidates: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      leaderboard_view: {
        Row: {
          avatar_url: string | null
          correct_answers: number | null
          current_streak: number | null
          display_name: string | null
          id: string | null
          longest_streak: number | null
          region_sido: string | null
          total_points: number | null
          total_quizzes: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      verification_level: "anonymous" | "social" | "phone" | "identity"
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
      app_role: ["admin", "moderator", "user"],
      verification_level: ["anonymous", "social", "phone", "identity"],
    },
  },
} as const
