import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SSRF-safe URL validation schema
const extractCandidatesSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL too long')
    .refine((url) => {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        // Block internal/private IPs
        const hostname = u.hostname.toLowerCase();
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        const blockedPrefixes = ['192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.', 
          '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', 
          '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '169.254.', 'fc00:', 'fe80:'];
        
        if (blockedHosts.includes(hostname)) return false;
        for (const prefix of blockedPrefixes) {
          if (hostname.startsWith(prefix)) return false;
        }
        // Only allow http(s) protocols
        if (!['http:', 'https:'].includes(u.protocol)) return false;
        return true;
      } catch {
        return false;
      }
    }, 'Invalid or blocked URL'),
  region_name: z.string().max(100, 'Region name too long').optional(),
});

interface ExtractedCandidate {
  name: string;
  party: string;
  region_name: string;
  position: string;
  age?: number;
  education?: string;
  slogan?: string;
  careers?: { period: string; title: string; organization: string }[];
  pledges?: { title: string; description: string; category: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = extractCandidatesSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ success: false, error: errorMessages }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, region_name } = parseResult.data;

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Google Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    // Step 1: Scrape the webpage using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl API error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pageContent = scrapeData.data?.markdown || '';
    console.log('Scraped content length:', pageContent.length);

    if (!pageContent || pageContent.length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Page content too short or empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Use Google Gemini API to extract candidate information
    const prompt = `당신은 한국 정치 후보자 정보를 추출하는 전문 AI입니다.
주어진 웹페이지 내용에서 정치 후보자 정보를 정확하게 추출해주세요.

추출해야 할 정보:
- name: 후보자 이름 (필수)
- party: 소속 정당 (필수, 예: 더불어민주당, 국민의힘, 조국혁신당 등)
- region_name: 출마 지역 (예: 서울특별시, 경기도 등)
- position: 직책/직위 (예: 서울시장 예비후보, 국회의원 등)
- age: 나이 (숫자만)
- education: 학력
- slogan: 선거 슬로건
- careers: 경력 배열 [{ period: "기간", title: "직책", organization: "소속" }]
- pledges: 공약 배열 [{ title: "공약명", description: "설명", category: "분류" }]

중요: 
- 실제 데이터만 추출하고, 없는 정보는 null로 반환하세요.
- 여러 후보자가 있으면 모두 추출하세요.
- 반드시 JSON 형식으로 응답하세요.

다음 웹페이지에서 후보자 정보를 추출해주세요:

${pageContent.substring(0, 30000)}`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                candidates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: '후보자 이름' },
                      party: { type: 'string', description: '소속 정당' },
                      region_name: { type: 'string', description: '출마 지역' },
                      position: { type: 'string', description: '직책/직위' },
                      age: { type: 'number', description: '나이' },
                      education: { type: 'string', description: '학력' },
                      slogan: { type: 'string', description: '선거 슬로건' },
                      careers: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            period: { type: 'string' },
                            title: { type: 'string' },
                            organization: { type: 'string' }
                          },
                          required: ['period', 'title', 'organization']
                        }
                      },
                      pledges: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' }
                          },
                          required: ['title', 'description', 'category']
                        }
                      }
                    },
                    required: ['name', 'party']
                  }
                }
              },
              required: ['candidates']
            }
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Google API 요청 한도 초과. 잠시 후 다시 시도해주세요.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 403) {
        return new Response(
          JSON.stringify({ success: false, error: 'Google API 키가 유효하지 않습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('Google Gemini API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI 추출 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Gemini API response:', JSON.stringify(aiData));

    // Parse Google Gemini API response
    let extractedCandidates: ExtractedCandidate[] = [];
    const textContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textContent) {
      try {
        const parsed = JSON.parse(textContent);
        extractedCandidates = parsed.candidates || [];
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
      }
    }

    // Apply region_name if provided
    if (region_name) {
      extractedCandidates = extractedCandidates.map(c => ({
        ...c,
        region_name: c.region_name || region_name
      }));
    }

    console.log('Extracted candidates:', extractedCandidates.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidates: extractedCandidates,
        source_url: formattedUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting candidates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
