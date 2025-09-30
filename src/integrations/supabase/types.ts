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
      notion_reservas: {
        Row: {
          aluguel_prancha_ilimitado: string[] | null
          analise_de_video_extra: number | null
          analise_de_video_package: number | null
          aulas_de_surf: number | null
          aulas_de_yoga: number | null
          carioca_experience_extra: string[] | null
          check_in_end: string | null
          check_in_start: string | null
          created_at: string
          email: string | null
          hike_extra: string[] | null
          id: number
          include_breakfast: string[] | null
          massagem_extra: number | null
          massagem_package: number | null
          name: string | null
          nivel_de_surf: string | null
          notion_page_id: string | null
          number_of_people: number | null
          obs_do_cliente: string | null
          pacote: string | null
          resumo_dos_servicos: string | null
          rio_city_tour_extra: string[] | null
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
          carioca_experience_extra?: string[] | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string
          email?: string | null
          hike_extra?: string[] | null
          id?: number
          include_breakfast?: string[] | null
          massagem_extra?: number | null
          massagem_package?: number | null
          name?: string | null
          nivel_de_surf?: string | null
          notion_page_id?: string | null
          number_of_people?: number | null
          obs_do_cliente?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          rio_city_tour_extra?: string[] | null
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
          carioca_experience_extra?: string[] | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string
          email?: string | null
          hike_extra?: string[] | null
          id?: number
          include_breakfast?: string[] | null
          massagem_extra?: number | null
          massagem_package?: number | null
          name?: string | null
          nivel_de_surf?: string | null
          notion_page_id?: string | null
          number_of_people?: number | null
          obs_do_cliente?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          rio_city_tour_extra?: string[] | null
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
      reservas: {
        Row: {
          id: string
          name: string | null
          property_: string[] | null
          property_aluguel_prancha_ilimitado: string[] | null
          property_an_lise_de_v_deo_extra: number | null
          property_an_lise_de_v_deo_package: number | null
          property_aplicar_yoga_gr_tis: boolean | null
          property_aulas_de_surf: number | null
          property_aulas_de_yoga: number | null
          property_carioca_experience_extra: string[] | null
          property_check_in: Json | null
          property_criado_em: string | null
          property_email: string | null
          property_fonte_do_c_lculo: string | null
          property_hike_extra: string[] | null
          property_hospedagem_brl: string | null
          property_include_breakfast: string[] | null
          property_include_breakfast_1: string[] | null
          property_link_de_pagamento: string | null
          property_ltima_mudan_a_de_coluna: string | null
          property_ltimo_c_lculo_em: string | null
          property_massagem_extra: number | null
          property_massagem_package: number | null
          property_moeda_esperada: string | null
          property_n_vel_de_surf: string | null
          property_name: string | null
          property_number_of_people: number | null
          property_obs_do_cliente: string | null
          property_origem: string[] | null
          property_pacote: string | null
          property_pre_o_aluguel_de_prancha: number | null
          property_pre_o_an_lise_de_v_deo: number | null
          property_pre_o_aula_de_surf_1_3: number | null
          property_pre_o_aula_de_surf_4_7: number | null
          property_pre_o_aula_de_surf_8: number | null
          property_pre_o_caf_da_manh: number | null
          property_pre_o_carioca_experience: number | null
          property_pre_o_hike: number | null
          property_pre_o_massagem: number | null
          property_pre_o_rio_city_tour: number | null
          property_pre_o_surf_guide: number | null
          property_pre_o_surf_skate: number | null
          property_pre_o_transfer: number | null
          property_pre_o_yoga: number | null
          property_recalcular_agora: boolean | null
          property_resumo_dos_servi_os: string | null
          property_rio_city_tour_extra: string[] | null
          property_skate: number | null
          property_status: string | null
          property_status_de_reserva: string[] | null
          property_surf_guide_package: number | null
          property_tabela_de_pre_os_itens: Json | null
          property_taxa_brl: number | null
          property_telefone: string | null
          property_tipo_de_quarto: string | null
          property_transfer_extra: number | null
          property_transfer_package: number | null
          property_travar_itens_do_c_lculo: boolean | null
          property_valor_de_repasse: number | null
          property_valor_retido: number | null
          property_valor_total_de_reserva: number | null
          property_yoga_cobradas_por_pessoa: number | null
          property_yoga_dias_gr_tis_qua_sex: string | null
          url: string | null
        }
        Insert: {
          id: string
          name?: string | null
          property_?: string[] | null
          property_aluguel_prancha_ilimitado?: string[] | null
          property_an_lise_de_v_deo_extra?: number | null
          property_an_lise_de_v_deo_package?: number | null
          property_aplicar_yoga_gr_tis?: boolean | null
          property_aulas_de_surf?: number | null
          property_aulas_de_yoga?: number | null
          property_carioca_experience_extra?: string[] | null
          property_check_in?: Json | null
          property_criado_em?: string | null
          property_email?: string | null
          property_fonte_do_c_lculo?: string | null
          property_hike_extra?: string[] | null
          property_hospedagem_brl?: string | null
          property_include_breakfast?: string[] | null
          property_include_breakfast_1?: string[] | null
          property_link_de_pagamento?: string | null
          property_ltima_mudan_a_de_coluna?: string | null
          property_ltimo_c_lculo_em?: string | null
          property_massagem_extra?: number | null
          property_massagem_package?: number | null
          property_moeda_esperada?: string | null
          property_n_vel_de_surf?: string | null
          property_name?: string | null
          property_number_of_people?: number | null
          property_obs_do_cliente?: string | null
          property_origem?: string[] | null
          property_pacote?: string | null
          property_pre_o_aluguel_de_prancha?: number | null
          property_pre_o_an_lise_de_v_deo?: number | null
          property_pre_o_aula_de_surf_1_3?: number | null
          property_pre_o_aula_de_surf_4_7?: number | null
          property_pre_o_aula_de_surf_8?: number | null
          property_pre_o_caf_da_manh?: number | null
          property_pre_o_carioca_experience?: number | null
          property_pre_o_hike?: number | null
          property_pre_o_massagem?: number | null
          property_pre_o_rio_city_tour?: number | null
          property_pre_o_surf_guide?: number | null
          property_pre_o_surf_skate?: number | null
          property_pre_o_transfer?: number | null
          property_pre_o_yoga?: number | null
          property_recalcular_agora?: boolean | null
          property_resumo_dos_servi_os?: string | null
          property_rio_city_tour_extra?: string[] | null
          property_skate?: number | null
          property_status?: string | null
          property_status_de_reserva?: string[] | null
          property_surf_guide_package?: number | null
          property_tabela_de_pre_os_itens?: Json | null
          property_taxa_brl?: number | null
          property_telefone?: string | null
          property_tipo_de_quarto?: string | null
          property_transfer_extra?: number | null
          property_transfer_package?: number | null
          property_travar_itens_do_c_lculo?: boolean | null
          property_valor_de_repasse?: number | null
          property_valor_retido?: number | null
          property_valor_total_de_reserva?: number | null
          property_yoga_cobradas_por_pessoa?: number | null
          property_yoga_dias_gr_tis_qua_sex?: string | null
          url?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          property_?: string[] | null
          property_aluguel_prancha_ilimitado?: string[] | null
          property_an_lise_de_v_deo_extra?: number | null
          property_an_lise_de_v_deo_package?: number | null
          property_aplicar_yoga_gr_tis?: boolean | null
          property_aulas_de_surf?: number | null
          property_aulas_de_yoga?: number | null
          property_carioca_experience_extra?: string[] | null
          property_check_in?: Json | null
          property_criado_em?: string | null
          property_email?: string | null
          property_fonte_do_c_lculo?: string | null
          property_hike_extra?: string[] | null
          property_hospedagem_brl?: string | null
          property_include_breakfast?: string[] | null
          property_include_breakfast_1?: string[] | null
          property_link_de_pagamento?: string | null
          property_ltima_mudan_a_de_coluna?: string | null
          property_ltimo_c_lculo_em?: string | null
          property_massagem_extra?: number | null
          property_massagem_package?: number | null
          property_moeda_esperada?: string | null
          property_n_vel_de_surf?: string | null
          property_name?: string | null
          property_number_of_people?: number | null
          property_obs_do_cliente?: string | null
          property_origem?: string[] | null
          property_pacote?: string | null
          property_pre_o_aluguel_de_prancha?: number | null
          property_pre_o_an_lise_de_v_deo?: number | null
          property_pre_o_aula_de_surf_1_3?: number | null
          property_pre_o_aula_de_surf_4_7?: number | null
          property_pre_o_aula_de_surf_8?: number | null
          property_pre_o_caf_da_manh?: number | null
          property_pre_o_carioca_experience?: number | null
          property_pre_o_hike?: number | null
          property_pre_o_massagem?: number | null
          property_pre_o_rio_city_tour?: number | null
          property_pre_o_surf_guide?: number | null
          property_pre_o_surf_skate?: number | null
          property_pre_o_transfer?: number | null
          property_pre_o_yoga?: number | null
          property_recalcular_agora?: boolean | null
          property_resumo_dos_servi_os?: string | null
          property_rio_city_tour_extra?: string[] | null
          property_skate?: number | null
          property_status?: string | null
          property_status_de_reserva?: string[] | null
          property_surf_guide_package?: number | null
          property_tabela_de_pre_os_itens?: Json | null
          property_taxa_brl?: number | null
          property_telefone?: string | null
          property_tipo_de_quarto?: string | null
          property_transfer_extra?: number | null
          property_transfer_package?: number | null
          property_travar_itens_do_c_lculo?: boolean | null
          property_valor_de_repasse?: number | null
          property_valor_retido?: number | null
          property_valor_total_de_reserva?: number | null
          property_yoga_cobradas_por_pessoa?: number | null
          property_yoga_dias_gr_tis_qua_sex?: string | null
          url?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: number
          notion_page_id: string | null
          created_at: string
          updated_at: string
          name: string | null
          check_in_start: string | null
          check_in_end: string | null
          email: string | null
          number_of_people: number | null
          nivel_de_surf: string | null
          obs_do_cliente: string | null
          pacote: string | null
          resumo_dos_servicos: string | null
          status: string | null
          telefone: string | null
          tipo_de_quarto: string | null
          room_category: string | null
          room_type: string | null
          accommodation_price_override: number | null
          extra_fee_amount: number | null
          extra_fee_description: string | null
          aulas_de_surf: number | null
          aulas_de_yoga: number | null
          skate: number | null
          surf_guide_package: number | null
          analise_de_video_package: number | null
          massagem_package: number | null
          massagem_extra: boolean | null
          transfer_package: number | null
          transfer_extra: boolean | null
          rio_city_tour: boolean | null
          carioca_experience: boolean | null
          hike_extra: boolean | null
          aluguel_de_prancha: boolean | null
          breakfast: boolean | null
          surf_guide: number | null
          analise_de_video: number | null
          yoga: number | null
          transfer: boolean | null
        }
        Insert: {
          id?: number
          notion_page_id?: string | null
          created_at?: string
          updated_at?: string
          name?: string | null
          check_in_start?: string | null
          check_in_end?: string | null
          email?: string | null
          number_of_people?: number | null
          nivel_de_surf?: string | null
          obs_do_cliente?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          status?: string | null
          telefone?: string | null
          tipo_de_quarto?: string | null
          room_category?: string | null
          room_type?: string | null
          accommodation_price_override?: number | null
          extra_fee_amount?: number | null
          extra_fee_description?: string | null
          aulas_de_surf?: number | null
          aulas_de_yoga?: number | null
          skate?: number | null
          surf_guide_package?: number | null
          analise_de_video_package?: number | null
          massagem_package?: number | null
          massagem_extra?: boolean | null
          transfer_package?: number | null
          transfer_extra?: boolean | null
          rio_city_tour?: boolean | null
          carioca_experience?: boolean | null
          hike_extra?: boolean | null
          aluguel_de_prancha?: boolean | null
          breakfast?: boolean | null
          surf_guide?: number | null
          analise_de_video?: number | null
          yoga?: number | null
          transfer?: boolean | null
        }
        Update: {
          id?: number
          notion_page_id?: string | null
          created_at?: string
          updated_at?: string
          name?: string | null
          check_in_start?: string | null
          check_in_end?: string | null
          email?: string | null
          number_of_people?: number | null
          nivel_de_surf?: string | null
          obs_do_cliente?: string | null
          pacote?: string | null
          resumo_dos_servicos?: string | null
          status?: string | null
          telefone?: string | null
          tipo_de_quarto?: string | null
          room_category?: string | null
          room_type?: string | null
          accommodation_price_override?: number | null
          extra_fee_amount?: number | null
          extra_fee_description?: string | null
          aulas_de_surf?: number | null
          aulas_de_yoga?: number | null
          skate?: number | null
          surf_guide_package?: number | null
          analise_de_video_package?: number | null
          massagem_package?: number | null
          massagem_extra?: boolean | null
          transfer_package?: number | null
          transfer_extra?: boolean | null
          rio_city_tour?: boolean | null
          carioca_experience?: boolean | null
          hike_extra?: boolean | null
          aluguel_de_prancha?: boolean | null
          breakfast?: boolean | null
          surf_guide?: number | null
          analise_de_video?: number | null
          yoga?: number | null
          transfer?: boolean | null
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          room_categories: Json
          packages: Json
          items: Json
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          room_categories?: Json
          packages?: Json
          items?: Json
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          room_categories?: Json
          packages?: Json
          items?: Json
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          variables: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          variables?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          variables?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_history: {
        Row: {
          id: string
          lead_id: number
          template_id: string | null
          subject: string
          content: string
          message_type: string
          sent_via: string
          sent_at: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: number
          template_id?: string | null
          subject: string
          content: string
          message_type?: string
          sent_via?: string
          sent_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: number
          template_id?: string | null
          subject?: string
          content?: string
          message_type?: string
          sent_via?: string
          sent_at?: string
          created_at?: string
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
          }
        ]
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
