import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyIdentityRequest {
  name: string;
  phone: string;
  birthDate: string; // YYMMDD
  gender: "male" | "female";
  carrier: "SKT" | "KT" | "LGU" | "SKT_MVNO" | "KT_MVNO" | "LGU_MVNO";
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const body: VerifyIdentityRequest = await req.json();
    const { name, phone, birthDate, gender, carrier } = body;

    // Validate input
    if (!name || !phone || !birthDate || !gender || !carrier) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Phone number validation (Korean format)
    const phoneRegex = /^01[0-9]{8,9}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ""))) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Birth date validation (YYMMDD)
    const birthRegex = /^\d{6}$/;
    if (!birthRegex.test(birthDate)) {
      return new Response(
        JSON.stringify({ error: "Invalid birth date format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 🔧 DEMO MODE: Simulated verification
    // ============================================
    // In production, this would call PASS/Toss API:
    // - Toss: POST https://api.tosspayments.com/v1/identity
    // - PASS: Integration via SDK popup
    // ============================================

    // 실제 본인인증(PASS/토스 등) 연동 전까지는 인증 처리를 하지 않음.
    // 이전 데모 모드는 아무 정보로나 "본인인증 완료"가 되어 인증 배지의 신뢰도를 해쳤기 때문에 비활성화함.
    void userId; void name; void phone; void birthDate; void gender; void carrier;
    return new Response(
      JSON.stringify({
        error: "본인인증 서비스 준비 중입니다",
        code: "IDENTITY_NOT_AVAILABLE",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );


  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
