/**
 * Hand-authored to match supabase/migrations exactly, since these types are
 * normally generated from a live database (`supabase gen types typescript`).
 *
 * IMPORTANT: once this project is linked to a real Supabase Cloud project,
 * regenerate this file for real via:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 * and keep it in sync after every future migration. Until then, this file is
 * kept manually consistent with supabase/migrations/*.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          name: string;
          permissions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          permissions?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          role_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          role_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          address_line: string | null;
          city: string | null;
          governorate: string | null;
          tags: string[];
          source: string;
          shopify_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          address_line?: string | null;
          city?: string | null;
          governorate?: string | null;
          tags?: string[];
          source?: string;
          shopify_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      customer_notes: {
        Row: {
          id: string;
          customer_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          author_id?: string | null;
          note: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_notes"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          status: string;
          shopify_product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          status?: string;
          shopify_product_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          size: string | null;
          color: string | null;
          price: number;
          shopify_variant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          size?: string | null;
          color?: string | null;
          price: number;
          shopify_variant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          variant_id: string;
          quantity_on_hand: number;
          quantity_reserved: number;
          low_stock_threshold: number;
          location: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          low_stock_threshold?: number;
          location?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          status: string;
          payment_method: string;
          subtotal: number;
          shipping_fee: number;
          discount: number;
          total: number;
          source: string;
          shopify_order_id: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          status?: string;
          payment_method?: string;
          subtotal?: number;
          shipping_fee?: number;
          discount?: number;
          total?: number;
          source?: string;
          shopify_order_id?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Insert"]>;
        Relationships: [];
      };
      order_notes: {
        Row: {
          id: string;
          order_id: string;
          author_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          author_id: string;
          note: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_notes"]["Insert"]>;
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          carrier: string | null;
          tracking_number: string | null;
          status: string;
          shipblu_shipment_id: string | null;
          shopify_fulfillment_id: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          carrier?: string | null;
          tracking_number?: string | null;
          status?: string;
          shipblu_shipment_id?: string | null;
          shopify_fulfillment_id?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          method: string;
          status: string;
          collected_at: string | null;
          created_at: string;
          shopify_transaction_id: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          method: string;
          status?: string;
          collected_at?: string | null;
          created_at?: string;
          shopify_transaction_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      returns: {
        Row: {
          id: string;
          order_id: string;
          reason: string | null;
          status: string;
          requested_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          reason?: string | null;
          status?: string;
          requested_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["returns"]["Insert"]>;
        Relationships: [];
      };
      exchanges: {
        Row: {
          id: string;
          order_id: string;
          original_variant_id: string;
          new_variant_id: string;
          status: string;
          requested_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          original_variant_id: string;
          new_variant_id: string;
          status?: string;
          requested_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exchanges"]["Insert"]>;
        Relationships: [];
      };
      communications: {
        Row: {
          id: string;
          customer_id: string;
          order_id: string | null;
          channel: string;
          direction: string;
          message: string;
          status: string | null;
          sent_by: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          order_id?: string | null;
          channel: string;
          direction: string;
          message: string;
          status?: string | null;
          sent_by?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["communications"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          assigned_to: string | null;
          created_by: string;
          related_order_id: string | null;
          related_customer_id: string | null;
          due_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assigned_to?: string | null;
          created_by: string;
          related_order_id?: string | null;
          related_customer_id?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      data_imports: {
        Row: {
          id: string;
          source: string;
          entity: string;
          status: string;
          row_count: number | null;
          error_log: Json | null;
          imported_by: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          source: string;
          entity: string;
          status?: string;
          row_count?: number | null;
          error_log?: Json | null;
          imported_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["data_imports"]["Insert"]>;
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_conversations"]["Insert"]>;
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          tool_calls: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_messages"]["Insert"]>;
        Relationships: [];
      };
      integration_status: {
        Row: {
          id: string;
          integration: string;
          connected: boolean;
          last_success_at: string | null;
          last_error: string | null;
          last_error_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          integration: string;
          connected?: boolean;
          last_success_at?: string | null;
          last_error?: string | null;
          last_error_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["integration_status"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      v_low_stock_inventory: {
        Row: {
          id: string;
          variant_id: string;
          quantity_on_hand: number;
          quantity_reserved: number;
          low_stock_threshold: number;
          location: string | null;
          sku: string;
          product_name: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_permission: {
        Args: { perm: string };
        Returns: boolean;
      };
      current_role_name: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers, mirroring the shape the Supabase CLI generates
// ---------------------------------------------------------------------------

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
