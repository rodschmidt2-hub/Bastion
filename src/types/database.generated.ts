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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      acordo_origens: {
        Row: {
          acordo_id: string
          agencia_id: string
          fatura_id: string
          id: string
        }
        Insert: {
          acordo_id: string
          agencia_id: string
          fatura_id: string
          id?: string
        }
        Update: {
          acordo_id?: string
          agencia_id?: string
          fatura_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acordo_origens_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_origens_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_origens_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_origens_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_view"
            referencedColumns: ["id"]
          },
        ]
      }
      acordo_parcelas: {
        Row: {
          acordo_id: string
          agencia_id: string
          created_at: string
          data_vencimento: string
          fatura_id: string
          id: string
          numero: number
          status: string
          valor: number
        }
        Insert: {
          acordo_id: string
          agencia_id: string
          created_at?: string
          data_vencimento: string
          fatura_id: string
          id?: string
          numero: number
          status?: string
          valor: number
        }
        Update: {
          acordo_id?: string
          agencia_id?: string
          created_at?: string
          data_vencimento?: string
          fatura_id?: string
          id?: string
          numero?: number
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordo_parcelas_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_parcelas_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_parcelas_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_parcelas_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_view"
            referencedColumns: ["id"]
          },
        ]
      }
      acordos: {
        Row: {
          agencia_id: string
          aprovado_por: string | null
          cliente_id: string
          created_at: string
          criado_por: string
          descricao: string | null
          id: string
          status: string
          tipo: string
          updated_at: string
          valor_acordado: number
          valor_original: number
        }
        Insert: {
          agencia_id: string
          aprovado_por?: string | null
          cliente_id: string
          created_at?: string
          criado_por: string
          descricao?: string | null
          id?: string
          status?: string
          tipo: string
          updated_at?: string
          valor_acordado: number
          valor_original: number
        }
        Update: {
          agencia_id?: string
          aprovado_por?: string | null
          cliente_id?: string
          created_at?: string
          criado_por?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor_acordado?: number
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordos_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agencias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          plano: string
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          plano?: string
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          plano?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_03: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_04: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_05: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_06: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_07: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_08: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_09: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_10: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_11: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2026_12: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_01: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_02: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_03: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_04: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_05: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_06: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_07: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_08: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_09: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_10: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_11: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_log_2027_12: {
        Row: {
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip: string | null
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip?: string | null
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      cliente_socios: {
        Row: {
          agencia_id: string
          cliente_id: string
          created_at: string
          id: string
          motivo: string | null
          papel: string
          percentual_participacao: number | null
          pessoa_id: string
        }
        Insert: {
          agencia_id: string
          cliente_id: string
          created_at?: string
          id?: string
          motivo?: string | null
          papel?: string
          percentual_participacao?: number | null
          pessoa_id: string
        }
        Update: {
          agencia_id?: string
          cliente_id?: string
          created_at?: string
          id?: string
          motivo?: string | null
          papel?: string
          percentual_participacao?: number | null
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_socios_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_socios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_socios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          agencia_id: string
          bairro: string | null
          canal_aquisicao: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          codigo_cliente: string
          complemento: string | null
          created_at: string
          custo_aquisicao: number | null
          data_inativacao: string | null
          data_inicio_relac: string | null
          data_suspensao: string | null
          decisor_email: string | null
          decisor_nome: string | null
          decisor_telefone: string | null
          deleted_at: string | null
          dia_vencimento: number | null
          dias_ate_suspensao: number
          external_ids: Json
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logradouro: string | null
          motivo_inativacao: string | null
          nome_fantasia: string | null
          nota_financeira: string | null
          numero: string | null
          observacoes: string | null
          optante_simples: boolean
          porte: Database["public"]["Enums"]["cliente_porte"] | null
          razao_social: string
          regime_tributario: string | null
          resp_financeiro_email: string | null
          resp_financeiro_nome: string | null
          resp_financeiro_telefone: string | null
          responsavel_id: string | null
          segmento: Database["public"]["Enums"]["cliente_segmento"] | null
          status: Database["public"]["Enums"]["cliente_status"]
          uf: string | null
          updated_at: string
        }
        Insert: {
          agencia_id: string
          bairro?: string | null
          canal_aquisicao?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo_cliente: string
          complemento?: string | null
          created_at?: string
          custo_aquisicao?: number | null
          data_inativacao?: string | null
          data_inicio_relac?: string | null
          data_suspensao?: string | null
          decisor_email?: string | null
          decisor_nome?: string | null
          decisor_telefone?: string | null
          deleted_at?: string | null
          dia_vencimento?: number | null
          dias_ate_suspensao?: number
          external_ids?: Json
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logradouro?: string | null
          motivo_inativacao?: string | null
          nome_fantasia?: string | null
          nota_financeira?: string | null
          numero?: string | null
          observacoes?: string | null
          optante_simples?: boolean
          porte?: Database["public"]["Enums"]["cliente_porte"] | null
          razao_social: string
          regime_tributario?: string | null
          resp_financeiro_email?: string | null
          resp_financeiro_nome?: string | null
          resp_financeiro_telefone?: string | null
          responsavel_id?: string | null
          segmento?: Database["public"]["Enums"]["cliente_segmento"] | null
          status?: Database["public"]["Enums"]["cliente_status"]
          uf?: string | null
          updated_at?: string
        }
        Update: {
          agencia_id?: string
          bairro?: string | null
          canal_aquisicao?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo_cliente?: string
          complemento?: string | null
          created_at?: string
          custo_aquisicao?: number | null
          data_inativacao?: string | null
          data_inicio_relac?: string | null
          data_suspensao?: string | null
          decisor_email?: string | null
          decisor_nome?: string | null
          decisor_telefone?: string | null
          deleted_at?: string | null
          dia_vencimento?: number | null
          dias_ate_suspensao?: number
          external_ids?: Json
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logradouro?: string | null
          motivo_inativacao?: string | null
          nome_fantasia?: string | null
          nota_financeira?: string | null
          numero?: string | null
          observacoes?: string | null
          optante_simples?: boolean
          porte?: Database["public"]["Enums"]["cliente_porte"] | null
          razao_social?: string
          regime_tributario?: string | null
          resp_financeiro_email?: string | null
          resp_financeiro_nome?: string | null
          resp_financeiro_telefone?: string | null
          responsavel_id?: string | null
          segmento?: Database["public"]["Enums"]["cliente_segmento"] | null
          status?: Database["public"]["Enums"]["cliente_status"]
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_cliente: {
        Row: {
          agencia_id: string
          cargo: string | null
          cliente_id: string
          created_at: string
          email: string | null
          id: string
          is_cobranca: boolean
          is_nfe: boolean
          is_principal: boolean
          nome: string
          whatsapp: string | null
        }
        Insert: {
          agencia_id: string
          cargo?: string | null
          cliente_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_cobranca?: boolean
          is_nfe?: boolean
          is_principal?: boolean
          nome: string
          whatsapp?: string | null
        }
        Update: {
          agencia_id?: string
          cargo?: string | null
          cliente_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_cobranca?: boolean
          is_nfe?: boolean
          is_principal?: boolean
          nome?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_cliente_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_itens: {
        Row: {
          agencia_id: string
          contrato_id: string
          created_at: string
          data_fim_item: string | null
          data_inicio_item: string
          desconto_aprovado_por: string | null
          desconto_motivo: string | null
          desconto_percentual: number | null
          desconto_tipo: string | null
          desconto_valido_ate: string | null
          desconto_valor_fixo: number | null
          id: string
          isencao_aprovado_por: string | null
          isencao_motivo: string | null
          isencao_tipo: string | null
          isencao_valido_ate: string | null
          oferta_id: string | null
          produto_id: string
          status: Database["public"]["Enums"]["produto_status"]
          valor_negociado: number
        }
        Insert: {
          agencia_id: string
          contrato_id: string
          created_at?: string
          data_fim_item?: string | null
          data_inicio_item: string
          desconto_aprovado_por?: string | null
          desconto_motivo?: string | null
          desconto_percentual?: number | null
          desconto_tipo?: string | null
          desconto_valido_ate?: string | null
          desconto_valor_fixo?: number | null
          id?: string
          isencao_aprovado_por?: string | null
          isencao_motivo?: string | null
          isencao_tipo?: string | null
          isencao_valido_ate?: string | null
          oferta_id?: string | null
          produto_id: string
          status?: Database["public"]["Enums"]["produto_status"]
          valor_negociado: number
        }
        Update: {
          agencia_id?: string
          contrato_id?: string
          created_at?: string
          data_fim_item?: string | null
          data_inicio_item?: string
          desconto_aprovado_por?: string | null
          desconto_motivo?: string | null
          desconto_percentual?: number | null
          desconto_tipo?: string | null
          desconto_valido_ate?: string | null
          desconto_valor_fixo?: number | null
          id?: string
          isencao_aprovado_por?: string | null
          isencao_motivo?: string | null
          isencao_tipo?: string | null
          isencao_valido_ate?: string | null
          oferta_id?: string | null
          produto_id?: string
          status?: Database["public"]["Enums"]["produto_status"]
          valor_negociado?: number
        }
        Relationships: [
          {
            foreignKeyName: "contrato_itens_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_itens_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_itens_desconto_aprovado_por_fkey"
            columns: ["desconto_aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_itens_isencao_aprovado_por_fkey"
            columns: ["isencao_aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          agencia_id: string
          cliente_id: string
          cobrar_durante_pausa: boolean
          cobrar_juros: boolean
          contrato_pai_id: string | null
          created_at: string
          dados_pix: string | null
          data_assinatura: string
          data_ativacao: string
          data_encerramento: string | null
          data_fim: string | null
          data_pausa: string | null
          data_retomada: string | null
          deleted_at: string | null
          documento_url: string | null
          entid_contrat_doc: string | null
          entid_contrat_id: string | null
          entid_contrat_nome: string | null
          entid_contrat_tipo: string | null
          external_ids: Json
          forma_pagamento: string
          id: string
          juros_atraso_diario: number | null
          motivo_pausa: string | null
          multa_atraso_perc: number | null
          numero_contrato: string
          observacao: string | null
          pausado_por: string | null
          prazo_pagamento: number
          status: Database["public"]["Enums"]["contrato_status"]
          tipo: string
          tipo_vinculo: string | null
          updated_at: string
        }
        Insert: {
          agencia_id: string
          cliente_id: string
          cobrar_durante_pausa?: boolean
          cobrar_juros?: boolean
          contrato_pai_id?: string | null
          created_at?: string
          dados_pix?: string | null
          data_assinatura: string
          data_ativacao: string
          data_encerramento?: string | null
          data_fim?: string | null
          data_pausa?: string | null
          data_retomada?: string | null
          deleted_at?: string | null
          documento_url?: string | null
          entid_contrat_doc?: string | null
          entid_contrat_id?: string | null
          entid_contrat_nome?: string | null
          entid_contrat_tipo?: string | null
          external_ids?: Json
          forma_pagamento: string
          id?: string
          juros_atraso_diario?: number | null
          motivo_pausa?: string | null
          multa_atraso_perc?: number | null
          numero_contrato: string
          observacao?: string | null
          pausado_por?: string | null
          prazo_pagamento?: number
          status?: Database["public"]["Enums"]["contrato_status"]
          tipo: string
          tipo_vinculo?: string | null
          updated_at?: string
        }
        Update: {
          agencia_id?: string
          cliente_id?: string
          cobrar_durante_pausa?: boolean
          cobrar_juros?: boolean
          contrato_pai_id?: string | null
          created_at?: string
          dados_pix?: string | null
          data_assinatura?: string
          data_ativacao?: string
          data_encerramento?: string | null
          data_fim?: string | null
          data_pausa?: string | null
          data_retomada?: string | null
          deleted_at?: string | null
          documento_url?: string | null
          entid_contrat_doc?: string | null
          entid_contrat_id?: string | null
          entid_contrat_nome?: string | null
          entid_contrat_tipo?: string | null
          external_ids?: Json
          forma_pagamento?: string
          id?: string
          juros_atraso_diario?: number | null
          motivo_pausa?: string | null
          multa_atraso_perc?: number | null
          numero_contrato?: string
          observacao?: string | null
          pausado_por?: string | null
          prazo_pagamento?: number
          status?: Database["public"]["Enums"]["contrato_status"]
          tipo?: string
          tipo_vinculo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_contrato_pai_id_fkey"
            columns: ["contrato_pai_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_pausado_por_fkey"
            columns: ["pausado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credito_aplicacoes: {
        Row: {
          agencia_id: string
          created_at: string
          credito_id: string
          fatura_id: string
          id: string
          valor_aplicado: number
        }
        Insert: {
          agencia_id: string
          created_at?: string
          credito_id: string
          fatura_id: string
          id?: string
          valor_aplicado: number
        }
        Update: {
          agencia_id?: string
          created_at?: string
          credito_id?: string
          fatura_id?: string
          id?: string
          valor_aplicado?: number
        }
        Relationships: [
          {
            foreignKeyName: "credito_aplicacoes_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credito_aplicacoes_credito_id_fkey"
            columns: ["credito_id"]
            isOneToOne: false
            referencedRelation: "creditos_cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credito_aplicacoes_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credito_aplicacoes_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_view"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_cliente: {
        Row: {
          agencia_id: string
          cliente_id: string
          created_at: string
          criado_por: string
          fatura_origem_id: string | null
          id: string
          motivo: string | null
          origem: string
          saldo_disponivel: number
          status: string
          valor: number
        }
        Insert: {
          agencia_id: string
          cliente_id: string
          created_at?: string
          criado_por: string
          fatura_origem_id?: string | null
          id?: string
          motivo?: string | null
          origem: string
          saldo_disponivel: number
          status?: string
          valor: number
        }
        Update: {
          agencia_id?: string
          cliente_id?: string
          created_at?: string
          criado_por?: string
          fatura_origem_id?: string | null
          id?: string
          motivo?: string | null
          origem?: string
          saldo_disponivel?: number
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "creditos_cliente_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_cliente_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_cliente_fatura_origem_id_fkey"
            columns: ["fatura_origem_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_cliente_fatura_origem_id_fkey"
            columns: ["fatura_origem_id"]
            isOneToOne: false
            referencedRelation: "faturas_view"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_cliente: {
        Row: {
          agencia_id: string
          arquivo_url: string
          cliente_id: string
          contrato_id: string | null
          created_at: string
          enviado_por: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["documento_tipo"]
        }
        Insert: {
          agencia_id: string
          arquivo_url: string
          cliente_id: string
          contrato_id?: string | null
          created_at?: string
          enviado_por?: string | null
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["documento_tipo"]
        }
        Update: {
          agencia_id?: string
          arquivo_url?: string
          cliente_id?: string
          contrato_id?: string | null
          created_at?: string
          enviado_por?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["documento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cliente_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_cliente: {
        Row: {
          agencia_id: string
          cliente_id: string
          created_at: string
          dados: Json | null
          descricao: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          agencia_id: string
          cliente_id: string
          created_at?: string
          dados?: Json | null
          descricao: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          agencia_id?: string
          cliente_id?: string
          created_at?: string
          dados?: Json | null
          descricao?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_cliente_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_cliente_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fatura_itens: {
        Row: {
          agencia_id: string
          contrato_item_id: string | null
          created_at: string
          descricao: string
          dias_proporcional: number | null
          fatura_id: string
          id: string
          isencao: boolean
          isencao_motivo: string | null
          proporcional: boolean
          valor: number
        }
        Insert: {
          agencia_id: string
          contrato_item_id?: string | null
          created_at?: string
          descricao: string
          dias_proporcional?: number | null
          fatura_id: string
          id?: string
          isencao?: boolean
          isencao_motivo?: string | null
          proporcional?: boolean
          valor: number
        }
        Update: {
          agencia_id?: string
          contrato_item_id?: string | null
          created_at?: string
          descricao?: string
          dias_proporcional?: number | null
          fatura_id?: string
          id?: string
          isencao?: boolean
          isencao_motivo?: string | null
          proporcional?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fatura_itens_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatura_itens_contrato_item_id_fkey"
            columns: ["contrato_item_id"]
            isOneToOne: false
            referencedRelation: "contrato_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatura_itens_contrato_item_id_fkey"
            columns: ["contrato_item_id"]
            isOneToOne: false
            referencedRelation: "produtos_contratados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatura_itens_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatura_itens_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_view"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          agencia_id: string
          cliente_id: string
          competencia: string
          created_at: string
          data_emissao: string
          data_nfe: string | null
          data_vencimento: string
          deleted_at: string | null
          external_ids: Json
          id: string
          juros_aplicado: number | null
          multa_aplicada: number | null
          nfe_numero: string | null
          nfe_url: string | null
          numero_fatura: string
          saldo_devedor: number | null
          status: string
          tipo: string
          updated_at: string
          valor_pago: number
          valor_total: number
        }
        Insert: {
          agencia_id: string
          cliente_id: string
          competencia: string
          created_at?: string
          data_emissao?: string
          data_nfe?: string | null
          data_vencimento: string
          deleted_at?: string | null
          external_ids?: Json
          id?: string
          juros_aplicado?: number | null
          multa_aplicada?: number | null
          nfe_numero?: string | null
          nfe_url?: string | null
          numero_fatura: string
          saldo_devedor?: number | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_pago?: number
          valor_total: number
        }
        Update: {
          agencia_id?: string
          cliente_id?: string
          competencia?: string
          created_at?: string
          data_emissao?: string
          data_nfe?: string | null
          data_vencimento?: string
          deleted_at?: string | null
          external_ids?: Json
          id?: string
          juros_aplicado?: number | null
          multa_aplicada?: number | null
          nfe_numero?: string | null
          nfe_url?: string | null
          numero_fatura?: string
          saldo_devedor?: number | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_pago?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_responsaveis: {
        Row: {
          alterado_por_id: string | null
          cliente_id: string
          created_at: string
          id: string
          responsavel_anterior_id: string | null
          responsavel_novo_id: string | null
        }
        Insert: {
          alterado_por_id?: string | null
          cliente_id: string
          created_at?: string
          id?: string
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
        }
        Update: {
          alterado_por_id?: string | null
          cliente_id?: string
          created_at?: string
          id?: string
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
        }
        Relationships: []
      }
      jobs_log: {
        Row: {
          agencia_id: string | null
          created_at: string
          erro_detalhe: string | null
          finalizado_em: string | null
          id: string
          iniciado_em: string
          job_nome: string
          registros_erro: number
          registros_processados: number
          status: string
        }
        Insert: {
          agencia_id?: string | null
          created_at?: string
          erro_detalhe?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em: string
          job_nome: string
          registros_erro?: number
          registros_processados?: number
          status: string
        }
        Update: {
          agencia_id?: string | null
          created_at?: string
          erro_detalhe?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          job_nome?: string
          registros_erro?: number
          registros_processados?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_log_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr_historico: {
        Row: {
          agencia_id: string
          arr: number
          clientes_ativos: number
          competencia: string
          created_at: string
          custo_total: number | null
          id: string
          margem_percentual: number | null
          mrr: number
        }
        Insert: {
          agencia_id: string
          arr: number
          clientes_ativos: number
          competencia: string
          created_at?: string
          custo_total?: number | null
          id?: string
          margem_percentual?: number | null
          mrr: number
        }
        Update: {
          agencia_id?: string
          arr?: number
          clientes_ativos?: number
          competencia?: string
          created_at?: string
          custo_total?: number | null
          id?: string
          margem_percentual?: number | null
          mrr?: number
        }
        Relationships: [
          {
            foreignKeyName: "mrr_historico_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_config: {
        Row: {
          agencia_id: string
          ativo: boolean
          canal: string
          cliente_id: string | null
          created_at: string
          dias_antecedencia: number[] | null
          evento: string
          id: string
        }
        Insert: {
          agencia_id: string
          ativo?: boolean
          canal: string
          cliente_id?: string | null
          created_at?: string
          dias_antecedencia?: number[] | null
          evento: string
          id?: string
        }
        Update: {
          agencia_id?: string
          ativo?: boolean
          canal?: string
          cliente_id?: string | null
          created_at?: string
          dias_antecedencia?: number[] | null
          evento?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_config_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_config_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_log: {
        Row: {
          agencia_id: string
          canal: string
          cliente_id: string
          created_at: string
          enviado_em: string | null
          evento: string
          fatura_id: string | null
          id: string
          status: string
        }
        Insert: {
          agencia_id: string
          canal: string
          cliente_id: string
          created_at?: string
          enviado_em?: string | null
          evento: string
          fatura_id?: string | null
          id?: string
          status: string
        }
        Update: {
          agencia_id?: string
          canal?: string
          cliente_id?: string
          created_at?: string
          enviado_em?: string | null
          evento?: string
          fatura_id?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_log_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_log_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_log_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_log_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_view"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_registros: {
        Row: {
          agencia_id: string
          cliente_id: string
          created_at: string
          data_registro: string
          id: string
          observacao: string | null
          responsavel_id: string | null
          score: number
        }
        Insert: {
          agencia_id: string
          cliente_id: string
          created_at?: string
          data_registro?: string
          id?: string
          observacao?: string | null
          responsavel_id?: string | null
          score: number
        }
        Update: {
          agencia_id?: string
          cliente_id?: string
          created_at?: string
          data_registro?: string
          id?: string
          observacao?: string | null
          responsavel_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "nps_registros_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_registros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_registros_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agencia_id: string
          comprovante_url: string | null
          created_at: string
          data_estorno: string | null
          data_pagamento: string
          estornado_por: string | null
          external_ids: Json
          fatura_id: string
          forma_pagamento: Database["public"]["Enums"]["pagamento_forma"] | null
          id: string
          motivo_estorno: string | null
          registrado_por: string | null
          status: Database["public"]["Enums"]["pagamento_status"]
          valor_pago: number
        }
        Insert: {
          agencia_id: string
          comprovante_url?: string | null
          created_at?: string
          data_estorno?: string | null
          data_pagamento: string
          estornado_por?: string | null
          external_ids?: Json
          fatura_id: string
          forma_pagamento?:
            | Database["public"]["Enums"]["pagamento_forma"]
            | null
          id?: string
          motivo_estorno?: string | null
          registrado_por?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          valor_pago: number
        }
        Update: {
          agencia_id?: string
          comprovante_url?: string | null
          created_at?: string
          data_estorno?: string | null
          data_pagamento?: string
          estornado_por?: string | null
          external_ids?: Json
          fatura_id?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["pagamento_forma"]
            | null
          id?: string
          motivo_estorno?: string | null
          registrado_por?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_estornado_por_fkey"
            columns: ["estornado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas: {
        Row: {
          agencia_id: string
          cpf: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          agencia_id: string
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          agencia_id?: string
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_ofertas: {
        Row: {
          agencia_id: string
          ativo: boolean
          carencia_meses: number
          created_at: string
          dias_geracao_fatura: number
          id: string
          indice_reajuste: string | null
          juros_atraso_diario: number
          multa_atraso_perc: number
          multa_tipo: string | null
          multa_valor: number | null
          nome: string
          perc_reajuste_fixo: number | null
          periodicidade: string | null
          prazo_aviso_cancelamento: number
          produto_id: string
          renovacao_automatica: boolean
          valor: number
        }
        Insert: {
          agencia_id: string
          ativo?: boolean
          carencia_meses?: number
          created_at?: string
          dias_geracao_fatura?: number
          id?: string
          indice_reajuste?: string | null
          juros_atraso_diario?: number
          multa_atraso_perc?: number
          multa_tipo?: string | null
          multa_valor?: number | null
          nome: string
          perc_reajuste_fixo?: number | null
          periodicidade?: string | null
          prazo_aviso_cancelamento?: number
          produto_id: string
          renovacao_automatica?: boolean
          valor: number
        }
        Update: {
          agencia_id?: string
          ativo?: boolean
          carencia_meses?: number
          created_at?: string
          dias_geracao_fatura?: number
          id?: string
          indice_reajuste?: string | null
          juros_atraso_diario?: number
          multa_atraso_perc?: number
          multa_tipo?: string | null
          multa_valor?: number | null
          nome?: string
          perc_reajuste_fixo?: number | null
          periodicidade?: string | null
          prazo_aviso_cancelamento?: number
          produto_id?: string
          renovacao_automatica?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "produto_ofertas_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_ofertas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_agencia"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_agencia: {
        Row: {
          agencia_id: string
          ativo: boolean
          categoria: string | null
          codigo_produto: string
          created_at: string
          custo_base: number | null
          id: string
          nome: string
          periodicidade: string | null
          tipo: string
          valor_padrao: number | null
        }
        Insert: {
          agencia_id: string
          ativo?: boolean
          categoria?: string | null
          codigo_produto: string
          created_at?: string
          custo_base?: number | null
          id?: string
          nome: string
          periodicidade?: string | null
          tipo: string
          valor_padrao?: number | null
        }
        Update: {
          agencia_id?: string
          ativo?: boolean
          categoria?: string | null
          codigo_produto?: string
          created_at?: string
          custo_base?: number | null
          id?: string
          nome?: string
          periodicidade?: string | null
          tipo?: string
          valor_padrao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_agencia_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agencia_id: string
          ativo: boolean
          created_at: string
          email: string
          id: string
          nivel_desconto: number
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          agencia_id: string
          ativo?: boolean
          created_at?: string
          email: string
          id: string
          nivel_desconto?: number
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          agencia_id?: string
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nivel_desconto?: number
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
      renovacoes: {
        Row: {
          agencia_id: string
          contrato_item_id: string
          created_at: string
          data_anterior: string
          data_nova: string
          id: string
          observacoes: string | null
          renovado_por: string
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          agencia_id: string
          contrato_item_id: string
          created_at?: string
          data_anterior: string
          data_nova: string
          id?: string
          observacoes?: string | null
          renovado_por: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          agencia_id?: string
          contrato_item_id?: string
          created_at?: string
          data_anterior?: string
          data_nova?: string
          id?: string
          observacoes?: string | null
          renovado_por?: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "renovacoes_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovacoes_contrato_item_id_fkey"
            columns: ["contrato_item_id"]
            isOneToOne: false
            referencedRelation: "contrato_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovacoes_contrato_item_id_fkey"
            columns: ["contrato_item_id"]
            isOneToOne: false
            referencedRelation: "produtos_contratados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovacoes_renovado_por_fkey"
            columns: ["renovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sistema_config: {
        Row: {
          agencia_id: string
          chave: string
          created_at: string
          id: string
          valor: string
        }
        Insert: {
          agencia_id: string
          chave: string
          created_at?: string
          id?: string
          valor: string
        }
        Update: {
          agencia_id?: string
          chave?: string
          created_at?: string
          id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "sistema_config_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      faturas_view: {
        Row: {
          agencia_id: string | null
          cliente_id: string | null
          competencia: string | null
          created_at: string | null
          data_emissao: string | null
          data_nfe: string | null
          data_vencimento: string | null
          deleted_at: string | null
          dias_atraso: number | null
          external_ids: Json | null
          id: string | null
          juros_aplicado: number | null
          multa_aplicada: number | null
          nfe_numero: string | null
          nfe_url: string | null
          numero_fatura: string | null
          saldo_devedor: number | null
          status: string | null
          tipo: string | null
          updated_at: string | null
          valor_pago: number | null
          valor_total: number | null
        }
        Insert: {
          agencia_id?: string | null
          cliente_id?: string | null
          competencia?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_nfe?: string | null
          data_vencimento?: string | null
          deleted_at?: string | null
          dias_atraso?: never
          external_ids?: Json | null
          id?: string | null
          juros_aplicado?: number | null
          multa_aplicada?: number | null
          nfe_numero?: string | null
          nfe_url?: string | null
          numero_fatura?: string | null
          saldo_devedor?: number | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_total?: number | null
        }
        Update: {
          agencia_id?: string | null
          cliente_id?: string | null
          competencia?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_nfe?: string | null
          data_vencimento?: string | null
          deleted_at?: string | null
          dias_atraso?: never
          external_ids?: Json | null
          id?: string | null
          juros_aplicado?: number | null
          multa_aplicada?: number | null
          nfe_numero?: string | null
          nfe_url?: string | null
          numero_fatura?: string | null
          saldo_devedor?: number | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faturas_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      inadimplencia_snapshot: {
        Row: {
          agencia_id: string | null
          clientes_inadimplentes: number | null
          media_dias_atraso: number | null
          total_faturas_atrasadas: number | null
          valor_total_aberto: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faturas_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr_snapshot: {
        Row: {
          agencia_id: string | null
          arr: number | null
          clientes_ativos: number | null
          competencia: string | null
          custo_total: number | null
          margem_percentual: number | null
          mrr: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_itens_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_contratados: {
        Row: {
          agencia_id: string | null
          categoria: string | null
          cliente_id: string | null
          contrato_id: string | null
          contrato_status: Database["public"]["Enums"]["contrato_status"] | null
          custo_base: number | null
          data_fim_item: string | null
          data_inicio_item: string | null
          dia_vencimento: number | null
          forma_pagamento: string | null
          id: string | null
          item_status: Database["public"]["Enums"]["produto_status"] | null
          oferta_id: string | null
          periodicidade: string | null
          produto_id: string | null
          produto_nome: string | null
          produto_tipo: string | null
          valor_efetivo: number | null
          valor_negociado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_itens_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "agencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_itens_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_agencia_id: { Args: never; Returns: string }
      fn_user_role: { Args: never; Returns: string }
      get_my_is_active: { Args: never; Returns: boolean }
      get_my_role: { Args: never; Returns: string }
      user_has_client_access: {
        Args: { p_cliente_id: string }
        Returns: boolean
      }
    }
    Enums: {
      cliente_porte: "pequeno" | "medio" | "grande"
      cliente_segmento: "solo" | "rede" | "especialidade"
      cliente_status:
        | "ativo"
        | "inadimplente"
        | "cancelado"
        | "pausado"
        | "inativo"
        | "suspenso"
      contrato_status:
        | "ativo"
        | "pausado"
        | "cancelado"
        | "em_renovacao"
        | "encerrado"
      documento_tipo:
        | "contrato"
        | "procuracao"
        | "autorizacao"
        | "nota_fiscal"
        | "outro"
      pagamento_forma: "pix" | "boleto" | "cartao" | "transferencia" | "outro"
      pagamento_status: "confirmado" | "pendente" | "estornado"
      produto_status: "ativo" | "pausado" | "cancelado"
      user_role: "admin" | "gestor" | "comercial" | "financeiro" | "operacional"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cliente_porte: ["pequeno", "medio", "grande"],
      cliente_segmento: ["solo", "rede", "especialidade"],
      cliente_status: [
        "ativo",
        "inadimplente",
        "cancelado",
        "pausado",
        "inativo",
        "suspenso",
      ],
      contrato_status: [
        "ativo",
        "pausado",
        "cancelado",
        "em_renovacao",
        "encerrado",
      ],
      documento_tipo: [
        "contrato",
        "procuracao",
        "autorizacao",
        "nota_fiscal",
        "outro",
      ],
      pagamento_forma: ["pix", "boleto", "cartao", "transferencia", "outro"],
      pagamento_status: ["confirmado", "pendente", "estornado"],
      produto_status: ["ativo", "pausado", "cancelado"],
      user_role: ["admin", "gestor", "comercial", "financeiro", "operacional"],
    },
  },
} as const
