import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandidateInfo {
  image_url?: string;
  birth_date?: string;
  age?: number;
  education?: string;
  careers?: { period: string; title: string; organization: string }[];
  summary?: string;
  namuwiki_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, party } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for candidate on Namuwiki
    const searchQuery = party ? `${name} ${party} 정치인 site:namu.wiki` : `${name} 정치인 site:namu.wiki`;
    console.log('Searching for:', searchQuery);

    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        lang: 'ko',
        country: 'KR',
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok || !searchData.success) {
      console.error('Search API error:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: 'Search failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find direct Namuwiki page for the person (not a list page)
    const namuwikiResult = searchData.data?.find((result: any) => {
      const url = result.url || '';
      // Prefer direct person pages, avoid list/category pages
      return url.includes('namu.wiki/w/') && 
             !url.includes('%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%EC%9E%A5') && // 서울특별시장
             !url.includes('/분류:') &&
             !url.includes('/역대');
    });

    if (!namuwikiResult) {
      console.log('No direct Namuwiki result found');
      return new Response(
        JSON.stringify({ success: false, error: 'No Namuwiki page found for this candidate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found Namuwiki URL:', namuwikiResult.url);

    // Scrape the Namuwiki page to get content
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: namuwikiResult.url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Scrape API error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.html || '';
    const markdown = scrapeData.data?.markdown || '';

    // Extract image URL from HTML
    const imagePatterns = [
      /https?:\/\/i\.namu\.wiki\/i\/[^"'\s<>]+\.(jpg|jpeg|png|gif|webp)/gi,
      /https?:\/\/w\.namu\.la\/s\/[^"'\s<>]+\.(jpg|jpeg|png|gif|webp)/gi,
    ];

    let imageUrl: string | null = null;
    for (const pattern of imagePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        const validImage = matches.find((url: string) => 
          !url.includes('icon') && 
          !url.includes('logo') && 
          !url.includes('favicon') &&
          !url.includes('20px') &&
          !url.includes('16px') &&
          url.length > 50
        );
        if (validImage) {
          imageUrl = validImage;
          break;
        }
      }
    }

    console.log('Found image:', imageUrl ? 'yes' : 'no');
    console.log('Markdown length:', markdown.length);

    // Use AI to extract structured information from the markdown
    const systemPrompt = `당신은 나무위키 문서에서 정치인 정보를 추출하는 전문가입니다.
주어진 문서 내용에서 다음 정보를 정확하게 추출해주세요:

1. birth_date: 생년월일 (YYYY-MM-DD 형식, 예: 1961-04-18)
2. age: 현재 나이 (숫자만, 만 나이 기준)
3. education: 최종 학력 (예: 서울대학교 법학과 졸업)
4. careers: 주요 경력 배열 (최대 10개)
   - period: 기간 (예: "2006~2011", "2021~현재")
   - title: 직책 (예: "서울특별시장", "국회의원")
   - organization: 소속 (예: "서울특별시", "국민의힘")
5. summary: 인물 요약 (2-3문장)

중요 규칙:
- 실제로 문서에 있는 정보만 추출하세요
- 추측하지 마세요. 정보가 없으면 null을 반환하세요
- 경력은 정치/공직 경력 위주로 추출하세요
- 기간이 명확하지 않은 경력은 빈 문자열로 처리하세요`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `다음 나무위키 문서에서 "${name}" 정치인의 정보를 추출해주세요:\n\n${markdown.substring(0, 25000)}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_politician_info',
              description: '나무위키 문서에서 추출한 정치인 정보',
              parameters: {
                type: 'object',
                properties: {
                  birth_date: { type: 'string', description: '생년월일 (YYYY-MM-DD)' },
                  age: { type: 'number', description: '현재 나이' },
                  education: { type: 'string', description: '최종 학력' },
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
                  summary: { type: 'string', description: '인물 요약' }
                }
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_politician_info' } }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI gateway error:', aiResponse.status);
      // Still return image even if AI fails
      if (imageUrl) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            image_url: imageUrl,
            namuwiki_url: namuwikiResult.url,
            source: 'namuwiki'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI extraction complete');

    // Parse tool call response
    let extractedInfo: CandidateInfo = {
      image_url: imageUrl || undefined,
      namuwiki_url: namuwikiResult.url
    };

    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const functionArgs = toolCalls[0].function?.arguments;
      if (functionArgs) {
        try {
          const parsed = JSON.parse(functionArgs);
          extractedInfo = {
            ...extractedInfo,
            birth_date: parsed.birth_date || undefined,
            age: parsed.age || undefined,
            education: parsed.education || undefined,
            careers: parsed.careers || undefined,
            summary: parsed.summary || undefined,
          };
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    }

    console.log('Extracted info:', JSON.stringify({
      has_image: !!extractedInfo.image_url,
      has_careers: extractedInfo.careers?.length || 0,
      has_education: !!extractedInfo.education,
      has_age: !!extractedInfo.age
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...extractedInfo,
        source: 'namuwiki'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching candidate info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
