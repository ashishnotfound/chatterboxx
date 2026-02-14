export const directDiscordService = {
  /**
   * Send review directly to Discord webhook (bypassing Supabase Edge Function)
   */
  async sendDirectReview(username: string, rating: number, review: string) {
    try {
      console.log('Sending directly to Discord webhook:', { username, rating, reviewLength: review.length });
      
      const webhookUrl = "https://discord.com/api/webhooks/1471205503605412025/z5sFj-EvKg1uH8DgaCf5sTfFB3S5AyNMw9v4mCm0ltPR5US8Ha8TEYN951WvnECfdrnB";
      
      const discordPayload = {
        content: `**New Review from ${username || 'Anonymous'}**\n\n⭐ Rating: ${'⭐'.repeat(rating || 0)}\n\n**Review:**\n${review || 'No content'}`
      };

      console.log('Direct Discord payload:', discordPayload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });

      console.log('Direct Discord response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct Discord API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          contentType: response.headers.get('content-type')
        });
        
        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Discord error details:', errorJson);
        } catch (e) {
          console.error('Discord error text (not JSON):', errorText);
        }
        
        return { success: false, error: `Discord error: ${response.status} - ${errorText}` };
      }

      console.log('Direct Discord: Successfully sent');
      return { success: true, data: 'Review sent directly to Discord' };

    } catch (error: any) {
      console.error('Direct Discord submission error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return { success: false, error: error.message || 'Failed to send review directly' };
    }
  }
};
