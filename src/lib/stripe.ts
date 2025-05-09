import { supabase } from './supabase';

interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'payment' | 'subscription';
}

export async function createCheckoutSession({ 
  priceId, 
  successUrl, 
  cancelUrl,
  mode = 'subscription'
}: CreateCheckoutSessionParams) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        mode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    if (!url) throw new Error('No checkout URL returned');

    // Redirect to Stripe Checkout
    window.location.href = url;

  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export async function createPortalSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create portal session');
    }

    const { url } = await response.json();
    if (!url) throw new Error('No portal URL returned');

    // Redirect to Stripe Customer Portal
    window.location.href = url;

  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}