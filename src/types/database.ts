// Hand-written to match supabase/migrations/20261115000000_init.sql.
// Regenerate once a database is available:
//   npm run db:types        (local, needs Docker)
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      weddings: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          partner_one: string;
          partner_two: string;
          story: string | null;
          template: string;
          cover_photo_path: string | null;
          photo_paths: string[];
          currency: string;
          show_contributor_names: boolean;
          show_amounts: boolean;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          upi_id: string | null;
          payment_link: string | null;
          payment_instructions: string | null;
          plan: string;
          status: Database["public"]["Enums"]["wedding_status"];
          published_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          slug: string;
          partner_one?: string;
          partner_two?: string;
          story?: string | null;
          template?: string;
          cover_photo_path?: string | null;
          photo_paths?: string[];
          currency?: string;
          show_contributor_names?: boolean;
          show_amounts?: boolean;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          upi_id?: string | null;
          payment_link?: string | null;
          payment_instructions?: string | null;
          plan?: string;
          status?: Database["public"]["Enums"]["wedding_status"];
          published_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weddings"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          wedding_id: string;
          name: string;
          starts_at: string;
          ends_at: string | null;
          timezone: string;
          venue_name: string | null;
          address: string | null;
          map_url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          name: string;
          starts_at: string;
          ends_at?: string | null;
          timezone: string;
          venue_name?: string | null;
          address?: string | null;
          map_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "events_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          id: string;
          wedding_id: string;
          title: string;
          description: string | null;
          photo_path: string | null;
          target_amount: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          title: string;
          description?: string | null;
          photo_path?: string | null;
          target_amount?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "goals_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvps: {
        Row: {
          id: string;
          wedding_id: string;
          name: string;
          attending: boolean;
          guest_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          name: string;
          attending: boolean;
          guest_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rsvps"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "rsvps_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      contributions: {
        Row: {
          id: string;
          wedding_id: string;
          goal_id: string;
          name: string | null;
          amount: number;
          message: string | null;
          is_anonymous: boolean;
          status: Database["public"]["Enums"]["contribution_status"];
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          goal_id: string;
          name?: string | null;
          amount: number;
          message?: string | null;
          is_anonymous?: boolean;
          status?: Database["public"]["Enums"]["contribution_status"];
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contributions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "contributions_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      owns_wedding: {
        Args: { wid: string };
        Returns: boolean;
      };
      public_goal_progress: {
        Args: { wedding_slug: string };
        Returns: {
          goal_id: string;
          raised: number | null;
          contributor_count: number;
        }[];
      };
      public_contributions: {
        Args: { wedding_slug: string };
        Returns: {
          id: string;
          goal_id: string;
          name: string | null;
          amount: number | null;
          message: string | null;
          created_at: string;
        }[];
      };
      archive_finished_weddings: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      wedding_status: "draft" | "published" | "archived";
      payment_method: "upi" | "link" | "instructions";
      contribution_status: "unconfirmed" | "confirmed";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
