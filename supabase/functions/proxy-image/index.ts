import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Browser-like headers to bypass hotlinking protection
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// Determine referer based on image source
function getRefererForUrl(imageUrl: string): string {
  if (imageUrl.includes('namu.wiki') || imageUrl.includes('namu.la')) {
    return 'https://namu.wiki/';
  }
  if (imageUrl.includes('wikipedia.org') || imageUrl.includes('wikimedia.org')) {
    return 'https://ko.wikipedia.org/';
  }
  if (imageUrl.includes('naver.com') || imageUrl.includes('pstatic.net')) {
    return 'https://www.naver.com/';
  }
  // Default: use the image URL's origin
  try {
    const url = new URL(imageUrl);
    return url.origin + '/';
  } catch {
    return 'https://www.google.com/';
  }
}

// Get file extension from content-type or URL
function getExtension(contentType: string | null, imageUrl: string): string {
  if (contentType) {
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    if (contentType.includes('gif')) return 'gif';
    if (contentType.includes('webp')) return 'webp';
  }
  
  // Fallback: check URL
  const urlLower = imageUrl.toLowerCase();
  if (urlLower.includes('.png')) return 'png';
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'jpg';
  if (urlLower.includes('.gif')) return 'gif';
  
  return 'webp';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, candidate_id, candidate_name } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'image_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Proxying image:', image_url);

    // Fetch the image with browser-like headers
    const referer = getRefererForUrl(image_url);
    const fetchResponse = await fetch(image_url, {
      headers: {
        ...browserHeaders,
        'Referer': referer,
      },
    });

    if (!fetchResponse.ok) {
      console.error('Failed to fetch image:', fetchResponse.status, fetchResponse.statusText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch image: ${fetchResponse.status} ${fetchResponse.statusText}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get image data
    const imageBuffer = await fetchResponse.arrayBuffer();
    const contentType = fetchResponse.headers.get('content-type') || 'image/webp';
    const extension = getExtension(contentType, image_url);

    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = candidate_name 
      ? candidate_name.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50)
      : 'candidate';
    const fileName = candidate_id 
      ? `candidates/${candidate_id}-${timestamp}.${extension}`
      : `candidates/${safeFileName}-${timestamp}.${extension}`;

    console.log('Uploading to storage:', fileName);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-images')
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-images')
      .getPublicUrl(fileName);

    console.log('Upload successful:', publicUrl);

    // If candidate_id is provided, update the database
    if (candidate_id) {
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ image_url: publicUrl })
        .eq('id', candidate_id);

      if (updateError) {
        console.error('Database update error:', updateError);
        // Still return success since image was uploaded
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        storage_url: publicUrl,
        original_url: image_url,
        file_path: fileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Proxy image error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
