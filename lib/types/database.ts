/**
 * Database TypeScript Types
 * These types match the Supabase database schema
 */

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
      user_profiles: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          profile_picture: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email?: string | null
          phone: string
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          contact_name: string
          phone: string
          street: string
          city: string
          state: string
          postal_code: string
          landmark: string | null
          label: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_name: string
          phone: string
          street: string
          city: string
          state: string
          postal_code: string
          landmark?: string | null
          label?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_name?: string
          phone?: string
          street?: string
          city?: string
          state?: string
          postal_code?: string
          landmark?: string | null
          label?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shops: {
        Row: {
          id: string
          name: string
          address: string
          distance: string | null
          image_url: string
          contact_phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          distance?: string | null
          image_url: string
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          distance?: string | null
          image_url?: string
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          weight: string | null
          weight_in_kg: number
          price: number
          price_per_kg: number
          original_price: number | null
          discount_percentage: number
          image_url: string
          description: string
          rating: number
          is_available: boolean
          shop_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          weight?: string | null
          weight_in_kg?: number
          price: number
          price_per_kg: number
          original_price?: number | null
          discount_percentage?: number
          image_url: string
          description?: string
          rating?: number
          is_available?: boolean
          shop_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          weight?: string | null
          weight_in_kg?: number
          price?: number
          price_per_kg?: number
          original_price?: number | null
          discount_percentage?: number
          image_url?: string
          description?: string
          rating?: number
          is_available?: boolean
          shop_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addons: {
        Row: {
          id: string
          name: string
          price: number
          description: string | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          description?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          description?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_amount: number
          discount_percentage: number | null
          min_order_amount: number
          max_discount: number | null
          valid_from: string
          valid_until: string | null
          usage_limit: number | null
          usage_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_amount: number
          discount_percentage?: number | null
          min_order_amount?: number
          max_discount?: number | null
          valid_from?: string
          valid_until?: string | null
          usage_limit?: number | null
          usage_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_amount?: number
          discount_percentage?: number | null
          min_order_amount?: number
          max_discount?: number | null
          valid_from?: string
          valid_until?: string | null
          usage_limit?: number | null
          usage_count?: number
          is_active?: boolean
          created_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string | null
          type: string
          provider: string | null
          details: Json | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          provider?: string | null
          details?: Json | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          provider?: string | null
          details?: Json | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          parent_order: string | null
          shop_id: string | null
          address_id: string | null
          subtotal: number
          delivery_charge: number
          discount: number
          coupon_id: string | null
          total: number
          status: string
          status_note: string | null
          payment_method_id: string | null
          payment_method_text: string | null
          otp: string | null
          delivery_eta: string | null
          delivered_at: string | null
          delivery_agent_name: string | null
          delivery_agent_mobile: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number?: string
          parent_order?: string | null
          shop_id?: string | null
          address_id?: string | null
          subtotal: number
          delivery_charge?: number
          discount?: number
          coupon_id?: string | null
          total: number
          status?: string
          status_note?: string | null
          payment_method_id?: string | null
          payment_method_text?: string | null
          otp?: string | null
          delivery_eta?: string | null
          delivered_at?: string | null
          delivery_agent_name?: string | null
          delivery_agent_mobile?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          parent_order?: string | null
          shop_id?: string | null
          address_id?: string | null
          subtotal?: number
          delivery_charge?: number
          discount?: number
          coupon_id?: string | null
          total?: number
          status?: string
          status_note?: string | null
          payment_method_id?: string | null
          payment_method_text?: string | null
          otp?: string | null
          delivery_eta?: string | null
          delivered_at?: string | null
          delivery_agent_name?: string | null
          delivery_agent_mobile?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          addon_id: string | null
          name: string
          quantity: number
          weight: string | null
          weight_in_kg: number | null
          price: number
          price_per_kg: number | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          addon_id?: string | null
          name: string
          quantity?: number
          weight?: string | null
          weight_in_kg?: number | null
          price: number
          price_per_kg?: number | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          addon_id?: string | null
          name?: string
          quantity?: number
          weight?: string | null
          weight_in_kg?: number | null
          price?: number
          price_per_kg?: number | null
          image_url?: string | null
          created_at?: string
        }
      }
      order_timeline: {
        Row: {
          id: string
          order_id: string
          stage: string
          description: string
          timestamp: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          stage: string
          description: string
          timestamp?: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          stage?: string
          description?: string
          timestamp?: string
          is_completed?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_otp: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

