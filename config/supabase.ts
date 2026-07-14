import { createClient } from '@supabase/supabase-js'
import { config } from './index'

// Client-side Supabase client (uses anon key)
// Only create if environment variables are available
export const supabase = config.supabase.url && config.supabase.anonKey
  ? createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )
  : null

// Server-side Supabase client (uses service role key for admin operations)
export const supabaseAdmin = config.supabase.url && config.supabase.serviceRoleKey
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

// Types for database tables
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: any
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: any
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: any
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          id: string
          user_id: string
          type: string
          status: string
          transcript: any
          feedback: any | null
          job_application_id: string | null
          difficulty: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          status?: string
          transcript?: any
          feedback?: any | null
          job_application_id?: string | null
          difficulty?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          status?: string
          transcript?: any
          feedback?: any | null
          job_application_id?: string | null
          difficulty?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          job_title: string
          company: string
          job_description: string
          resume_text: string
          language: string
          company_research: any
          research_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_title: string
          company: string
          job_description: string
          resume_text: string
          language?: string
          company_research?: any
          research_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_title?: string
          company?: string
          job_description?: string
          resume_text?: string
          language?: string
          company_research?: any
          research_status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          source: string
          job_data: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          source: string
          job_data: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          source?: string
          job_data?: any
          created_at?: string
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
