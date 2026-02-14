import { supabase } from '@/integrations/supabase/client';
import { sanitizeText } from '@/utils/sanitize';

export const discordService = {
  /**
   * Send a review to Discord via Webhook
   * Note: The webhook URL should ideally be stored in Supabase secrets and accessed via an Edge Function
   * for security. For this implementation, we'll assume a secure Edge Function approach.
   */
  async sendReview(username: string, content: string) {
    const sanitizedContent = sanitizeText(content);
    
    try {
      // In a real production app, you'd call a Supabase Edge Function to keep the webhook secret hidden
      // const { data, error } = await supabase.functions.invoke('send-discord-review', {
      //   body: { username, content: sanitizedContent }
      // });

      // For demonstration, logging the action. Replace with your actual webhook or Edge Function call.
      console.log('Sending review to Discord:', { username, content: sanitizedContent });
      
      // Simulate success
      return { success: true };
    } catch (error) {
      console.error('Discord webhook error:', error);
      return { success: false, error };
    }
  }
};
