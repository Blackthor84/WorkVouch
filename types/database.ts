/**
 * Database type definitions for Supabase
 * Generated types based on schema.sql
 * 
 * Note: In production, use Supabase CLI to generate these types:
 * npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type EmploymentType = 
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'
  | 'freelance'

export type UserRole = 'user' | 'employer' | 'admin' | 'superadmin'

export type RelationshipType = 
  | 'coworker'
  | 'supervisor'
  | 'subordinate'
  | 'peer'
  | 'client'
  | 'vendor'

export type ProfileVisibility = 'public' | 'private'

export type ConnectionStatus = 'pending' | 'confirmed' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          city: string | null
          state: string | null
          profile_photo_url: string | null
          professional_summary: string | null
          visibility: ProfileVisibility
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          city?: string | null
          state?: string | null
          profile_photo_url?: string | null
          professional_summary?: string | null
          visibility?: ProfileVisibility
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          city?: string | null
          state?: string | null
          profile_photo_url?: string | null
          professional_summary?: string | null
          visibility?: ProfileVisibility
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: UserRole
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          company_name: string
          job_title: string
          employment_type: EmploymentType
          start_date: string
          end_date: string | null
          is_current: boolean
          location: string | null
          supervisor_name: string | null
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          job_title: string
          employment_type: EmploymentType
          start_date: string
          end_date?: string | null
          is_current?: boolean
          location?: string | null
          supervisor_name?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          job_title?: string
          employment_type?: EmploymentType
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          location?: string | null
          supervisor_name?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          user_id: string
          connected_user_id: string
          job_id: string | null
          status: ConnectionStatus
          initiated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          connected_user_id: string
          job_id?: string | null
          status?: ConnectionStatus
          initiated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          connected_user_id?: string
          job_id?: string | null
          status?: ConnectionStatus
          initiated_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      references: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          job_id: string
          relationship_type: RelationshipType
          rating: number
          written_feedback: string | null
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          job_id: string
          relationship_type: RelationshipType
          rating: number
          written_feedback?: string | null
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          job_id?: string
          relationship_type?: RelationshipType
          rating?: number
          written_feedback?: string | null
          is_deleted?: boolean
          created_at?: string
        }
      }
      trust_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          job_count: number
          reference_count: number
          average_rating: number | null
          calculated_at: string
          version: string
        }
        Insert: {
          id?: string
          user_id: string
          score?: number
          job_count?: number
          reference_count?: number
          average_rating?: number | null
          calculated_at?: string
          version?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          job_count?: number
          reference_count?: number
          average_rating?: number | null
          calculated_at?: string
          version?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trust_score_v1: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      update_trust_score: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      employment_type: EmploymentType
      user_role: UserRole
      relationship_type: RelationshipType
      profile_visibility: ProfileVisibility
      connection_status: ConnectionStatus
    }
  }
}

