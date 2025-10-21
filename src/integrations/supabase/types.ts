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
      message_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lead_id: number
          message_type: string
          sent_at: string | null
          sent_via: string | null
          subject: string
          template_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lead_id: number
          message_type?: string
          sent_at?: string | null
          sent_via?: string | null
          subject: string
          template_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: number
          message_type?: string
          sent_at?: string | null
          sent_via?: string | null
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_message_history_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_message_history_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      notion_reservas: {
        Row: {
          aluguel_prancha_ilimitado: string[] | null
          analise_de_video_extra: number | null
          analise_de_video_package: number | null
          aulas_de_surf: number | null
          aulas_de_yoga: number | null
          carioca_experience_extra: boolean[] | null
          check_in_end: string | null
          check_in_start: string | null
          created_at: string
          email: string | null
          hike_extra: boolean[] | null
          id: number
          include_breakfast: boolean[] | null
          massagem_extra: number | null
          massagem_package: number | null
          name: string | null
          nivel_de_surf: string | null
          notion_page_id: string | null
          number_of_people: number | null
          obs_do_cliente: string | null
          pacote: string | null
          resumo_dos_servicos: string | null
          rio_city_tour_extra: boolean[] | null
          skate: number | null
          status: string | null
          surf_guide_package: number | null
          telefone: string | null
          tipo_de_quarto: string | null
          transfer_extra: number | null
          transfer_package: number | null
          updated_at: string
        }
        Insert: {
          aluguel_prancha_ilimitado?: string[] | null
          analise_de_video_extra?: number | null
          analise_de_video_package?: number | null
          aulas_de_surf?: number | null
          aulas_de_yoga?: number | null
          carioca_experience_extra?: boolean[] | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string
          email?: string | null
          hike_extra?: boolean[] | null
          id?: number
          include_breakfast?: boolean[] | null
          massagem_extra?: number | null
          massagem_package?: number | null
          name?: string | null
          nivel_de_surf?: string | null
          notion_page_id?: string | null
          number_of_people?: number | null
          obs_do_cliente?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          rio_city_tour_extra?: boolean[] | null
          skate?: number | null
          status?: string | null
          surf_guide_package?: number | null
          telefone?: string | null
          tipo_de_quarto?: string | null
          transfer_extra?: number | null
          transfer_package?: number | null
          updated_at?: string
        }
        Update: {
          aluguel_prancha_ilimitado?: string[] | null
          analise_de_video_extra?: number | null
          analise_de_video_package?: number | null
          aulas_de_surf?: number | null
          aulas_de_yoga?: number | null
          carioca_experience_extra?: boolean[] | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string
          email?: string | null
          hike_extra?: boolean[] | null
          id?: number
          include_breakfast?: boolean[] | null
          massagem_extra?: number | null
          massagem_package?: number | null
          name?: string | null
          nivel_de_surf?: string | null
          notion_page_id?: string | null
          number_of_people?: number | null
          obs_do_cliente?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          rio_city_tour_extra?: boolean[] | null
          skate?: number | null
          status?: string | null
          surf_guide_package?: number | null
          telefone?: string | null
          tipo_de_quarto?: string | null
          transfer_extra?: number | null
          transfer_package?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          items: Json
          name: string
          packages: Json
          room_categories: Json
          surf_lesson_pricing: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name: string
          packages?: Json
          room_categories?: Json
          surf_lesson_pricing?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name?: string
          packages?: Json
          room_categories?: Json
          surf_lesson_pricing?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          accommodation_price_override: number | null
          aluguel_de_prancha: boolean | null
          analise_de_video: number | null
          analise_de_video_package: number | null
          aulas_de_surf: number | null
          aulas_de_yoga: number | null
          breakfast: boolean | null
          carioca_experience: boolean | null
          check_in_end: string | null
          check_in_start: string | null
          created_at: string | null
          email: string | null
          extra_fee_amount: number | null
          extra_fee_description: string | null
          hike_extra: boolean | null
          id: number
          massagem_extra: number | null
          massagem_package: number | null
          name: string | null
          nivel_de_surf: string | null
          notion_page_id: string | null
          number_of_people: number | null
          obs_do_cliente: string | null
          origem: string | null
          pacote: string | null
          resumo_dos_servicos: string | null
          rio_city_tour: boolean | null
          room_category: string | null
          room_type: string | null
          skate: number | null
          status: string | null
          surf_guide: boolean | null
          surf_guide_package: number | null
          telefone: string | null
          tipo_de_quarto: string | null
          transfer: boolean | null
          transfer_extra: boolean | null
          transfer_package: number | null
          updated_at: string
          yoga: boolean | null
        }
        Insert: {
          accommodation_price_override?: number | null
          aluguel_de_prancha?: boolean | null
          analise_de_video?: number | null
          analise_de_video_package?: number | null
          aulas_de_surf?: number | null
          aulas_de_yoga?: number | null
          breakfast?: boolean | null
          carioca_experience?: boolean | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string | null
          email?: string | null
          extra_fee_amount?: number | null
          extra_fee_description?: string | null
          hike_extra?: boolean | null
          id?: number
          massagem_extra?: number | null
          massagem_package?: number | null
          name?: string | null
          nivel_de_surf?: string | null
          notion_page_id?: string | null
          number_of_people?: number | null
          obs_do_cliente?: string | null
          origem?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          rio_city_tour?: boolean | null
          room_category?: string | null
          room_type?: string | null
          skate?: number | null
          status?: string | null
          surf_guide?: boolean | null
          surf_guide_package?: number | null
          telefone?: string | null
          tipo_de_quarto?: string | null
          transfer?: boolean | null
          transfer_extra?: boolean | null
          transfer_package?: number | null
          updated_at?: string
          yoga?: boolean | null
        }
        Update: {
          accommodation_price_override?: number | null
          aluguel_de_prancha?: boolean | null
          analise_de_video?: number | null
          analise_de_video_package?: number | null
          aulas_de_surf?: number | null
          aulas_de_yoga?: number | null
          breakfast?: boolean | null
          carioca_experience?: boolean | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string | null
          email?: string | null
          extra_fee_amount?: number | null
          extra_fee_description?: string | null
          hike_extra?: boolean | null
          id?: number
          massagem_extra?: number | null
          massagem_package?: number | null
          name?: string | null
          nivel_de_surf?: string | null
          notion_page_id?: string | null
          number_of_people?: number | null
          obs_do_cliente?: string | null
          origem?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          rio_city_tour?: boolean | null
          room_category?: string | null
          room_type?: string | null
          skate?: number | null
          status?: string | null
          surf_guide?: boolean | null
          surf_guide_package?: number | null
          telefone?: string | null
          tipo_de_quarto?: string | null
          transfer?: boolean | null
          transfer_extra?: boolean | null
          transfer_package?: number | null
          updated_at?: string
          yoga?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
