export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      admin_audit_events: {
        Row: {
          actor_role: Database["public"]["Enums"]["app_admin_role"] | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          actor_role?: Database["public"]["Enums"]["app_admin_role"] | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          actor_role?: Database["public"]["Enums"]["app_admin_role"] | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      admin_storage_snapshots: {
        Row: {
          created_at: string
          index_bytes: number
          snapshot_date: string
          table_bytes: number
          top_tables: Json
          total_bytes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          index_bytes?: number
          snapshot_date?: string
          table_bytes?: number
          top_tables?: Json
          total_bytes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          index_bytes?: number
          snapshot_date?: string
          table_bytes?: number
          top_tables?: Json
          total_bytes?: number
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_published: boolean
          kind: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_admins: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          notes: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          notes?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          notes?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_sessions: {
        Row: {
          app_version: string | null
          browser_family: string | null
          club_id: string | null
          current_view: string | null
          device_type: string | null
          last_seen_at: string
          metadata: Json
          session_id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          browser_family?: string | null
          club_id?: string | null
          current_view?: string | null
          device_type?: string | null
          last_seen_at?: string
          metadata?: Json
          session_id: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          browser_family?: string | null
          club_id?: string | null
          current_view?: string | null
          device_type?: string | null
          last_seen_at?: string
          metadata?: Json
          session_id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      app_usage_events: {
        Row: {
          app_version: string | null
          browser_family: string | null
          club_id: string | null
          created_at: string
          device_type: string | null
          event_type: string
          feature_name: string | null
          id: string
          metadata: Json
          session_id: string | null
          user_id: string | null
          view_name: string | null
        }
        Insert: {
          app_version?: string | null
          browser_family?: string | null
          club_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          feature_name?: string | null
          id?: string
          metadata?: Json
          session_id?: string | null
          user_id?: string | null
          view_name?: string | null
        }
        Update: {
          app_version?: string | null
          browser_family?: string | null
          club_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          feature_name?: string | null
          id?: string
          metadata?: Json
          session_id?: string | null
          user_id?: string | null
          view_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_usage_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_development_plan_weeks: {
        Row: {
          assessment_session_id: string
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          drill_ids: Json
          focus: string
          focus_attribute_id: string
          id: string
          notes: string
          origin_device_id: string | null
          priority_score: number
          updated_at: string
          updated_by: string | null
          version: number
          week_number: number
        }
        Insert: {
          assessment_session_id: string
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          drill_ids?: Json
          focus: string
          focus_attribute_id: string
          id: string
          notes?: string
          origin_device_id?: string | null
          priority_score: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          week_number: number
        }
        Update: {
          assessment_session_id?: string
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          drill_ids?: Json
          focus?: string
          focus_attribute_id?: string
          id?: string
          notes?: string
          origin_device_id?: string | null
          priority_score?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_development_plan_weeks_assessment_session_id_fkey"
            columns: ["assessment_session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_development_plan_weeks_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_development_plan_weeks_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"]
          assessment_date: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          attribute_deltas: Json | null
          attribute_scores: Json
          benchmark_version: string
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          ovr: number
          ovr_tier_label: string
          player_id: string
          previous_session_id: string | null
          raw_results: Json
          role: Database["public"]["Enums"]["fprds_role"]
          scoring_algorithm_version: string
          updated_at: string
          updated_by: string | null
          version: number
          weakest_attribute_id: string
          weighting_version: string
        }
        Insert: {
          age_group: Database["public"]["Enums"]["age_group"]
          assessment_date: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          attribute_deltas?: Json | null
          attribute_scores: Json
          benchmark_version: string
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          origin_device_id?: string | null
          ovr: number
          ovr_tier_label: string
          player_id: string
          previous_session_id?: string | null
          raw_results: Json
          role: Database["public"]["Enums"]["fprds_role"]
          scoring_algorithm_version: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          weakest_attribute_id: string
          weighting_version: string
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"]
          assessment_date?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          attribute_deltas?: Json | null
          attribute_scores?: Json
          benchmark_version?: string
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          origin_device_id?: string | null
          ovr?: number
          ovr_tier_label?: string
          player_id?: string
          previous_session_id?: string | null
          raw_results?: Json
          role?: Database["public"]["Enums"]["fprds_role"]
          scoring_algorithm_version?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          weakest_attribute_id?: string
          weighting_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          club_id: string | null
          correlation_id: string | null
          device_id: string | null
          event_time: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          correlation_id?: string | null
          device_id?: string | null
          event_time?: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          correlation_id?: string | null
          device_id?: string | null
          event_time?: string
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          club_id: string | null
          created_at: string
          email: string | null
          id: string
          metadata: Json
          name: string | null
          provider: Database["public"]["Enums"]["billing_provider"]
          provider_customer_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          provider: Database["public"]["Enums"]["billing_provider"]
          provider_customer_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          provider?: Database["public"]["Enums"]["billing_provider"]
          provider_customer_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          event_type: string
          id: string
          payload_summary: Json
          processed_at: string | null
          processing_error: string | null
          provider: Database["public"]["Enums"]["billing_provider"]
          provider_event_id: string
          received_at: string
        }
        Insert: {
          event_type: string
          id?: string
          payload_summary?: Json
          processed_at?: string | null
          processing_error?: string | null
          provider: Database["public"]["Enums"]["billing_provider"]
          provider_event_id: string
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload_summary?: Json
          processed_at?: string | null
          processing_error?: string | null
          provider?: Database["public"]["Enums"]["billing_provider"]
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      bulletins: {
        Row: {
          author_snapshot: string
          bulletin_date: string
          category: Database["public"]["Enums"]["bulletin_category"]
          client_created_at: string | null
          club_id: string
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          author_snapshot: string
          bulletin_date: string
          category: Database["public"]["Enums"]["bulletin_category"]
          client_created_at?: string | null
          club_id: string
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          origin_device_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          author_snapshot?: string
          bulletin_date?: string
          category?: Database["public"]["Enums"]["bulletin_category"]
          client_created_at?: string | null
          club_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          origin_device_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bulletins_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      club_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          club_id: string
          created_at: string
          email: string
          email_lower: string | null
          expires_at: string
          id: string
          invited_at: string
          invited_by: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["club_invitation_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          club_id: string
          created_at?: string
          email: string
          email_lower?: string | null
          expires_at: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["club_invitation_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          club_id?: string
          created_at?: string
          email?: string
          email_lower?: string | null
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["club_invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_invitations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_join_codes: {
        Row: {
          club_id: string
          code: string
          created_at: string
          created_by: string | null
          updated_at: string
        }
        Insert: {
          club_id: string
          code: string
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
        Update: {
          club_id?: string
          code?: string
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_join_codes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          accepted_at: string | null
          club_id: string
          created_at: string
          id: string
          invited_at: string | null
          membership_state: Database["public"]["Enums"]["membership_state"]
          removed_at: string | null
          role: Database["public"]["Enums"]["membership_role"]
          suspended_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          club_id: string
          created_at?: string
          id?: string
          invited_at?: string | null
          membership_state?: Database["public"]["Enums"]["membership_state"]
          removed_at?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          suspended_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          club_id?: string
          created_at?: string
          id?: string
          invited_at?: string | null
          membership_state?: Database["public"]["Enums"]["membership_state"]
          removed_at?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          club_state: Database["public"]["Enums"]["club_state"]
          created_at: string
          deleted_at: string | null
          founded: string | null
          id: string
          league: string | null
          logo_color: string
          logo_url: string | null
          name: string
          owner_user_id: string
          pending_deletion_at: string | null
          short_name: string | null
          stadium: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          club_state?: Database["public"]["Enums"]["club_state"]
          created_at?: string
          deleted_at?: string | null
          founded?: string | null
          id?: string
          league?: string | null
          logo_color?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          pending_deletion_at?: string | null
          short_name?: string | null
          stadium?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          club_state?: Database["public"]["Enums"]["club_state"]
          created_at?: string
          deleted_at?: string | null
          founded?: string | null
          id?: string
          league?: string | null
          logo_color?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          pending_deletion_at?: string | null
          short_name?: string | null
          stadium?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_notes: {
        Row: {
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          note: string
          origin_device_id: string | null
          subject_id: string
          subject_type: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          note: string
          origin_device_id?: string | null
          subject_id: string
          subject_type?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          note?: string
          origin_device_id?: string | null
          subject_id?: string
          subject_type?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          app_version: string | null
          created_at: string
          id: string
          label: string | null
          last_seen_at: string | null
          last_sync_at: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          id: string
          label?: string | null
          last_seen_at?: string | null
          last_sync_at?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          id?: string
          label?: string | null
          last_seen_at?: string | null
          last_sync_at?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          admin_notes: string | null
          affected_area: string
          assigned_to: string | null
          browser: string | null
          category: Database["public"]["Enums"]["feedback_category"]
          club_id: string | null
          contact_email: string | null
          created_at: string
          details: string
          expected_behavior: string | null
          id: string
          page_url: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          subject: string
          team_workspace: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["feedback_urgency"]
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          affected_area: string
          assigned_to?: string | null
          browser?: string | null
          category: Database["public"]["Enums"]["feedback_category"]
          club_id?: string | null
          contact_email?: string | null
          created_at?: string
          details: string
          expected_behavior?: string | null
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          subject: string
          team_workspace?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["feedback_urgency"]
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          affected_area?: string
          assigned_to?: string | null
          browser?: string | null
          category?: Database["public"]["Enums"]["feedback_category"]
          club_id?: string | null
          contact_email?: string | null
          created_at?: string
          details?: string
          expected_behavior?: string | null
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          subject?: string
          team_workspace?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["feedback_urgency"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submissions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      fprds_benchmark_corrections: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"]
          attribute_id: string
          created_at: string
          created_by: string | null
          current_raw_best: number | null
          current_raw_worst: number | null
          decided_at: string | null
          decided_by: string | null
          drill_id: string
          id: string
          proposed_raw_best: number | null
          proposed_raw_worst: number | null
          rationale: string
          review_id: string | null
          role: Database["public"]["Enums"]["fprds_role"] | null
          status: Database["public"]["Enums"]["fprds_benchmark_correction_status"]
          target_benchmark_version: string | null
          tier_label: string
          updated_at: string
        }
        Insert: {
          age_group: Database["public"]["Enums"]["age_group"]
          attribute_id: string
          created_at?: string
          created_by?: string | null
          current_raw_best?: number | null
          current_raw_worst?: number | null
          decided_at?: string | null
          decided_by?: string | null
          drill_id: string
          id?: string
          proposed_raw_best?: number | null
          proposed_raw_worst?: number | null
          rationale: string
          review_id?: string | null
          role?: Database["public"]["Enums"]["fprds_role"] | null
          status?: Database["public"]["Enums"]["fprds_benchmark_correction_status"]
          target_benchmark_version?: string | null
          tier_label: string
          updated_at?: string
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"]
          attribute_id?: string
          created_at?: string
          created_by?: string | null
          current_raw_best?: number | null
          current_raw_worst?: number | null
          decided_at?: string | null
          decided_by?: string | null
          drill_id?: string
          id?: string
          proposed_raw_best?: number | null
          proposed_raw_worst?: number | null
          rationale?: string
          review_id?: string | null
          role?: Database["public"]["Enums"]["fprds_role"] | null
          status?: Database["public"]["Enums"]["fprds_benchmark_correction_status"]
          target_benchmark_version?: string | null
          tier_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fprds_benchmark_corrections_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "fprds_benchmark_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      fprds_benchmark_reviews: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"]
          attribute_id: string
          benchmark_version: string
          created_at: string
          created_by: string | null
          distribution_summary: Json
          drill_id: string
          id: string
          review_decision: Database["public"]["Enums"]["fprds_benchmark_review_decision"]
          reviewer_notes: string | null
          role: Database["public"]["Enums"]["fprds_role"] | null
          sample_size: number
          updated_at: string
        }
        Insert: {
          age_group: Database["public"]["Enums"]["age_group"]
          attribute_id: string
          benchmark_version: string
          created_at?: string
          created_by?: string | null
          distribution_summary?: Json
          drill_id: string
          id?: string
          review_decision?: Database["public"]["Enums"]["fprds_benchmark_review_decision"]
          reviewer_notes?: string | null
          role?: Database["public"]["Enums"]["fprds_role"] | null
          sample_size?: number
          updated_at?: string
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"]
          attribute_id?: string
          benchmark_version?: string
          created_at?: string
          created_by?: string | null
          distribution_summary?: Json
          drill_id?: string
          id?: string
          review_decision?: Database["public"]["Enums"]["fprds_benchmark_review_decision"]
          reviewer_notes?: string | null
          role?: Database["public"]["Enums"]["fprds_role"] | null
          sample_size?: number
          updated_at?: string
        }
        Relationships: []
      }
      fprds_beta_drill_results: {
        Row: {
          attribute_id: string
          benchmark_band: Json
          created_at: string
          drill_id: string
          id: string
          raw_value: number
          score: number | null
          submission_id: string
          unit: string | null
        }
        Insert: {
          attribute_id: string
          benchmark_band?: Json
          created_at?: string
          drill_id: string
          id?: string
          raw_value: number
          score?: number | null
          submission_id: string
          unit?: string | null
        }
        Update: {
          attribute_id?: string
          benchmark_band?: Json
          created_at?: string
          drill_id?: string
          id?: string
          raw_value?: number
          score?: number | null
          submission_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fprds_beta_drill_results_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "fprds_beta_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      fprds_beta_submissions: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"]
          assessment_session_id: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          attribute_scores: Json
          benchmark_version: string
          club_id: string | null
          coach_confidence: number | null
          coach_notes: string | null
          consent_version: string
          consented_at: string
          created_at: string
          exclusion_reason: string | null
          id: string
          ovr: number | null
          player_age_at_assessment: number | null
          player_anonymous_id: string
          raw_results: Json
          review_status: Database["public"]["Enums"]["fprds_beta_review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          role: Database["public"]["Enums"]["fprds_role"]
          scoring_algorithm_version: string
          source_assessment_ref: string
          submitted_at: string
          submitted_by: string | null
          updated_at: string
          venue_context: Json
          weighting_version: string
          withdrawn_at: string | null
        }
        Insert: {
          age_group: Database["public"]["Enums"]["age_group"]
          assessment_session_id?: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          attribute_scores?: Json
          benchmark_version: string
          club_id?: string | null
          coach_confidence?: number | null
          coach_notes?: string | null
          consent_version: string
          consented_at: string
          created_at?: string
          exclusion_reason?: string | null
          id?: string
          ovr?: number | null
          player_age_at_assessment?: number | null
          player_anonymous_id: string
          raw_results?: Json
          review_status?: Database["public"]["Enums"]["fprds_beta_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          role: Database["public"]["Enums"]["fprds_role"]
          scoring_algorithm_version: string
          source_assessment_ref: string
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
          venue_context?: Json
          weighting_version: string
          withdrawn_at?: string | null
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"]
          assessment_session_id?: string | null
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          attribute_scores?: Json
          benchmark_version?: string
          club_id?: string | null
          coach_confidence?: number | null
          coach_notes?: string | null
          consent_version?: string
          consented_at?: string
          created_at?: string
          exclusion_reason?: string | null
          id?: string
          ovr?: number | null
          player_age_at_assessment?: number | null
          player_anonymous_id?: string
          raw_results?: Json
          review_status?: Database["public"]["Enums"]["fprds_beta_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          role?: Database["public"]["Enums"]["fprds_role"]
          scoring_algorithm_version?: string
          source_assessment_ref?: string
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
          venue_context?: Json
          weighting_version?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fprds_beta_submissions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      free_kick_scores: {
        Row: {
          created_at: string
          difficulty: string
          id: number
          mode: string
          name: string
          score: number
        }
        Insert: {
          created_at?: string
          difficulty: string
          id?: never
          mode: string
          name: string
          score: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: never
          mode?: string
          name?: string
          score?: number
        }
        Relationships: []
      }
      games: {
        Row: {
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          event_date: string
          event_time: string
          id: string
          location: string
          notes: string | null
          opponent: string
          opponent_score: number | null
          origin_device_id: string | null
          our_score: number | null
          status: Database["public"]["Enums"]["game_status"]
          type: Database["public"]["Enums"]["game_type"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_date: string
          event_time?: string
          id: string
          location?: string
          notes?: string | null
          opponent: string
          opponent_score?: number | null
          origin_device_id?: string | null
          our_score?: number | null
          status: Database["public"]["Enums"]["game_status"]
          type: Database["public"]["Enums"]["game_type"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_date?: string
          event_time?: string
          id?: string
          location?: string
          notes?: string | null
          opponent?: string
          opponent_score?: number | null
          origin_device_id?: string | null
          our_score?: number | null
          status?: Database["public"]["Enums"]["game_status"]
          type?: Database["public"]["Enums"]["game_type"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "games_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      league_access_requests: {
        Row: {
          admin_notes: string | null
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          league_name: string | null
          location: string | null
          message: string | null
          organization: string | null
          provisioned_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["league_access_request_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          league_name?: string | null
          location?: string | null
          message?: string | null
          organization?: string | null
          provisioned_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["league_access_request_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          league_name?: string | null
          location?: string | null
          message?: string | null
          organization?: string | null
          provisioned_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["league_access_request_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      league_seasons: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          league_id: string
          name: string
          notes: string | null
          registration_closes_on: string | null
          registration_opens_on: string | null
          roster_deadline: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["league_season_status"]
          transfer_window_closes_on: string | null
          transfer_window_opens_on: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          league_id: string
          name: string
          notes?: string | null
          registration_closes_on?: string | null
          registration_opens_on?: string | null
          roster_deadline?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["league_season_status"]
          transfer_window_closes_on?: string | null
          transfer_window_opens_on?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          league_id?: string
          name?: string
          notes?: string | null
          registration_closes_on?: string | null
          registration_opens_on?: string | null
          roster_deadline?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["league_season_status"]
          transfer_window_closes_on?: string | null
          transfer_window_opens_on?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "league_seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_venues: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          id: string
          league_id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          league_id: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          league_id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_venues_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          logo_color: string
          name: string
          owner_user_id: string
          short_name: string | null
          state: string
          timezone: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_color?: string
          name: string
          owner_user_id: string
          short_name?: string | null
          state?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_color?: string
          name?: string
          owner_user_id?: string
          short_name?: string | null
          state?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          applied_at: string | null
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          game_id: string
          id: string
          notes: string | null
          opponent_score: number
          origin_device_id: string | null
          our_score: number
          reversed_at: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          applied_at?: string | null
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          game_id: string
          id: string
          notes?: string | null
          opponent_score: number
          origin_device_id?: string | null
          our_score: number
          reversed_at?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          applied_at?: string | null
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          game_id?: string
          id?: string
          notes?: string | null
          opponent_score?: number
          origin_device_id?: string | null
          our_score?: number
          reversed_at?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scorer_contributions: {
        Row: {
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          goal_count: number
          id: string
          match_result_id: string
          origin_device_id: string | null
          player_id: string | null
          player_name_snapshot: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          goal_count: number
          id: string
          match_result_id: string
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          goal_count?: number
          id?: string
          match_result_id?: string
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_scorer_contributions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scorer_contributions_match_result_id_fkey"
            columns: ["match_result_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scorer_contributions_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scorer_contributions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_awards: {
        Row: {
          award_date: string
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          game_id: string | null
          id: string
          note: string | null
          opponent: string | null
          origin_device_id: string | null
          player_id: string | null
          player_name_snapshot: string
          source: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          award_date: string
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          game_id?: string | null
          id: string
          note?: string | null
          opponent?: string | null
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot: string
          source?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          award_date?: string
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          game_id?: string | null
          id?: string
          note?: string | null
          opponent?: string | null
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot?: string
          source?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "mvp_awards_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvp_awards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvp_awards_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvp_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_ledger_entries: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["payment_category"]
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          due_date: string | null
          entry_date: string
          entry_type: Database["public"]["Enums"]["payment_entry_type"]
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          note: string | null
          origin_device_id: string | null
          player_id: string | null
          player_name_snapshot: string
          reference: string | null
          updated_at: string
          updated_by: string | null
          version: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["payment_category"]
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          entry_date: string
          entry_type: Database["public"]["Enums"]["payment_entry_type"]
          id: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          note?: string | null
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot: string
          reference?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["payment_category"]
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          entry_date?: string
          entry_type?: Database["public"]["Enums"]["payment_entry_type"]
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          note?: string | null
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot?: string
          reference?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_ledger_entries_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_ledger_entries_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_ledger_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_availability: {
        Row: {
          availability_date: string | null
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          event_id: string
          id: string
          origin_device_id: string | null
          player_id: string | null
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          availability_date?: string | null
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_id: string
          id: string
          origin_device_id?: string | null
          player_id?: string | null
          status: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          availability_date?: string | null
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_id?: string
          id?: string
          origin_device_id?: string | null
          player_id?: string | null
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_availability_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_availability_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_club_links: {
        Row: {
          club_id: string
          created_at: string
          id: string
          linked_at: string
          linked_by: string | null
          player_id: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          linked_at?: string
          linked_by?: string | null
          player_id: string
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          linked_at?: string
          linked_by?: string | null
          player_id?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_club_links_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_club_links_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_drill_completions: {
        Row: {
          completed_at: string
          created_at: string
          drill_id: string
          duration_seconds: number | null
          id: string
          notes: string | null
          perceived_exertion: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          drill_id: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          perceived_exertion?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          drill_id?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          perceived_exertion?: number | null
          user_id?: string
        }
        Relationships: []
      }
      player_drill_favorites: {
        Row: {
          created_at: string
          drill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          drill_id?: string
          user_id?: string
        }
        Relationships: []
      }
      player_link_requests: {
        Row: {
          claimed_name: string
          claimed_roster_number: number | null
          club_id: string
          created_at: string
          id: string
          message: string | null
          requester_user_id: string
          resulting_link_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["player_link_request_status"]
          target_player_id: string | null
          updated_at: string
        }
        Insert: {
          claimed_name: string
          claimed_roster_number?: number | null
          club_id: string
          created_at?: string
          id?: string
          message?: string | null
          requester_user_id: string
          resulting_link_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["player_link_request_status"]
          target_player_id?: string | null
          updated_at?: string
        }
        Update: {
          claimed_name?: string
          claimed_roster_number?: number | null
          club_id?: string
          created_at?: string
          id?: string
          message?: string | null
          requester_user_id?: string
          resulting_link_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["player_link_request_status"]
          target_player_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_link_requests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_link_requests_target_player_id_fkey"
            columns: ["target_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          related: Json
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          related?: Json
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related?: Json
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_offenses: {
        Row: {
          card_type: string
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          game_id: string | null
          game_opponent: string | null
          id: string
          match_minute: number | null
          offense_date: string
          origin_device_id: string | null
          player_id: string
          reason: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          card_type: string
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          game_id?: string | null
          game_opponent?: string | null
          id: string
          match_minute?: number | null
          offense_date: string
          origin_device_id?: string | null
          player_id: string
          reason: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          card_type?: string
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          game_id?: string | null
          game_opponent?: string | null
          id?: string
          match_minute?: number | null
          offense_date?: string
          origin_device_id?: string | null
          player_id?: string
          reason?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_offenses_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_offenses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_offenses_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_offenses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          guardian_consent_at: string | null
          guardian_consent_state: Database["public"]["Enums"]["guardian_consent_state"]
          guardian_email: string | null
          guardian_name: string | null
          guardian_relationship: string | null
          height: number | null
          position: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          guardian_consent_at?: string | null
          guardian_consent_state?: Database["public"]["Enums"]["guardian_consent_state"]
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          height?: number | null
          position?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          guardian_consent_at?: string | null
          guardian_consent_state?: Database["public"]["Enums"]["guardian_consent_state"]
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          height?: number | null
          position?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      player_workout_sessions: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          kind: string
          label: string | null
          notes: string | null
          rounds: Json
          total_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          kind: string
          label?: string | null
          notes?: string | null
          rounds?: Json
          total_seconds?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          notes?: string | null
          rounds?: Json
          total_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          age_snapshot: number | null
          assists: number
          base_attributes: Json
          bio: string
          clean_sheets: number
          client_created_at: string | null
          club_id: string
          coach_notes: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          fprds_age_group_preference:
            | Database["public"]["Enums"]["age_group"]
            | null
          fprds_last_assessment_id: string | null
          fprds_role: Database["public"]["Enums"]["fprds_role"] | null
          games_played: number
          goals: number
          height: number | null
          id: string
          minutes_played: number
          mvp_awards: number
          name: string
          origin_device_id: string | null
          photo_url: string
          position: string
          position_attributes: Json
          red_cards: number
          registration_status: Database["public"]["Enums"]["player_registration_status"]
          roster_number: number
          specialty_traits: Json
          updated_at: string
          updated_by: string | null
          version: number
          weight: number | null
          yellow_cards: number
        }
        Insert: {
          age_snapshot?: number | null
          assists?: number
          base_attributes?: Json
          bio?: string
          clean_sheets?: number
          client_created_at?: string | null
          club_id: string
          coach_notes?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          fprds_age_group_preference?:
            | Database["public"]["Enums"]["age_group"]
            | null
          fprds_last_assessment_id?: string | null
          fprds_role?: Database["public"]["Enums"]["fprds_role"] | null
          games_played?: number
          goals?: number
          height?: number | null
          id: string
          minutes_played?: number
          mvp_awards?: number
          name: string
          origin_device_id?: string | null
          photo_url?: string
          position: string
          position_attributes?: Json
          red_cards?: number
          registration_status?: Database["public"]["Enums"]["player_registration_status"]
          roster_number: number
          specialty_traits?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight?: number | null
          yellow_cards?: number
        }
        Update: {
          age_snapshot?: number | null
          assists?: number
          base_attributes?: Json
          bio?: string
          clean_sheets?: number
          client_created_at?: string | null
          club_id?: string
          coach_notes?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          fprds_age_group_preference?:
            | Database["public"]["Enums"]["age_group"]
            | null
          fprds_last_assessment_id?: string | null
          fprds_role?: Database["public"]["Enums"]["fprds_role"] | null
          games_played?: number
          goals?: number
          height?: number | null
          id?: string
          minutes_played?: number
          mvp_awards?: number
          name?: string
          origin_device_id?: string | null
          photo_url?: string
          position?: string
          position_attributes?: Json
          red_cards?: number
          registration_status?: Database["public"]["Enums"]["player_registration_status"]
          roster_number?: number
          specialty_traits?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight?: number | null
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          headline: string | null
          id: string
          is_active: boolean
          name: string
          plan_code: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value: number
          ends_at?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          name: string
          plan_code?: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          name?: string
          plan_code?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          bio: string
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          origin_device_id: string | null
          phone: string | null
          photo_url: string
          role: string
          since: string | null
          status: Database["public"]["Enums"]["staff_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          bio?: string
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id: string
          name: string
          origin_device_id?: string | null
          phone?: string | null
          photo_url?: string
          role: string
          since?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          bio?: string
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          origin_device_id?: string | null
          phone?: string | null
          photo_url?: string
          role?: string
          since?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      standings_rows: {
        Row: {
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          drawn: number
          goals_against: number
          goals_for: number
          id: string
          is_user_team: boolean
          lost: number
          origin_device_id: string | null
          played: number
          points: number
          rank: number
          team_name: string
          updated_at: string
          updated_by: string | null
          version: number
          won: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          drawn: number
          goals_against: number
          goals_for: number
          id: string
          is_user_team?: boolean
          lost: number
          origin_device_id?: string | null
          played: number
          points: number
          rank: number
          team_name: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          won: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          drawn?: number
          goals_against?: number
          goals_for?: number
          id?: string
          is_user_team?: boolean
          lost?: number
          origin_device_id?: string | null
          played?: number
          points?: number
          rank?: number
          team_name?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_rows_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_rows_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      standings_snapshots: {
        Row: {
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          label: string
          origin_device_id: string | null
          snapshot_rows: Json
          source: Database["public"]["Enums"]["standings_snapshot_source"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          label: string
          origin_device_id?: string | null
          snapshot_rows?: Json
          source: Database["public"]["Enums"]["standings_snapshot_source"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          label?: string
          origin_device_id?: string | null
          snapshot_rows?: Json
          source?: Database["public"]["Enums"]["standings_snapshot_source"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_snapshots_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_snapshots_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_customer_id: string | null
          canceled_at: string | null
          club_id: string | null
          created_at: string
          current_period_ends_at: string | null
          current_period_starts_at: string | null
          id: string
          metadata: Json
          plan_code: string
          provider: Database["public"]["Enums"]["billing_provider"]
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_customer_id?: string | null
          canceled_at?: string | null
          club_id?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          current_period_starts_at?: string | null
          id?: string
          metadata?: Json
          plan_code: string
          provider: Database["public"]["Enums"]["billing_provider"]
          provider_subscription_id?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_customer_id?: string | null
          canceled_at?: string | null
          club_id?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          current_period_starts_at?: string | null
          id?: string
          metadata?: Json
          plan_code?: string
          provider?: Database["public"]["Enums"]["billing_provider"]
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_billing_customer_id_fkey"
            columns: ["billing_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_changes: {
        Row: {
          changed_at: string
          changed_by: string | null
          club_id: string
          entity_id: string
          entity_table: string
          operation: Database["public"]["Enums"]["sync_change_operation"]
          origin_device_id: string | null
          record_version: number
          sequence_id: number
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          club_id: string
          entity_id: string
          entity_table: string
          operation: Database["public"]["Enums"]["sync_change_operation"]
          origin_device_id?: string | null
          record_version: number
          sequence_id?: number
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          club_id?: string
          entity_id?: string
          entity_table?: string
          operation?: Database["public"]["Enums"]["sync_change_operation"]
          origin_device_id?: string | null
          record_version?: number
          sequence_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sync_changes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_changes_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_mutations: {
        Row: {
          applied_at: string | null
          base_version: number | null
          club_id: string
          created_at: string
          device_id: string
          entity_id: string | null
          entity_table: string
          error_code: string | null
          id: string
          idempotency_key: string
          operation: Database["public"]["Enums"]["sync_mutation_operation"]
          result_version: number | null
          status: Database["public"]["Enums"]["sync_mutation_status"]
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          base_version?: number | null
          club_id: string
          created_at?: string
          device_id: string
          entity_id?: string | null
          entity_table: string
          error_code?: string | null
          id?: string
          idempotency_key: string
          operation: Database["public"]["Enums"]["sync_mutation_operation"]
          result_version?: number | null
          status: Database["public"]["Enums"]["sync_mutation_status"]
          user_id: string
        }
        Update: {
          applied_at?: string | null
          base_version?: number | null
          club_id?: string
          created_at?: string
          device_id?: string
          entity_id?: string | null
          entity_table?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string
          operation?: Database["public"]["Enums"]["sync_mutation_operation"]
          result_version?: number | null
          status?: Database["public"]["Enums"]["sync_mutation_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_mutations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_mutations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      tactics_draw_paths: {
        Row: {
          client_created_at: string | null
          club_id: string
          color: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          path_order: number
          points: Json
          tactics_workspace_id: string
          updated_at: string
          updated_by: string | null
          version: number
          width: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          color: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          origin_device_id?: string | null
          path_order: number
          points?: Json
          tactics_workspace_id: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          width: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          color?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          origin_device_id?: string | null
          path_order?: number
          points?: Json
          tactics_workspace_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "tactics_draw_paths_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_draw_paths_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_draw_paths_tactics_workspace_id_fkey"
            columns: ["tactics_workspace_id"]
            isOneToOne: false
            referencedRelation: "tactics_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tactics_lineup_assignments: {
        Row: {
          client_created_at: string | null
          club_id: string
          condition_snapshot: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          player_id: string | null
          player_name_snapshot: string
          position_snapshot: string
          rating_snapshot: number
          slot_id: string
          tactics_workspace_id: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          condition_snapshot: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot: string
          position_snapshot: string
          rating_snapshot: number
          slot_id: string
          tactics_workspace_id: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          condition_snapshot?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          origin_device_id?: string | null
          player_id?: string | null
          player_name_snapshot?: string
          position_snapshot?: string
          rating_snapshot?: number
          slot_id?: string
          tactics_workspace_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tactics_lineup_assignments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_lineup_assignments_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_lineup_assignments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_lineup_assignments_tactics_workspace_id_fkey"
            columns: ["tactics_workspace_id"]
            isOneToOne: false
            referencedRelation: "tactics_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tactics_notes: {
        Row: {
          category: string
          client_created_at: string | null
          club_id: string
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          category: string
          client_created_at?: string | null
          club_id: string
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          origin_device_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          category?: string
          client_created_at?: string | null
          club_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          origin_device_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tactics_notes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_notes_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      tactics_player_extras: {
        Row: {
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          player_id: string | null
          red_cards: number
          status: Database["public"]["Enums"]["tactics_player_status"]
          updated_at: string
          updated_by: string | null
          version: number
          yellow_cards: number
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          origin_device_id?: string | null
          player_id?: string | null
          red_cards?: number
          status: Database["public"]["Enums"]["tactics_player_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          yellow_cards?: number
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          origin_device_id?: string | null
          player_id?: string | null
          red_cards?: number
          status?: Database["public"]["Enums"]["tactics_player_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "tactics_player_extras_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_player_extras_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_player_extras_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      tactics_workspaces: {
        Row: {
          captain_player_id: string | null
          client_created_at: string | null
          club_id: string
          coach_level: string | null
          corner_taker_player_id: string | null
          created_at: string
          created_by: string | null
          custom_defensive_value: string | null
          custom_mentality_value: string | null
          custom_playstyle_value: string | null
          custom_playstyles: Json
          custom_strategy_notes: string | null
          defensive_style: string | null
          deleted_at: string | null
          formation: string
          free_kick_taker_player_id: string | null
          id: string
          is_custom_strategy: boolean
          match_format: string
          origin_device_id: string | null
          penalty_taker_player_id: string | null
          playstyle: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          captain_player_id?: string | null
          client_created_at?: string | null
          club_id: string
          coach_level?: string | null
          corner_taker_player_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_defensive_value?: string | null
          custom_mentality_value?: string | null
          custom_playstyle_value?: string | null
          custom_playstyles?: Json
          custom_strategy_notes?: string | null
          defensive_style?: string | null
          deleted_at?: string | null
          formation: string
          free_kick_taker_player_id?: string | null
          id: string
          is_custom_strategy?: boolean
          match_format: string
          origin_device_id?: string | null
          penalty_taker_player_id?: string | null
          playstyle: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          captain_player_id?: string | null
          client_created_at?: string | null
          club_id?: string
          coach_level?: string | null
          corner_taker_player_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_defensive_value?: string | null
          custom_mentality_value?: string | null
          custom_playstyle_value?: string | null
          custom_playstyles?: Json
          custom_strategy_notes?: string | null
          defensive_style?: string | null
          deleted_at?: string | null
          formation?: string
          free_kick_taker_player_id?: string | null
          id?: string
          is_custom_strategy?: boolean
          match_format?: string
          origin_device_id?: string | null
          penalty_taker_player_id?: string | null
          playstyle?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tactics_workspaces_captain_player_id_fkey"
            columns: ["captain_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_workspaces_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_workspaces_corner_taker_player_id_fkey"
            columns: ["corner_taker_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_workspaces_free_kick_taker_player_id_fkey"
            columns: ["free_kick_taker_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_workspaces_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactics_workspaces_penalty_taker_player_id_fkey"
            columns: ["penalty_taker_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_channels: {
        Row: {
          club_id: string
          created_at: string
          id: string
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_channels_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_messages: {
        Row: {
          author_name: string
          author_role: string
          author_user_id: string | null
          body: string
          channel_id: string
          club_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
        }
        Insert: {
          author_name: string
          author_role: string
          author_user_id?: string | null
          body: string
          channel_id: string
          club_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
        }
        Update: {
          author_name?: string
          author_role?: string
          author_user_id?: string | null
          body?: string
          channel_id?: string
          club_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_chat_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_reads: {
        Row: {
          channel_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_reads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_reports: {
        Row: {
          club_id: string
          created_at: string
          id: string
          message_id: string
          reason: string | null
          reporter_user_id: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          message_id: string
          reason?: string | null
          reporter_user_id?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          message_id?: string
          reason?: string | null
          reporter_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_chat_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "team_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          created_at: string
          entitlement: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entitlement: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entitlement?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_moderation: {
        Row: {
          admin_notes: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          created_at: string
          mute_reason: string | null
          muted_by: string | null
          muted_until: string | null
          plan_code: string
          plan_expires_at: string | null
          plan_note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          mute_reason?: string | null
          muted_by?: string | null
          muted_until?: string | null
          plan_code?: string
          plan_expires_at?: string | null
          plan_note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          mute_reason?: string | null
          muted_by?: string | null
          muted_until?: string | null
          plan_code?: string
          plan_expires_at?: string | null
          plan_note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          accepted_privacy_version: string | null
          accepted_terms_version: string | null
          account_state: Database["public"]["Enums"]["account_state"]
          created_at: string
          deleted_at: string | null
          display_name: string | null
          locale: string
          onboarding_status: string
          pending_deletion_at: string | null
          persona: Database["public"]["Enums"]["account_persona"]
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_privacy_version?: string | null
          accepted_terms_version?: string | null
          account_state?: Database["public"]["Enums"]["account_state"]
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          locale?: string
          onboarding_status?: string
          pending_deletion_at?: string | null
          persona?: Database["public"]["Enums"]["account_persona"]
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_privacy_version?: string | null
          accepted_terms_version?: string | null
          account_state?: Database["public"]["Enums"]["account_state"]
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          locale?: string
          onboarding_status?: string
          pending_deletion_at?: string | null
          persona?: Database["public"]["Enums"]["account_persona"]
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_training_schedules: {
        Row: {
          client_created_at: string | null
          club_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          schedule: Json
          updated_at: string
          updated_by: string | null
          version: number
          week_start_date: string | null
        }
        Insert: {
          client_created_at?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          origin_device_id?: string | null
          schedule?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
          week_start_date?: string | null
        }
        Update: {
          client_created_at?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          origin_device_id?: string | null
          schedule?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
          week_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_training_schedules_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_training_schedules_origin_device_id_fkey"
            columns: ["origin_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_imports: {
        Row: {
          club_id: string
          completed_at: string | null
          device_id: string | null
          failed_at: string | null
          failure_code: string | null
          id: string
          manifest_hash: string
          record_counts: Json
          source_backup_version: string
          started_at: string
          status: Database["public"]["Enums"]["workspace_import_status"]
          user_id: string
        }
        Insert: {
          club_id: string
          completed_at?: string | null
          device_id?: string | null
          failed_at?: string | null
          failure_code?: string | null
          id: string
          manifest_hash: string
          record_counts?: Json
          source_backup_version: string
          started_at?: string
          status?: Database["public"]["Enums"]["workspace_import_status"]
          user_id: string
        }
        Update: {
          club_id?: string
          completed_at?: string | null
          device_id?: string | null
          failed_at?: string | null
          failure_code?: string | null
          id?: string
          manifest_hash?: string
          record_counts?: Json
          source_backup_version?: string
          started_at?: string
          status?: Database["public"]["Enums"]["workspace_import_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_imports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_imports_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_club_invitation: {
        Args: { target_invitation_id: string }
        Returns: string
      }
      admin_grant_entitlement: {
        Args: {
          entitlement: string
          expires_at?: string
          notes?: string
          target_user_id: string
        }
        Returns: Json
      }
      admin_managed_user_payload_v1: {
        Args: { target_user_id: string }
        Returns: Json
      }
      admin_provision_league_owner: {
        Args: { request_id: string }
        Returns: Json
      }
      admin_review_league_access: {
        Args: {
          admin_notes?: string
          new_status: Database["public"]["Enums"]["league_access_request_status"]
          request_id: string
        }
        Returns: Json
      }
      admin_revoke_entitlement: {
        Args: { entitlement: string; target_user_id: string }
        Returns: Json
      }
      admin_set_user_persona: {
        Args: {
          new_persona: Database["public"]["Enums"]["account_persona"]
          target_user_id: string
        }
        Returns: Json
      }
      advance_season_status: {
        Args: {
          next_status: Database["public"]["Enums"]["league_season_status"]
          season_id: string
        }
        Returns: Database["public"]["Enums"]["league_season_status"]
      }
      apply_controlled_record_update: {
        Args: {
          expected_version: number
          patch: Json
          target_id: string
          target_table: string
        }
        Returns: Json
      }
      approve_player_link: {
        Args: { p_target_player_id: string; request_id: string }
        Returns: string
      }
      auth_email_lower: { Args: never; Returns: string }
      bootstrap_player_account: {
        Args: never
        Returns: Database["public"]["Enums"]["account_persona"]
      }
      can_access_team_chat: {
        Args: { target_club_id: string }
        Returns: boolean
      }
      delete_team_chat_message: {
        Args: { message_id: string }
        Returns: undefined
      }
      ensure_team_channel: { Args: { target_club_id: string }; Returns: string }
      get_activation_funnel_v1: { Args: { days?: number }; Returns: Json }
      get_admin_console_snapshot_v2: { Args: { days?: number }; Returns: Json }
      get_admin_growth_metrics_v1: { Args: { days?: number }; Returns: Json }
      get_admin_product_metrics_v1: { Args: { days?: number }; Returns: Json }
      get_admin_security_metrics_v1: { Args: { days?: number }; Returns: Json }
      get_admin_storage_metrics_v1: { Args: { days?: number }; Returns: Json }
      get_fprds_benchmark_analysis_v1: {
        Args: { min_sample?: number }
        Returns: Json
      }
      get_or_create_club_join_code: {
        Args: { target_club_id: string }
        Returns: string
      }
      insert_player_notification: {
        Args: {
          nbody: string
          nrelated?: Json
          ntitle: string
          ntype: string
          target_user: string
        }
        Returns: undefined
      }
      is_active_club_member: {
        Args: { target_club_id: string; target_user_id?: string }
        Returns: boolean
      }
      is_admin_mfa_verified: { Args: never; Returns: boolean }
      is_app_admin: { Args: { target_user_id?: string }; Returns: boolean }
      is_app_admin_role: {
        Args: {
          required_roles: Database["public"]["Enums"]["app_admin_role"][]
        }
        Returns: boolean
      }
      is_entitled: {
        Args: { entitlement: string; target_user_id?: string }
        Returns: boolean
      }
      is_fprds_benchmark_reviewer: { Args: never; Returns: boolean }
      is_league_owner: { Args: { target_user_id?: string }; Returns: boolean }
      is_linked_player: {
        Args: { target_club_id: string; target_user_id?: string }
        Returns: boolean
      }
      is_team_chat_member: {
        Args: { target_club_id: string }
        Returns: boolean
      }
      is_user_banned: { Args: { target_user_id?: string }; Returns: boolean }
      is_user_muted: { Args: { target_user_id?: string }; Returns: boolean }
      list_admin_managed_users_v1: {
        Args: { limit_count?: number; search?: string }
        Returns: Json
      }
      list_admin_recoverable_workspaces_v1: {
        Args: { days?: number }
        Returns: Json
      }
      list_league_access_requests_v1: {
        Args: {
          status_filter?: Database["public"]["Enums"]["league_access_request_status"]
        }
        Returns: {
          admin_notes: string | null
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          league_name: string | null
          location: string | null
          message: string | null
          organization: string | null
          provisioned_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["league_access_request_status"]
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "league_access_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_team_chat_read: {
        Args: { p_channel_id: string }
        Returns: undefined
      }
      owns_league: {
        Args: { target_league_id: string; target_user_id?: string }
        Returns: boolean
      }
      player_is_minor: { Args: { target_user_id?: string }; Returns: boolean }
      post_team_chat_message: {
        Args: { body: string; target_club_id: string }
        Returns: {
          author_name: string
          author_role: string
          author_user_id: string | null
          body: string
          channel_id: string
          club_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
        }
        SetofOptions: {
          from: "*"
          to: "team_chat_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_admin_audit: {
        Args: {
          event_type: string
          metadata?: Json
          target_id?: string
          target_table?: string
        }
        Returns: string
      }
      reject_player_link: {
        Args: { reason?: string; request_id: string }
        Returns: undefined
      }
      remove_bulletin_controlled: {
        Args: { expected_version: number; target_bulletin_id: string }
        Returns: {
          author_snapshot: string
          bulletin_date: string
          category: Database["public"]["Enums"]["bulletin_category"]
          client_created_at: string | null
          club_id: string
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "bulletins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      report_team_chat_message: {
        Args: { message_id: string; reason?: string }
        Returns: string
      }
      request_league_access: {
        Args: {
          contact_email: string
          contact_name: string
          league_name?: string
          location?: string
          message?: string
          organization?: string
        }
        Returns: string
      }
      request_player_link: {
        Args: {
          claimed_name: string
          claimed_roster_number?: number
          join_code: string
          message?: string
        }
        Returns: string
      }
      require_owner_admin_mfa: {
        Args: { target_rpc: string; target_table: string }
        Returns: Database["public"]["Enums"]["app_admin_role"]
      }
      resolve_app_destination: { Args: never; Returns: Json }
      restore_admin_workspace_v1: {
        Args: { target_club_id: string }
        Returns: Json
      }
      revoke_admin_user_devices_v1: {
        Args: { target_user_id: string }
        Returns: Json
      }
      set_admin_user_ban_v1: {
        Args: { banned: boolean; reason?: string; target_user_id: string }
        Returns: Json
      }
      set_admin_user_mute_v1: {
        Args: { muted_until?: string; reason?: string; target_user_id: string }
        Returns: Json
      }
      set_admin_user_notes_v1: {
        Args: { notes?: string; target_user_id: string }
        Returns: Json
      }
      set_admin_user_plan_v1: {
        Args: {
          expires_at?: string
          note?: string
          plan_code: string
          target_user_id: string
        }
        Returns: Json
      }
      set_guardian_consent: {
        Args: {
          p_guardian_email: string
          p_guardian_name: string
          p_guardian_relationship: string
        }
        Returns: Database["public"]["Enums"]["guardian_consent_state"]
      }
      update_bulletin_controlled: {
        Args: {
          expected_version: number
          new_author_snapshot: string
          new_bulletin_date: string
          new_category: Database["public"]["Enums"]["bulletin_category"]
          new_content: string
          new_title: string
          target_bulletin_id: string
        }
        Returns: {
          author_snapshot: string
          bulletin_date: string
          category: Database["public"]["Enums"]["bulletin_category"]
          client_created_at: string | null
          club_id: string
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          origin_device_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "bulletins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_can_manage_club_table: {
        Args: {
          target_club_id: string
          target_table: string
          target_user_id?: string
        }
        Returns: boolean
      }
      user_has_club_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["membership_role"][]
          target_club_id: string
          target_user_id?: string
        }
        Returns: boolean
      }
      user_owns_club: {
        Args: { target_club_id: string; target_user_id?: string }
        Returns: boolean
      }
      withdraw_player_link_request: {
        Args: { request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_persona: "coach" | "player" | "league"
      account_state: "active" | "disabled" | "pending_deletion" | "deleted"
      age_group: "u12" | "u15" | "u18" | "adult"
      app_admin_role: "owner" | "support" | "fprds_reviewer" | "billing"
      assessment_type: "full" | "quick"
      audit_event_type:
        | "account_created"
        | "sign_in"
        | "club_created"
        | "migration_started"
        | "migration_completed"
        | "migration_failed"
        | "export_requested"
        | "export_completed"
        | "deletion_requested"
        | "deletion_cancelled"
        | "deletion_completed"
        | "device_revoked"
        | "invitation_created"
        | "invitation_accepted"
        | "invitation_revoked"
        | "membership_role_changed"
        | "membership_removed"
        | "membership_suspended"
        | "bulletin_created"
        | "bulletin_updated"
        | "bulletin_removed"
        | "bulletin_edit_conflict"
        | "record_updated"
        | "record_removed"
        | "record_edit_conflict"
        | "authorization_denied"
      availability_status: "yes" | "no" | "maybe"
      billing_provider: "stripe" | "paypal" | "manual" | "other"
      bulletin_category: "urgent" | "matchday" | "training" | "social"
      club_invitation_status: "pending" | "accepted" | "revoked" | "expired"
      club_state: "active" | "suspended" | "pending_deletion" | "deleted"
      feedback_category:
        | "improvement"
        | "suggestion"
        | "bug"
        | "usability_issue"
        | "feature_request"
        | "other"
      feedback_status:
        | "new"
        | "triaged"
        | "planned"
        | "in_progress"
        | "resolved"
        | "closed"
      feedback_urgency: "low" | "normal" | "high" | "blocking"
      fprds_benchmark_correction_status:
        | "proposed"
        | "accepted"
        | "rejected"
        | "deferred"
      fprds_benchmark_review_decision:
        | "accept"
        | "change_requested"
        | "inconclusive"
      fprds_beta_review_status:
        | "pending"
        | "accepted"
        | "excluded"
        | "needs_followup"
      fprds_role: "st" | "w" | "cm" | "cdm" | "fb" | "cb" | "gk"
      game_status: "upcoming" | "completed" | "cancelled"
      game_type: "league" | "cup" | "friendly" | "training" | "meeting"
      guardian_consent_state: "not_required" | "pending" | "granted" | "revoked"
      league_access_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "provisioned"
        | "withdrawn"
      league_season_status:
        | "draft"
        | "registration_open"
        | "active"
        | "completed"
        | "archived"
      membership_role: "owner" | "admin" | "coach" | "staff" | "viewer"
      membership_state: "active" | "invited" | "suspended" | "removed"
      payment_category:
        | "registration"
        | "monthly_fee"
        | "coach_fee"
        | "kit"
        | "tournament"
        | "training"
        | "other"
      payment_entry_type:
        | "charge"
        | "payment"
        | "waiver"
        | "refund"
        | "adjustment"
      payment_method: "cash" | "gcash" | "bank_transfer" | "card" | "other"
      player_link_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "withdrawn"
      player_registration_status: "active" | "pending" | "suspended"
      staff_status: "active" | "inactive"
      standings_snapshot_source: "manual" | "sunday"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "canceled"
        | "incomplete"
      sync_change_operation: "insert" | "update" | "delete"
      sync_mutation_operation: "insert" | "update" | "delete" | "function"
      sync_mutation_status: "applied" | "rejected" | "conflict" | "duplicate"
      tactics_player_status: "starting" | "substitute" | "injured"
      workspace_import_status:
        | "started"
        | "completed"
        | "failed"
        | "rolled_back"
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
      account_persona: ["coach", "player", "league"],
      account_state: ["active", "disabled", "pending_deletion", "deleted"],
      age_group: ["u12", "u15", "u18", "adult"],
      app_admin_role: ["owner", "support", "fprds_reviewer", "billing"],
      assessment_type: ["full", "quick"],
      audit_event_type: [
        "account_created",
        "sign_in",
        "club_created",
        "migration_started",
        "migration_completed",
        "migration_failed",
        "export_requested",
        "export_completed",
        "deletion_requested",
        "deletion_cancelled",
        "deletion_completed",
        "device_revoked",
        "invitation_created",
        "invitation_accepted",
        "invitation_revoked",
        "membership_role_changed",
        "membership_removed",
        "membership_suspended",
        "bulletin_created",
        "bulletin_updated",
        "bulletin_removed",
        "bulletin_edit_conflict",
        "record_updated",
        "record_removed",
        "record_edit_conflict",
        "authorization_denied",
      ],
      availability_status: ["yes", "no", "maybe"],
      billing_provider: ["stripe", "paypal", "manual", "other"],
      bulletin_category: ["urgent", "matchday", "training", "social"],
      club_invitation_status: ["pending", "accepted", "revoked", "expired"],
      club_state: ["active", "suspended", "pending_deletion", "deleted"],
      feedback_category: [
        "improvement",
        "suggestion",
        "bug",
        "usability_issue",
        "feature_request",
        "other",
      ],
      feedback_status: [
        "new",
        "triaged",
        "planned",
        "in_progress",
        "resolved",
        "closed",
      ],
      feedback_urgency: ["low", "normal", "high", "blocking"],
      fprds_benchmark_correction_status: [
        "proposed",
        "accepted",
        "rejected",
        "deferred",
      ],
      fprds_benchmark_review_decision: [
        "accept",
        "change_requested",
        "inconclusive",
      ],
      fprds_beta_review_status: [
        "pending",
        "accepted",
        "excluded",
        "needs_followup",
      ],
      fprds_role: ["st", "w", "cm", "cdm", "fb", "cb", "gk"],
      game_status: ["upcoming", "completed", "cancelled"],
      game_type: ["league", "cup", "friendly", "training", "meeting"],
      guardian_consent_state: ["not_required", "pending", "granted", "revoked"],
      league_access_request_status: [
        "pending",
        "approved",
        "rejected",
        "provisioned",
        "withdrawn",
      ],
      league_season_status: [
        "draft",
        "registration_open",
        "active",
        "completed",
        "archived",
      ],
      membership_role: ["owner", "admin", "coach", "staff", "viewer"],
      membership_state: ["active", "invited", "suspended", "removed"],
      payment_category: [
        "registration",
        "monthly_fee",
        "coach_fee",
        "kit",
        "tournament",
        "training",
        "other",
      ],
      payment_entry_type: [
        "charge",
        "payment",
        "waiver",
        "refund",
        "adjustment",
      ],
      payment_method: ["cash", "gcash", "bank_transfer", "card", "other"],
      player_link_request_status: [
        "pending",
        "approved",
        "rejected",
        "withdrawn",
      ],
      player_registration_status: ["active", "pending", "suspended"],
      staff_status: ["active", "inactive"],
      standings_snapshot_source: ["manual", "sunday"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "paused",
        "canceled",
        "incomplete",
      ],
      sync_change_operation: ["insert", "update", "delete"],
      sync_mutation_operation: ["insert", "update", "delete", "function"],
      sync_mutation_status: ["applied", "rejected", "conflict", "duplicate"],
      tactics_player_status: ["starting", "substitute", "injured"],
      workspace_import_status: [
        "started",
        "completed",
        "failed",
        "rolled_back",
      ],
    },
  },
} as const

