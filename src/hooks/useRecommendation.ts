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
      // Generate embedding for the search query
      const embedding = await getEmbedding(query);
      
      // FIX: Cast the arguments object to 'any' to bypass the "parameter of type undefined" error
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_embedding: JSON.stringify(embedding), // Pass as string
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

  // 2. Transaction-Based Recommendations
  const getHistoryRecommendations = async () => {
    if (!user) return [];
    
    // FIX: Cast args to 'any'
    const { data } = await supabase.rpc('get_user_recommendations', {
      target_user_id: user.id,
      match_count: 10
    } as any);
    
    return data || [];
  };

  // 3. Wishlist-Based Recommendations
  const getWishlistRecommendations = async () => {
    if (!user) return [];
    
    // FIX: Cast args to 'any'
    const { data } = await supabase.rpc('get_wishlist_recommendations', {
      target_user_id: user.id,
      match_count: 10
    } as any);
    
    return data || [];
  };

  // 4. Trending (Fallback)
  const getTrendingBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('id, title, author, image_url, average_rating')
      .eq('status', 'available')
      .order('ratings_count', { ascending: false })
      .limit(10);
    return data || [];
  };

  return {
    searchBooks,
    getHistoryRecommendations,
    getWishlistRecommendations,
    getTrendingBooks,
    loading
  };
};