import { Webhooks } from '@polar-sh/nextjs';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log('Received Polar webhook:', payload.type);
    
    try {
      // Handle different webhook events
      switch (payload.type) {
        case 'order.created':
        case 'subscription.created':
          await handleSuccessfulPayment(payload);
          break;
        default:
          console.log('Unhandled webhook event:', payload.type);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Don't throw - let Polar know we received the webhook
    }
  },
});

//@ts-expect-error - Polar types are not fully typed
async function handleSuccessfulPayment(payload) {
  const { data } = payload;
  console.log(data)
  
  // Extract user information from metadata
  const userId = data.metadata?.user_id;
  const userEmail = data.metadata?.user_email || data.customer_email;
  const customerName = data.metadata?.user_name || data.customer_name;
  
  if (!userId) {
    console.error('No user ID found in webhook payload');
    return;
  }

  console.log('Processing payment for user:', userId);

  try {
    // Update user to pro plan
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: 'pro',
        upgraded_at: new Date().toISOString(),
        polar_customer_id: data.customerId
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return;
    }

    console.log('Successfully upgraded user to pro plan:', userId);

    // Optional: Send confirmation email or log the upgrade
    console.log('Payment processed successfully:', {
      userId,
      userEmail,
      customerName,
      plan: 'pro',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing payment:', error);
  }
} 