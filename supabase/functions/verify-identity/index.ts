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

    // Generate a mock CI (연계정보) - in production this comes from the identity provider
    const mockCI = `DEMO_CI_${userId}_${Date.now()}`;
    
    // Check for duplicate CI (prevent duplicate accounts)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("identity_ci", mockCI)
      .neq("user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          error: "이미 인증된 다른 계정이 존재합니다",
          code: "DUPLICATE_IDENTITY" 
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with verification info
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        phone_number: phone.replace(/-/g, ""),
        verification_level: "identity",
        phone_verified_at: new Date().toISOString(),
        identity_verified_at: new Date().toISOString(),
        identity_provider: "demo", // In production: 'pass' | 'toss' | 'kcb'
        identity_ci: mockCI,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Identity verified for user ${userId} (DEMO MODE)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "본인인증이 완료되었습니다",
        verificationLevel: "identity",
        provider: "demo",
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
