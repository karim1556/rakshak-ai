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
      incidents: {
        Row: {
          id: string
          type: 'medical' | 'fire' | 'safety' | 'accident' | 'other'
          summary: string
          description: string
          victims: number
          risks: string[]
          steps: string[]
          tactical_advice: string
          severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
          status: 'active' | 'assigned' | 'en_route' | 'on_scene' | 'resolved'
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
          reported_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'medical' | 'fire' | 'safety' | 'accident' | 'other'
          summary: string
          description: string
          victims?: number
          risks?: string[]
          steps?: string[]
          tactical_advice?: string
          severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
          status?: 'active' | 'assigned' | 'en_route' | 'on_scene' | 'resolved'
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          reported_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'medical' | 'fire' | 'safety' | 'accident' | 'other'
          summary?: string
          description?: string
          victims?: number
          risks?: string[]
          steps?: string[]
          tactical_advice?: string
          severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
          status?: 'active' | 'assigned' | 'en_route' | 'on_scene' | 'resolved'
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          reported_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      responders: {
        Row: {
          id: string
          name: string
          role: 'medical' | 'police' | 'fire' | 'rescue'
          unit_id: string
          status: 'available' | 'busy' | 'offline'
          current_incident_id: string | null
          location_lat: number | null
          location_lng: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: 'medical' | 'police' | 'fire' | 'rescue'
          unit_id: string
          status?: 'available' | 'busy' | 'offline'
          current_incident_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          role?: 'medical' | 'police' | 'fire' | 'rescue'
          unit_id?: string
          status?: 'available' | 'busy' | 'offline'
          current_incident_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      incident_assignments: {
        Row: {
          id: string
          incident_id: string
          responder_id: string
          assigned_at: string
          status: 'assigned' | 'en_route' | 'on_scene' | 'completed'
        }
        Insert: {
          id?: string
          incident_id: string
          responder_id: string
          assigned_at?: string
          status?: 'assigned' | 'en_route' | 'on_scene' | 'completed'
        }
        Update: {
          status?: 'assigned' | 'en_route' | 'on_scene' | 'completed'
        }
        Relationships: []
      }
      escalated_sessions: {
        Row: {
          id: string
          type: string
          severity: string
          summary: string
          status: 'escalated' | 'assigned' | 'connected' | 'resolved'
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
          messages: Json
          steps: Json
          assigned_responder: Json | null
          priority: number
          language: string
          image_snapshot: string | null
          escalated_at: string
          resolved_at: string | null
          qa_report: Json | null
          dispatch_notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          type?: string
          severity?: string
          summary?: string
          status?: 'escalated' | 'assigned' | 'connected' | 'resolved'
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          messages?: Json
          steps?: Json
          assigned_responder?: Json | null
          priority?: number
          language?: string
          image_snapshot?: string | null
          escalated_at?: string
          resolved_at?: string | null
          qa_report?: Json | null
          dispatch_notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          severity?: string
          summary?: string
          status?: 'escalated' | 'assigned' | 'connected' | 'resolved'
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          messages?: Json
          steps?: Json
          assigned_responder?: Json | null
          priority?: number
          language?: string
          image_snapshot?: string | null
          resolved_at?: string | null
          qa_report?: Json | null
          dispatch_notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          id: string
          session_id: string
          sender_role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          sender_role: string
          content: string
          created_at?: string
        }
        Update: {
          sender_role?: string
          content?: string
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
  }
}

export type Incident = Database['public']['Tables']['incidents']['Row']
export type Responder = Database['public']['Tables']['responders']['Row']
export type IncidentAssignment = Database['public']['Tables']['incident_assignments']['Row']
