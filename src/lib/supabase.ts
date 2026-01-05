import { createClient } from '@supabase/supabase-js';
// We don't even need to import the Database type for this fix

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase Environment Variables');
}

// FIX: Use <any> to strictly disable the schema check causing the 'never' error
export const supabase = createClient<any>(supabaseUrl, supabaseKey);