import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export const authService = {
  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Update user presence status
   */
  async updatePresence(userId: string, status: 'online' | 'idle' | 'dnd' | 'invisible') {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        presence_status: status,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  /**
   * Get profile by user ID
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
};
