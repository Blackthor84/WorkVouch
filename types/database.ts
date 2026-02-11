/**
 * Database type definitions for Supabase (single source of truth).
 * Used by createClient<Database> and typed payloads.
 *
 * To regenerate from Supabase schema (fix type drift):
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 * Or output to lib/database.types.ts and update imports to "@/lib/database.types".
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
      platform_verticals: {
        Row: {
          id: string
          name: string
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          enabled?: boolean
          created_at?: string
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
          employer_visibility: string | null
          created_at: string
          updated_at: string
          guard_credential_score: number | null
          role: string | null
          industry: string | null
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
          vertical?: string | null
          vertical_metadata?: Json | null
          status: string | null
          risk_level: string | null
          flagged_for_fraud: boolean
          deleted_at: string | null
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
          employer_visibility?: string | null
          created_at?: string
          updated_at?: string
          guard_credential_score?: number | null
          role?: string | null
          industry?: string | null
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
          vertical?: string | null
          vertical_metadata?: Json | null
          status?: string | null
          risk_level?: string | null
          flagged_for_fraud?: boolean
          deleted_at?: string | null
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
          employer_visibility?: string | null
          created_at?: string
          updated_at?: string
          guard_credential_score?: number | null
          role?: string | null
          industry?: string | null
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
          vertical?: string | null
          vertical_metadata?: Json | null
          status?: string | null
          risk_level?: string | null
          flagged_for_fraud?: boolean
          deleted_at?: string | null
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
          company_name: string
          industry_type?: string | null
          plan_tier?: string | null
          claimed?: boolean | null
          claim_verified?: boolean | null
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
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          industry_type?: string | null
          plan_tier?: string | null
          claimed?: boolean | null
          claim_verified?: boolean | null
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
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          industry_type?: string | null
          plan_tier?: string | null
          claimed?: boolean | null
          claim_verified?: boolean | null
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
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
        }
        Relationships: []
      }
      employer_notifications: {
        Row: {
          id: string
          employer_id: string
          type: string
          related_user_id: string | null
          related_record_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          type: string
          related_user_id?: string | null
          related_record_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          type?: string
          related_user_id?: string | null
          related_record_id?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      employment_match_scores: {
        Row: {
          id: string
          employment_id: string
          confidence_score: number
          breakdown: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employment_id: string
          confidence_score?: number
          breakdown?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employment_id?: string
          confidence_score?: number
          breakdown?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employer_reputation_snapshots: {
        Row: {
          id: string
          employer_id: string
          reputation_score: number
          verification_integrity_score: number
          dispute_ratio_score: number
          rehire_confirmation_score: number
          worker_retention_score: number
          response_time_score: number
          workforce_risk_score: number
          fraud_flag_score: number
          network_trust_score: number
          compliance_score: number
          percentile_rank: number | null
          industry_percentile_rank: number | null
          model_version: string | null
          last_calculated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      employer_reputation_history: {
        Row: {
          id: string
          employer_id: string
          reputation_score: number
          breakdown: Json
          calculated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      preview_employer_simulations: {
        Row: {
          id: string
          employer_id: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          created_at?: string
          expires_at?: string
        }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      employer_claim_requests: {
        Row: {
          id: string
          employer_id: string
          requested_by_user_id: string
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          requested_by_user_id: string
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          requested_by_user_id?: string
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
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
          employer_id: string | null
          created_at: string
          updated_at: string
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
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
          employer_id?: string | null
          created_at?: string
          updated_at?: string
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
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
          employer_id?: string | null
          created_at?: string
          updated_at?: string
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
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
      simulation_sessions: {
        Row: {
          id: string
          created_by_admin_id: string
          created_at: string
          start_at: string
          expires_at: string
          is_active: boolean
          auto_delete: boolean
          status: string
        }
        Insert: {
          id?: string
          created_by_admin_id: string
          created_at?: string
          start_at?: string
          expires_at: string
          is_active?: boolean
          auto_delete?: boolean
          status?: string
        }
        Update: {
          id?: string
          created_by_admin_id?: string
          created_at?: string
          start_at?: string
          expires_at?: string
          is_active?: boolean
          auto_delete?: boolean
          status?: string
        }
        Relationships: []
      }
      intelligence_sandboxes: {
        Row: {
          id: string
          name: string | null
          created_by: string
          starts_at: string
          ends_at: string
          auto_delete: boolean
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          created_by: string
          starts_at: string
          ends_at: string
          auto_delete?: boolean
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          created_by?: string
          starts_at?: string
          ends_at?: string
          auto_delete?: boolean
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      sandbox_ad_campaigns: {
        Row: {
          id: string
          sandbox_id: string
          employer_id: string | null
          type: string
          impressions: number
          clicks: number
          conversions: number
          spend: number
          created_at: string
        }
        Insert: {
          id?: string
          sandbox_id: string
          employer_id?: string | null
          type: string
          impressions?: number
          clicks?: number
          conversions?: number
          spend?: number
          created_at?: string
        }
        Update: {
          id?: string
          sandbox_id?: string
          employer_id?: string | null
          type?: string
          impressions?: number
          clicks?: number
          conversions?: number
          spend?: number
          created_at?: string
        }
        Relationships: []
      }
      data_density_snapshots: {
        Row: {
          id: string
          snapshot_at: string
          scope: string
          scope_id: string | null
          profiles_count: number
          employment_records_count: number
          references_count: number
          intelligence_rows_count: number
          is_simulation: boolean
          simulation_session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          snapshot_at?: string
          scope: string
          scope_id?: string | null
          profiles_count: number
          employment_records_count: number
          references_count: number
          intelligence_rows_count: number
          is_simulation?: boolean
          simulation_session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          snapshot_at?: string
          scope?: string
          scope_id?: string | null
          profiles_count?: number
          employment_records_count?: number
          references_count?: number
          intelligence_rows_count?: number
          is_simulation?: boolean
          simulation_session_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      unified_intelligence_scores: {
        Row: {
          id: string
          user_id: string
          employer_id: string | null
          profile_strength: number
          career_health_score: number
          stability_score: number
          reference_score: number
          rehire_probability: number
          dispute_score: number
          network_density_score: number
          fraud_confidence: number
          overall_risk_score: number
          hiring_confidence_score: number | null
          team_fit_score: number | null
          model_version: string
          is_simulation: boolean
          simulation_session_id: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employer_id?: string | null
          profile_strength?: number
          career_health_score?: number
          stability_score?: number
          reference_score?: number
          rehire_probability?: number
          dispute_score?: number
          network_density_score?: number
          fraud_confidence?: number
          overall_risk_score?: number
          hiring_confidence_score?: number | null
          team_fit_score?: number | null
          model_version?: string
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employer_id?: string | null
          profile_strength?: number
          career_health_score?: number
          stability_score?: number
          reference_score?: number
          rehire_probability?: number
          dispute_score?: number
          network_density_score?: number
          fraud_confidence?: number
          overall_risk_score?: number
          hiring_confidence_score?: number | null
          team_fit_score?: number | null
          model_version?: string
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sandbox_sessions: {
        Row: {
          id: string
          name: string | null
          created_by: string | null
          starts_at: string | null
          ends_at: string | null
          status: string
          created_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_profiles: {
        Row: {
          id: string
          sandbox_session_id: string
          created_by_admin: string
          industry: string
          sub_industry: string | null
          role_title: string | null
          expires_at: string
          is_sandbox: boolean
          created_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_behavioral_profile_vector: {
        Row: {
          id: string
          profile_id: string
          avg_pressure: number | null
          avg_structure: number | null
          avg_communication: number | null
          avg_leadership: number | null
          avg_reliability: number | null
          avg_initiative: number | null
          conflict_risk_level: number | null
          tone_stability: number | null
          review_density_weight: number | null
          expires_at: string
          is_sandbox: boolean
          last_updated: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_industry_baselines: {
        Row: {
          id: string
          sandbox_session_id: string
          industry: string
          avg_pressure: number | null
          avg_structure: number | null
          avg_communication: number | null
          avg_leadership: number | null
          avg_reliability: number | null
          avg_initiative: number | null
          avg_conflict_risk: number | null
          avg_tone_stability: number | null
          sample_size: number
          model_version: string
          expires_at: string
          is_sandbox: boolean
          updated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_employer_baselines: {
        Row: {
          id: string
          sandbox_session_id: string
          employer_id: string | null
          avg_pressure: number | null
          avg_structure: number | null
          avg_communication: number | null
          avg_leadership: number | null
          avg_reliability: number | null
          avg_initiative: number | null
          avg_conflict_risk: number | null
          avg_tone_stability: number | null
          employee_sample_size: number
          expires_at: string
          is_sandbox: boolean
          last_updated: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_baseline_snapshots: {
        Row: {
          id: string
          sandbox_session_id: string
          baseline_before: Json
          baseline_after: Json
          delta_percent: Json
          created_at: string
          expires_at: string
          is_sandbox: boolean
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_team_fit_scores: {
        Row: {
          id: string
          sandbox_session_id: string
          profile_id: string
          employer_id: string | null
          alignment_score: number
          breakdown: Json | null
          model_version: string
          expires_at: string
          is_sandbox: boolean
          updated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_risk_model_outputs: {
        Row: {
          id: string
          sandbox_session_id: string
          profile_id: string
          employer_id: string | null
          overall_score: number
          breakdown: Json | null
          model_version: string
          expires_at: string
          is_sandbox: boolean
          updated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_hiring_confidence_scores: {
        Row: {
          id: string
          sandbox_session_id: string
          profile_id: string
          employer_id: string | null
          composite_score: number
          breakdown: Json | null
          model_version: string
          expires_at: string
          is_sandbox: boolean
          updated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_employees: {
        Row: { id: string; sandbox_id: string; full_name: string | null; industry: string | null; created_at: string; vertical: string | null; vertical_metadata: Json | null }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_employers: {
        Row: { id: string; sandbox_id: string; company_name: string | null; industry: string | null; plan_tier: string | null; created_at: string; vertical: string | null; vertical_metadata: Json | null }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_employment_records: {
        Row: { id: string; sandbox_id: string; employee_id: string; employer_id: string; role: string | null; tenure_months: number | null; rehire_eligible: boolean | null; start_date: string | null; end_date: string | null; department: string | null; verified: boolean | null; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_peer_reviews: {
        Row: { id: string; sandbox_id: string; reviewer_id: string | null; reviewed_id: string | null; rating: number | null; review_text: string | null; sentiment_score: number | null; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_intelligence_outputs: {
        Row: { id: string; sandbox_id: string; employee_id: string | null; profile_strength: number | null; career_health: number | null; risk_index: number | null; team_fit: number | null; hiring_confidence: number | null; network_density: number | null; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_revenue: {
        Row: { id: string; sandbox_id: string; mrr: number | null; churn_rate: number | null; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_ads: {
        Row: { id: string; sandbox_id: string; employer_id: string | null; impressions: number; clicks: number; spend: number | null; roi: number | null; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_templates: {
        Row: { id: string; template_key: string; display_name: string; industry: string; default_employee_count: number; description: string | null; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_session_summary: {
        Row: { id: string; sandbox_id: string; avg_profile_strength: number | null; avg_career_health: number | null; avg_risk_index: number | null; hiring_confidence_mean: number | null; network_density: number | null; revenue_projection: number | null; ad_roi: number | null; data_density_index: number | null; demo_mode: string | null; created_at: string; updated_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_metrics: {
        Row: { id: string; sandbox_id: string; profiles_count: number; employment_records_count: number; references_count: number; avg_profile_strength: number | null; avg_career_health: number | null; avg_risk_index: number | null; avg_team_fit: number | null; avg_hiring_confidence: number | null; avg_network_density: number | null; mrr: number | null; ad_roi: number | null; created_at: string; updated_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_feature_registry: {
        Row: { id: string; feature_key: string; is_enabled: boolean; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_feature_overrides: {
        Row: { sandbox_id: string; feature_key: string; is_enabled: boolean }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      sandbox_features: {
        Row: { id: string; sandbox_id: string; feature_key: string; is_enabled: boolean; created_at: string }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      employment_references: {
        Row: {
          id: string
          employment_match_id: string
          reviewer_id: string
          reviewed_user_id: string
          rating: number
          reliability_score: number | null
          comment: string | null
          created_at: string
          flagged: boolean
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      employment_matches: {
        Row: {
          id: string
          employment_record_id: string
          matched_user_id: string
          overlap_start: string
          overlap_end: string
          match_status: string
          created_at: string
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
        Relationships: []
      }
      hiring_confidence_scores: {
        Row: {
          id: string
          candidate_id: string
          employer_id: string
          model_version: string
          composite_score: number
          breakdown: Json
          created_at: string
          updated_at: string
          is_simulation?: boolean
          simulation_session_id?: string | null
          expires_at?: string | null
          sandbox_id?: string | null
        }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
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
      simulation_session_transition_status: {
        Args: Record<string, never>
        Returns: undefined
      }
      purge_expired_simulations: {
        Args: Record<string, never>
        Returns: { deleted_table: string; deleted_count: number }[]
      }
      get_expired_simulation_profile_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      get_simulation_profile_ids_by_session: {
        Args: { p_session_id: string }
        Returns: string[]
      }
      purge_simulation_session: {
        Args: { p_session_id: string }
        Returns: { deleted_table: string; deleted_count: number }[]
      }
      cleanup_expired_intelligence_sandboxes: {
        Args: Record<string, never>
        Returns: { sandbox_id: string; deleted_count: number }[]
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

