import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID regex pattern
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation schema
const pushPayloadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  body: z.string().min(1, 'Body is required').max(1000, 'Body too long'),
  data: z.record(z.unknown()).optional(),
  user_id: z.string().regex(uuidRegex, 'Invalid user_id format').optional(),
  notification_type: z.enum(['news', 'candidate_updates', 'quiz', 'policy_match', 'system']).optional(),
});

type PushPayload = z.infer<typeof pushPayloadSchema>;

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

// 관리자 인증: 로그인한 관리자만 이 함수를 호출할 수 있음
async function requireAdmin(req: Request): Promise<Response | null> {
  const deny = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return deny(401, 'Unauthorized');
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return deny(401, 'Unauthorized');
    const { data: isAdmin, error: roleError } = await userClient.rpc('is_admin', { _user_id: user.id });
    if (roleError || !isAdmin) return deny(403, 'Forbidden');
    return null;
  } catch {
    return deny(401, 'Unauthorized');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await requireAdmin(req);
  if (denied) return denied;

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

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = pushPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: errorMessages }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, body, data, user_id, notification_type } = parseResult.data;

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
