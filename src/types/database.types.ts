export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
      books: {
        Row: {
          id: number
          isbn13: number | null
          title: string
          author: string | null
          description: string | null
          category: string | null
          broad_category: string | null
          image_url: string | null
          published_year: number | null
          num_pages: number | null
          emotion_joy: number | null
          emotion_sadness: number | null
          emotion_fear: number | null
          emotion_anger: number | null
          emotion_surprise: number | null
          status: 'available' | 'rented' | 'pending_approval' | 'maintenance'
          owner_id: string | null
          average_rating: number | null
          ratings_count: number | null
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          author?: string | null
          status?: 'available' | 'rented' | 'pending_approval' | 'maintenance'
          owner_id?: string | null
          broad_category?: string | null
          image_url?: string | null
          description?: string | null
          embedding?: string | number[] | null // Allow array or string for vector
        }
        Update: {
          id?: number
          title?: string
          status?: 'available' | 'rented' | 'pending_approval' | 'maintenance'
        }
      }
      transactions: {
        Row: {
          id: number
          book_id: number | null
          user_id: string | null
          status: 'pending' | 'approved' | 'active' | 'returned' | 'rejected' | 'overdue'
          request_date: string | null
          approval_date: string | null
          due_date: string | null
          return_date: string | null
        }
        Insert: {
          book_id: number
          user_id: string
          status?: 'pending' | 'approved' | 'active' | 'returned' | 'rejected' | 'overdue'
        }
        Update: {
          status?: 'pending' | 'approved' | 'active' | 'returned' | 'rejected' | 'overdue'
          approval_date?: string | null
          due_date?: string | null
          return_date?: string | null
        }
      }
      wishlists: {
        Row: {
          id: number
          user_id: string
          book_id: number
          created_at: string
        }
        Insert: {
          user_id: string
          book_id: number
        }
        Update: {
           id?: number
        }
      }
      reviews: {
        Row: {
          id: number
          book_id: number
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          book_id: number
          user_id: string
          rating: number
          comment?: string | null
        }
        Update: {
          rating?: number
          comment?: string | null
        }
      }
    }
    Functions: {
      hybrid_search: {
        Args: {
          query_embedding: string
          filter_category?: string | null
          min_joy?: number
          min_sadness?: number
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: number
          title: string
          average_rating: number
          emotion_joy: number
          similarity: number
          image_url: string | null
        }[]
      }
      get_user_recommendations: {
        Args: {
          target_user_id: string
          match_count?: number
        }
        Returns: {
          id: number
          title: string
          author: string | null
          image_url: string | null
          similarity: number
        }[]
      }
      get_wishlist_recommendations: {
        Args: {
          target_user_id: string
          match_count?: number
        }
        Returns: {
          id: number
          title: string
          author: string | null
          image_url: string | null
          similarity: number
        }[]
      }
    }
  }
}