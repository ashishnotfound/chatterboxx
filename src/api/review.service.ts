import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Create a separate client with service role key for Edge Functions
const supabaseService = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

export const reviewService = {
  /**
   * Send a review via secure Supabase Edge Function proxy
   */
  async sendDiscordReview(username: string, rating: number, review: string) {
    try {
      console.log('Invoking review function with:', { username, rating, reviewLength: review.length });
      const { data, error } = await supabaseService.functions.invoke('review', {
        body: { username, rating, review }
      });

      if (error) {
        console.error('Supabase function invocation error:', {
          message: error.message,
          status: error.status,
          context: error.context
        });
        throw error;
      }
      return { success: true, data };
    } catch (error: any) {
      console.error('Review submission error detailed:', {
        message: error.message,
        name: error.name,
        status: error.status,
        context: error.context,
        stack: error.stack,
        details: error
      });
      return { success: false, error: error.message || 'Failed to send review' };
    }
  }
};
