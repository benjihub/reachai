import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get or create user in Supabase
 */
export const upsertUser = async (googleId, email, name, avatar) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          google_id: googleId,
          email,
          name,
          avatar_url: avatar,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'google_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('upsertUser error:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('getUser error:', error);
    throw error;
  }
};

/**
 * Get drafts for user
 */
export const getDraftsForUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('getDraftsForUser error:', error);
    throw error;
  }
};

export default supabase;
