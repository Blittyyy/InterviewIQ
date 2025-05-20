export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      waitlist: {
        Row: {
          id: string
          email: string
          status: "pending" | "approved" | "rejected"
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          status?: "pending" | "approved" | "rejected"
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          status?: "pending" | "approved" | "rejected"
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          plan: "free" | "pro" | "enterprise"
          subscription_status: "free" | "pro" | "enterprise" | "day-pass"
          subscription_end_date: string | null
          reports_generated: number
          daily_reports_count: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          plan?: "free" | "pro" | "enterprise"
          subscription_status?: "free" | "pro" | "enterprise" | "day-pass"
          subscription_end_date?: string | null
          reports_generated?: number
          daily_reports_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan?: "free" | "pro" | "enterprise"
          subscription_status?: "free" | "pro" | "enterprise" | "day-pass"
          subscription_end_date?: string | null
          reports_generated?: number
          daily_reports_count?: number
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          company_name: string
          company_website: string | null
          job_description: string | null
          status: "pending" | "completed" | "failed"
          data: Json | null
          summary: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          company_website?: string | null
          job_description?: string | null
          status?: "pending" | "completed" | "failed"
          data?: Json | null
          summary?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          company_website?: string | null
          job_description?: string | null
          status?: "pending" | "completed" | "failed"
          data?: Json | null
          summary?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment: {
        Args: {
          x: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 