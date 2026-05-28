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
      alerts: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          meta: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          meta?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          meta?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_forecasts: {
        Row: {
          created_at: string
          direction: string
          entry_zone: string | null
          id: string
          net_edge: number
          patterns: string[]
          regime: string | null
          rrr: number | null
          rsi: number | null
          scanned_at: string
          sl: number | null
          status: string
          strength: string | null
          symbol: string
          tp: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          entry_zone?: string | null
          id?: string
          net_edge?: number
          patterns?: string[]
          regime?: string | null
          rrr?: number | null
          rsi?: number | null
          scanned_at?: string
          sl?: number | null
          status?: string
          strength?: string | null
          symbol: string
          tp?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          entry_zone?: string | null
          id?: string
          net_edge?: number
          patterns?: string[]
          regime?: string | null
          rrr?: number | null
          rsi?: number | null
          scanned_at?: string
          sl?: number | null
          status?: string
          strength?: string | null
          symbol?: string
          tp?: number | null
          user_id?: string
        }
        Relationships: []
      }
      bot_params: {
        Row: {
          atr_multiplier: number
          break_even_activation_pips: number
          daily_loss_limit: number
          daily_profit_target: number
          enabled_pairs: string[]
          gold_sl_multiplier: number
          max_consecutive_losses: number
          max_lot_size: number
          max_spread_gold: number
          max_spread_normal: number
          max_trades: number
          min_rrr: number
          min_signal_strength: number
          pair_settings: Json
          paused: boolean
          risk_percent: number
          scan_interval: number
          sl_max: number
          sl_min: number
          tp_multiplier: number
          trailing_stop_activation_pips: number
          trailing_stop_distance_pips: number
          updated_at: string
          use_break_even: boolean
          use_trailing_stop: boolean
          user_id: string
          version: number
        }
        Insert: {
          atr_multiplier?: number
          break_even_activation_pips?: number
          daily_loss_limit?: number
          daily_profit_target?: number
          enabled_pairs?: string[]
          gold_sl_multiplier?: number
          max_consecutive_losses?: number
          max_lot_size?: number
          max_spread_gold?: number
          max_spread_normal?: number
          max_trades?: number
          min_rrr?: number
          min_signal_strength?: number
          pair_settings?: Json
          paused?: boolean
          risk_percent?: number
          scan_interval?: number
          sl_max?: number
          sl_min?: number
          tp_multiplier?: number
          trailing_stop_activation_pips?: number
          trailing_stop_distance_pips?: number
          updated_at?: string
          use_break_even?: boolean
          use_trailing_stop?: boolean
          user_id: string
          version?: number
        }
        Update: {
          atr_multiplier?: number
          break_even_activation_pips?: number
          daily_loss_limit?: number
          daily_profit_target?: number
          enabled_pairs?: string[]
          gold_sl_multiplier?: number
          max_consecutive_losses?: number
          max_lot_size?: number
          max_spread_gold?: number
          max_spread_normal?: number
          max_trades?: number
          min_rrr?: number
          min_signal_strength?: number
          pair_settings?: Json
          paused?: boolean
          risk_percent?: number
          scan_interval?: number
          sl_max?: number
          sl_min?: number
          tp_multiplier?: number
          trailing_stop_activation_pips?: number
          trailing_stop_distance_pips?: number
          updated_at?: string
          use_break_even?: boolean
          use_trailing_stop?: boolean
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      bot_state: {
        Row: {
          balance: number
          bot_version: string | null
          consecutive_losses: number
          currency: string
          daily_drawdown: number
          daily_pl: number
          dry_run: boolean
          equity: number
          free_margin: number
          halt_reason: string | null
          halted: boolean
          last_heartbeat: string | null
          losses_today: number
          margin: number
          monthly_anchor: number
          paused: boolean
          scan_count: number
          trades_today: number
          updated_at: string
          user_id: string
          weekly_anchor: number
          wins_today: number
        }
        Insert: {
          balance?: number
          bot_version?: string | null
          consecutive_losses?: number
          currency?: string
          daily_drawdown?: number
          daily_pl?: number
          dry_run?: boolean
          equity?: number
          free_margin?: number
          halt_reason?: string | null
          halted?: boolean
          last_heartbeat?: string | null
          losses_today?: number
          margin?: number
          monthly_anchor?: number
          paused?: boolean
          scan_count?: number
          trades_today?: number
          updated_at?: string
          user_id: string
          weekly_anchor?: number
          wins_today?: number
        }
        Update: {
          balance?: number
          bot_version?: string | null
          consecutive_losses?: number
          currency?: string
          daily_drawdown?: number
          daily_pl?: number
          dry_run?: boolean
          equity?: number
          free_margin?: number
          halt_reason?: string | null
          halted?: boolean
          last_heartbeat?: string | null
          losses_today?: number
          margin?: number
          monthly_anchor?: number
          paused?: boolean
          scan_count?: number
          trades_today?: number
          updated_at?: string
          user_id?: string
          weekly_anchor?: number
          wins_today?: number
        }
        Relationships: []
      }
      commands: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          payload: Json
          picked_at: string | null
          result: Json | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          picked_at?: string | null
          result?: Json | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          picked_at?: string | null
          result?: Json | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          commission: number
          current_price: number | null
          entry: number
          id: string
          lots: number
          opened_at: string
          profit: number
          side: string
          sl: number | null
          swap: number
          symbol: string
          ticket: number
          tp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission?: number
          current_price?: number | null
          entry: number
          id?: string
          lots: number
          opened_at: string
          profit?: number
          side: string
          sl?: number | null
          swap?: number
          symbol: string
          ticket: number
          tp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission?: number
          current_price?: number | null
          entry?: number
          id?: string
          lots?: number
          opened_at?: string
          profit?: number
          side?: string
          sl?: number | null
          swap?: number
          symbol?: string
          ticket?: number
          tp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          h1_trend: string | null
          id: string
          indicators: Json
          net_edge: number
          patterns: string[]
          regime: string | null
          scanned_at: string
          side: string | null
          spread: number | null
          strength: number
          symbol: string
          user_id: string
        }
        Insert: {
          h1_trend?: string | null
          id?: string
          indicators?: Json
          net_edge?: number
          patterns?: string[]
          regime?: string | null
          scanned_at?: string
          side?: string | null
          spread?: number | null
          strength?: number
          symbol: string
          user_id: string
        }
        Update: {
          h1_trend?: string | null
          id?: string
          indicators?: Json
          net_edge?: number
          patterns?: string[]
          regime?: string | null
          scanned_at?: string
          side?: string | null
          spread?: number | null
          strength?: number
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          close_reason: string | null
          closed_at: string
          created_at: string
          entry: number
          exit: number
          id: string
          lots: number
          opened_at: string
          pips: number
          profit: number
          regime: string | null
          side: string
          signal_strength: number | null
          sl: number | null
          symbol: string
          ticket: number
          tp: number | null
          user_id: string
          win: boolean
        }
        Insert: {
          close_reason?: string | null
          closed_at: string
          created_at?: string
          entry: number
          exit: number
          id?: string
          lots: number
          opened_at: string
          pips?: number
          profit?: number
          regime?: string | null
          side: string
          signal_strength?: number | null
          sl?: number | null
          symbol: string
          ticket: number
          tp?: number | null
          user_id: string
          win?: boolean
        }
        Update: {
          close_reason?: string | null
          closed_at?: string
          created_at?: string
          entry?: number
          exit?: number
          id?: string
          lots?: number
          opened_at?: string
          pips?: number
          profit?: number
          regime?: string | null
          side?: string
          signal_strength?: number | null
          sl?: number | null
          symbol?: string
          ticket?: number
          tp?: number | null
          user_id?: string
          win?: boolean
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
