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
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          age: string | null
          therapy_type: string | null
          focus_areas: string[]
          hobbies: string[]
          short_term_goals: string | null
          long_term_goals: string | null
          notes: string | null
          last_session_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          age?: string | null
          therapy_type?: string | null
          focus_areas?: string[]
          hobbies?: string[]
          short_term_goals?: string | null
          long_term_goals?: string | null
          notes?: string | null
          last_session_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          age?: string | null
          therapy_type?: string | null
          focus_areas?: string[]
          hobbies?: string[]
          short_term_goals?: string | null
          long_term_goals?: string | null
          notes?: string | null
          last_session_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          client_id: string
          topic: string
          session_date: string
          overview: string | null
          structure: Json[]
          techniques: Json[]
          homework: string[]
          therapist_notes: string | null
          resources: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          topic: string
          session_date: string
          overview?: string | null
          structure?: Json[]
          techniques?: Json[]
          homework?: string[]
          therapist_notes?: string | null
          resources?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          topic?: string
          session_date?: string
          overview?: string | null
          structure?: Json[]
          techniques?: Json[]
          homework?: string[]
          therapist_notes?: string | null
          resources?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          client_id: string | null
          title: string
          type: string
          content: Json
          formatted_content: Json | null
          content_format: string | null
          content_version: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          title: string
          type: string
          content: Json
          formatted_content?: Json | null
          content_format?: string | null
          content_version?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          title?: string
          type?: string
          content?: Json
          formatted_content?: Json | null
          content_format?: string | null
          content_version?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}