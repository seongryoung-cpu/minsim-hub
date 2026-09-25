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
const newUserPayloadSchema = z.object({
  user_id: z.string().regex(uuidRegex, 'Invalid user_id format'),
  display_name: z.string().max(100, 'Display name too long').optional(),
});

type NewUserPayload = z.infer<typeof newUserPayloadSchema>;

// Web Push implementation
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

    const parseResult = newUserPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: errorMessages }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id } = parseResult.data;

    // 호출자 검증: 방금 가입한 본인만 자기 가입 알림을 보낼 수 있음 (알림 스팸 방지)
    const authHeader = req.headers.get('Authorization');
    const { data: { user: caller } } = authHeader?.startsWith('Bearer ')
      ? await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      : { data: { user: null } };
    if (!caller || caller.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (Date.now() - new Date(caller.created_at).getTime() > 10 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: 'Signup notification window expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 표시 이름은 요청 본문이 아니라 DB 프로필에서 가져옴
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user_id)
      .maybeSingle();
    const userName = (profile?.display_name || '새 사용자').slice(0, 50);

    console.log('New user signup notification for:', userName);

    // Get all admin user IDs
    const { data: adminRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (roleError) {
      console.error('Error fetching admin roles:', roleError);
      throw roleError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admin users found');
      return new Response(
        JSON.stringify({ message: 'No admin users found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUserIds = adminRoles.map(r => r.user_id);
    console.log('Found admin users:', adminUserIds.length);

    // Create in-app notifications for admins
    const notifications = adminUserIds.map(adminId => ({
      user_id: adminId,
      type: 'system',
      title: '새 사용자 가입',
      body: `${userName}님이 새로 가입했습니다.`,
      data: {
        new_user_id: user_id,
        display_name: userName,
        created_at: new Date().toISOString()
      }
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    // If VAPID keys are configured, send push notifications
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      // Get push subscriptions for admin users
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', adminUserIds);

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
      } else if (subscriptions && subscriptions.length > 0) {
        // Check notification preferences (system notifications)
        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('user_id, system_enabled')
          .in('user_id', adminUserIds);

        const enabledUsers = new Set(
          preferences
            ?.filter(p => p.system_enabled !== false)
            .map(p => p.user_id) || adminUserIds
        );

        const filteredSubs = subscriptions.filter(s => enabledUsers.has(s.user_id));

        const pushPayload = JSON.stringify({
          title: '🎉 새 사용자 가입',
          body: `${userName}님이 새로 가입했습니다.`,
          data: { type: 'new_user', user_id }
        });

        let sentCount = 0;
        const failedSubscriptions: string[] = [];

        for (const sub of filteredSubs) {
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
              console.log('Push sent to admin:', sub.user_id);
            } else if (response.status === 410 || response.status === 404) {
              failedSubscriptions.push(sub.id);
            } else {
              console.error('Push failed:', response.status);
            }
          } catch (pushError) {
            console.error('Push error:', pushError);
          }
        }

        // Clean up invalid subscriptions
        if (failedSubscriptions.length > 0) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .in('id', failedSubscriptions);
        }

        console.log('Push notifications sent:', sentCount);

        return new Response(
          JSON.stringify({ 
            message: 'Admin notifications sent',
            in_app: notifications.length,
            push_sent: sentCount,
            push_failed: filteredSubs.length - sentCount
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Admin notifications created',
        in_app: notifications.length,
        push_sent: 0
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
