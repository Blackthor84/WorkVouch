/**
 * Database type definitions for Supabase
 * Manual types aligned with schema; used for createClient<Database> and typed payloads.
 *
 * For full Supabase client inference (no @ts-expect-error at call sites), generate from CLI:
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
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

export type FeatureVisibility = 'ui' | 'api' | 'both'

export type ComplianceDisputeTypeEnum =
  | 'RehireStatus'
  | 'EmploymentDates'
  | 'PeerVerification'
  | 'Other'

export type ComplianceDisputeStatusEnum =
  | 'Pending'
  | 'UnderReview'
  | 'AwaitingEmployerResponse'
  | 'Resolved'
  | 'Rejected'

export type RehireStatusEnum =
  | 'Approved'
  | 'EligibleWithReview'
  | 'NotEligible'

export type RehireReasonEnum =
  | 'AttendanceIssues'
  | 'PolicyViolation'
  | 'PerformanceConcerns'
  | 'ContractCompletion'
  | 'RoleEliminated'
  | 'Other'

export type SecurityReportSeverityEnum = 'low' | 'medium' | 'high' | 'critical'
export type SecurityReportStatusEnum = 'Open' | 'Investigating' | 'Resolved'

/** Minimal schema shape so Database["public"] extends Supabase GenericSchema (required for .from().update() to infer). */
type PublicSchemaBase = {
  Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: { foreignKeyName: string; columns: string[]; referencedRelation: string; referencedColumns: string[] }[] }>
  Views: Record<string, { Row: Record<string, unknown> }>
  Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
}

/**
 * Database schema type for createClient<Database>.
 * Explicit table types; public extends PublicSchemaBase so .from(table).update() infers correctly.
 */
export interface Database {
  public: PublicSchemaBase & {
    Tables: {
      feature_flags: {
        Row: {
          id: string
          name: string
          key: string
          description: string | null
          is_globally_enabled: boolean
          visibility_type: FeatureVisibility
          required_subscription_tier: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          key: string
          description?: string | null
          is_globally_enabled?: boolean
          visibility_type?: FeatureVisibility
          required_subscription_tier?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          key?: string
          description?: string | null
          is_globally_enabled?: boolean
          visibility_type?: FeatureVisibility
          required_subscription_tier?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_flag_assignments: {
        Row: {
          id: string
          feature_flag_id: string
          user_id: string | null
          employer_id: string | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature_flag_id: string
          user_id?: string | null
          employer_id?: string | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          feature_flag_id?: string
          user_id?: string | null
          employer_id?: string | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          guard_credential_score: number | null
          role: string | null
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
          guard_credential_score?: number | null
          role?: string | null
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
          guard_credential_score?: number | null
          role?: string | null
        }
        Relationships: []
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
        Relationships: []
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
          verification_status: string | null
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
          verification_status?: string | null
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
          verification_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employer_accounts: {
        Row: {
          id: string
          user_id: string
          industry_type?: string | null
          plan_tier?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_interval?: string | null
          lookup_quota?: number | null
          stripe_report_overage_item_id?: string | null
          stripe_search_overage_item_id?: string | null
          stripe_seat_overage_item_id?: string | null
          reports_used?: number | null
          searches_used?: number | null
          billing_cycle_start?: string | null
          billing_cycle_end?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          industry_type?: string | null
          plan_tier?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_interval?: string | null
          lookup_quota?: number | null
          stripe_report_overage_item_id?: string | null
          stripe_search_overage_item_id?: string | null
          stripe_seat_overage_item_id?: string | null
          reports_used?: number | null
          searches_used?: number | null
          billing_cycle_start?: string | null
          billing_cycle_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          industry_type?: string | null
          plan_tier?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_interval?: string | null
          lookup_quota?: number | null
          stripe_report_overage_item_id?: string | null
          stripe_search_overage_item_id?: string | null
          stripe_seat_overage_item_id?: string | null
          reports_used?: number | null
          searches_used?: number | null
          billing_cycle_start?: string | null
          billing_cycle_end?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      compliance_disputes: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          dispute_type: ComplianceDisputeTypeEnum
          description: string
          status: ComplianceDisputeStatusEnum
          reviewer_notes: string | null
          created_at: string
          resolved_at: string | null
          evaluation_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          dispute_type: ComplianceDisputeTypeEnum
          description: string
          status?: ComplianceDisputeStatusEnum
          reviewer_notes?: string | null
          created_at?: string
          resolved_at?: string | null
          evaluation_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          dispute_type?: ComplianceDisputeTypeEnum
          description?: string
          status?: ComplianceDisputeStatusEnum
          reviewer_notes?: string | null
          created_at?: string
          resolved_at?: string | null
          evaluation_id?: string | null
        }
        Relationships: []
      }
      rehire_registry: {
        Row: {
          id: string
          employer_id: string
          profile_id: string
          rehire_eligible: boolean
          internal_notes: string | null
          created_at: string
          updated_at: string
          rehire_status: RehireStatusEnum | null
          reason: RehireReasonEnum | null
          justification: string | null
          detailed_explanation: string | null
          confirmed_accuracy: boolean
          submitted_at: string | null
        }
        Insert: {
          id?: string
          employer_id: string
          profile_id: string
          rehire_eligible?: boolean
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          rehire_status?: RehireStatusEnum | null
          reason?: RehireReasonEnum | null
          justification?: string | null
          detailed_explanation?: string | null
          confirmed_accuracy?: boolean
          submitted_at?: string | null
        }
        Update: {
          id?: string
          employer_id?: string
          profile_id?: string
          rehire_eligible?: boolean
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          rehire_status?: RehireStatusEnum | null
          reason?: RehireReasonEnum | null
          justification?: string | null
          detailed_explanation?: string | null
          confirmed_accuracy?: boolean
          submitted_at?: string | null
        }
        Relationships: []
      }
      rehire_evaluation_versions: {
        Row: {
          id: string
          rehire_registry_id: string
          employer_id: string
          profile_id: string
          rehire_status: RehireStatusEnum | null
          reason: RehireReasonEnum | null
          detailed_explanation: string | null
          confirmed_accuracy: boolean
          submitted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rehire_registry_id: string
          employer_id: string
          profile_id: string
          rehire_status?: RehireStatusEnum | null
          reason?: RehireReasonEnum | null
          detailed_explanation?: string | null
          confirmed_accuracy?: boolean
          submitted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rehire_registry_id?: string
          employer_id?: string
          profile_id?: string
          rehire_status?: RehireStatusEnum | null
          reason?: RehireReasonEnum | null
          detailed_explanation?: string | null
          confirmed_accuracy?: boolean
          submitted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      security_reports: {
        Row: {
          id: string
          reporter_email: string
          description: string
          severity: SecurityReportSeverityEnum
          status: SecurityReportStatusEnum
          created_at: string
        }
        Insert: {
          id?: string
          reporter_email: string
          description: string
          severity?: SecurityReportSeverityEnum
          status?: SecurityReportStatusEnum
          created_at?: string
        }
        Update: {
          id?: string
          reporter_email?: string
          description?: string
          severity?: SecurityReportSeverityEnum
          status?: SecurityReportStatusEnum
          created_at?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          id: string
          admin_id: string
          impersonated_user_id: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          impersonated_user_id: string
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          admin_id?: string
          impersonated_user_id?: string
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          impersonated_user_id: string
          action_type: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          impersonated_user_id: string
          action_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          impersonated_user_id?: string
          action_type?: string
          created_at?: string
        }
        Relationships: []
      }
      careers: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          image: string | null
          employers: number | null
          employees: number | null
          title: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          image?: string | null
          employers?: number | null
          employees?: number | null
          title?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          image?: string | null
          employers?: number | null
          employees?: number | null
          title?: string | null
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          event_id: string
          type: string
          status: string
          error_message: string | null
        }
        Insert: {
          id?: string
          event_id: string
          type: string
          status: string
          error_message?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          type?: string
          status?: string
          error_message?: string | null
        }
        Relationships: []
      }
      employment_records: {
        Row: {
          id: string
          user_id: string
          company_name: string
          company_normalized: string
          job_title: string
          start_date: string
          end_date: string | null
          is_current: boolean
          verification_status: string
          rehire_eligible: boolean | null
          marked_by_employer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          company_normalized: string
          job_title: string
          start_date: string
          end_date?: string | null
          is_current?: boolean
          verification_status?: string
          rehire_eligible?: boolean | null
          marked_by_employer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          company_normalized?: string
          job_title?: string
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          verification_status?: string
          rehire_eligible?: boolean | null
          marked_by_employer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rehire_logs: {
        Row: {
          id: string
          employment_record_id: string
          employer_id: string
          rehire_status: RehireStatusEnum | null
          reason: RehireReasonEnum | null
          justification: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employment_record_id: string
          employer_id: string
          rehire_status?: RehireStatusEnum | null
          reason?: RehireReasonEnum | null
          justification?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employment_record_id?: string
          employer_id?: string
          rehire_status?: RehireStatusEnum | null
          reason?: RehireReasonEnum | null
          justification?: string | null
          created_at?: string
        }
        Relationships: []
      }
      verification_reports: {
        Row: {
          id: string
          employer_id: string
          risk_score: number | null
          industry: string | null
          department: string | null
          job_role: string | null
          worker_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          risk_score?: number | null
          industry?: string | null
          department?: string | null
          job_role?: string | null
          worker_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          risk_score?: number | null
          industry?: string | null
          department?: string | null
          job_role?: string | null
          worker_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
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
      feature_visibility: FeatureVisibility
    }
  }
}

