import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getEmbedding } from '../lib/googleAI';
import { useAuth } from '../context/AuthContext';

export const useRecommendation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // 1. Search (Hybrid)
  const searchBooks = async (query: string, emotionFilter?: { joy?: number; sadness?: number }) => {
    setLoading(true);
    try {
      const embedding = await getEmbedding(query);
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_embedding: JSON.stringify(embedding),
        min_joy: emotionFilter?.joy || 0,
        min_sadness: emotionFilter?.sadness || 0,
        match_threshold: 0.3,
        match_count: 10
      } as any);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 2. Transaction-Based Recommendations (Based on Recent Reads)
  const getHistoryRecommendations = async () => {
    if (!user) return { sourceTitle: null, recommendations: [] };
    try {
      // Fetch the user's most recent successful transaction
      const { data: recentTx } = await supabase
        .from('transactions')
        .select('book:books(id, title, description)')
        .eq('user_id', user.id)
        .in('status', ['returned', 'active', 'approved', 'pending_return'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!recentTx || !recentTx.book) return { sourceTitle: null, recommendations: [] };
      const recentBook = recentTx.book as any;

      // Find similar books using the description/title of their last read!
      const embedding = await getEmbedding(recentBook.description || recentBook.title);
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_embedding: JSON.stringify(embedding),
        min_joy: 0, min_sadness: 0, match_threshold: 0.2, match_count: 10
      } as any);

      if (error) throw error;
      
      // Filter out the book they just read from the results
      const recs = (data || []).filter((b: any) => b.id !== recentBook.id);
      return { sourceTitle: recentBook.title, recommendations: recs };
    } catch (err) {
      console.error('History recs failed:', err);
      return { sourceTitle: null, recommendations: [] };
    }
  };

  // 3. Wishlist-Based Recommendations
  const getWishlistRecommendations = async () => {
    if (!user) return { sourceTitle: null, recommendations: [] };
    try {
      // Fetch the user's most recently added wishlist item
      const { data: wishItem } = await supabase
        .from('wishlists')
        .select('book:books(id, title, description)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!wishItem || !wishItem.book) return { sourceTitle: null, recommendations: [] };
      const wishBook = wishItem.book as any;

      // Find similar books
      const embedding = await getEmbedding(wishBook.description || wishBook.title);
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_embedding: JSON.stringify(embedding),
        min_joy: 0, min_sadness: 0, match_threshold: 0.2, match_count: 10
      } as any);

      if (error) throw error;
      
      const recs = (data || []).filter((b: any) => b.id !== wishBook.id);
      return { sourceTitle: wishBook.title, recommendations: recs };
    } catch (err) {
      console.error('Wishlist recs failed:', err);
      return { sourceTitle: null, recommendations: [] };
    }
  };

  // 4. Trending (Transactions-Based Across ALL Users)
  const getTrendingBooks = async () => {
    try {
      // Step 1: Get the last 100 transactions across the entire platform
      const { data: transactions } = await supabase
        .from('transactions')
        .select('book_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactions && transactions.length > 0) {
        // Step 2: Count the frequency of each book being rented
        const bookCounts: Record<number, number> = {};
        transactions.forEach(tx => {
          bookCounts[tx.book_id] = (bookCounts[tx.book_id] || 0) + 1;
        });

        // Step 3: Sort book IDs by most rented
        const popularBookIds = Object.keys(bookCounts)
          .map(Number)
          .sort((a, b) => bookCounts[b] - bookCounts[a])
          .slice(0, 10);

        if (popularBookIds.length > 0) {
          // Step 4: Fetch those specific books
          const { data: popularBooks } = await supabase
            .from('books')
            // FIX: Removed the 'similarity' column which was causing it to crash!
            .select('id, title, author, image_url, average_rating, status') 
            .in('id', popularBookIds)
            .in('status', ['available', 'rented']);

          if (popularBooks && popularBooks.length > 0) {
            // Sort the fetched books so the highest counts stay first
            return popularBooks.sort((a, b) => popularBookIds.indexOf(a.id) - popularBookIds.indexOf(b.id));
          }
        }
      }

      // Step 5: Fallback if there are no transactions on the platform yet
      const { data: fallbackBooks } = await supabase
        .from('books')
        .select('id, title, author, image_url, average_rating, status') // Fix applied here too
        .in('status', ['available', 'rented'])
        .order('ratings_count', { ascending: false })
        .limit(10);
        
      return fallbackBooks || [];
    } catch (err) {
      console.error('Trending fetch failed:', err);
      return [];
    }
  };

  return {
    searchBooks,
    getHistoryRecommendations,
    getWishlistRecommendations,
    getTrendingBooks,
    loading
  };
};