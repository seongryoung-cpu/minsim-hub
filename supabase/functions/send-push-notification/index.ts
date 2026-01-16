import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  user_id?: string;
  notification_type?: 'news' | 'candidate_updates' | 'quiz' | 'policy_match' | 'system';
}

// Map notification_type to preference column name
function getPreferenceColumn(type: string | undefined): string | null {
  const mapping: Record<string, string> = {
    news: 'news_enabled',
    candidate_updates: 'candidate_updates_enabled',
    quiz: 'quiz_enabled',
    policy_match: 'policy_match_enabled',
    system: 'system_enabled',
  };
  return type ? mapping[type] || null : null;
}

// Web Push implementation for Deno
async function generateVapidSignature(
  endpoint: string,
  publicKey: string,
  privateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const urlObj = new URL(endpoint);
  const audience = `${urlObj.protocol}//${urlObj.host}`;
  
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: 'mailto:admin@example.com'
  };
  
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import private key
  const privateKeyBuffer = Uint8Array.from(atob(privateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${unsignedToken}.${signatureB64}`;
  
  return {
    authorization: `vapid t=${jwt}, k=${publicKey}`,
    cryptoKey: publicKey
  };
}

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const { authorization, cryptoKey } = await generateVapidSignature(
    endpoint,
    vapidPublicKey,
    vapidPrivateKey
  );
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': authorization,
      'Crypto-Key': `p256ecdsa=${cryptoKey}`
    },
    body: payload
  });
  
  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error('VAPID keys not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload: PushPayload = await req.json();
    const { title, body, data, user_id, notification_type } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user preferences if notification_type is specified
    const preferenceColumn = getPreferenceColumn(notification_type);
    let userPreferences: Record<string, boolean> = {};

    if (preferenceColumn) {
      const userIds = [...new Set(subscriptions.map((s: { user_id: string }) => s.user_id))];
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .in('user_id', userIds);

      if (preferences) {
        for (const pref of preferences) {
          const prefValue = (pref as Record<string, unknown>)[preferenceColumn];
          userPreferences[pref.user_id as string] = prefValue !== false;
        }
      }
    }

    // Filter subscriptions based on user preferences
    const filteredSubscriptions = subscriptions.filter(sub => {
      if (!preferenceColumn) return true; // No type specified, send to all
      // If user has preference set, check it; otherwise default to true
      return userPreferences[sub.user_id] !== false;
    });

    if (filteredSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No subscriptions after filtering by preferences', 
          sent: 0,
          filtered_out: subscriptions.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pushPayload = JSON.stringify({ title, body, data });
    let sentCount = 0;
    const failedSubscriptions: string[] = [];

    for (const sub of filteredSubscriptions) {
      try {
        const response = await sendWebPush(
          sub.endpoint,
          sub.p256dh,
          sub.auth,
          pushPayload,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );

        if (response.ok) {
          sentCount++;
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired or invalid
          failedSubscriptions.push(sub.id);
        } else {
          console.error('Push failed:', response.status, await response.text());
        }
      } catch (pushError: unknown) {
        console.error('Push error for subscription:', sub.id, pushError);
      }
    }

    // Clean up invalid subscriptions
    if (failedSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent', 
        sent: sentCount,
        failed: filteredSubscriptions.length - sentCount,
        cleaned: failedSubscriptions.length,
        filtered_out: subscriptions.length - filteredSubscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
