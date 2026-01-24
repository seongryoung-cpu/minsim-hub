import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageOption {
  url: string;
  source: string;
  source_url?: string;
}

interface CandidateInfo {
  image_url?: string;
  image_options?: ImageOption[];
  birth_date?: string;
  age?: number;
  education?: string;
  careers?: { period: string; title: string; organization: string }[];
  summary?: string;
  namuwiki_url?: string;
}

async function searchImages(query: string, apiKey: string): Promise<ImageOption[]> {
  const images: ImageOption[] = [];
  
  try {
    // Search Google Images via Firecrawl search
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${query} 사진`,
        limit: 10,
        lang: 'ko',
        country: 'KR',
      }),
    });

    const searchData = await searchResponse.json();
    
    if (searchResponse.ok && searchData.success && searchData.data) {
      // Extract image URLs from search results
      for (const result of searchData.data) {
        const url = result.url || '';
        const title = result.title || '';
        
        // Skip non-relevant pages
        if (url.includes('youtube.com') || url.includes('twitter.com') || url.includes('facebook.com')) {
          continue;
        }
        
        // Determine source name
        let sourceName = '웹';
        if (url.includes('namu.wiki')) sourceName = '나무위키';
        else if (url.includes('wikipedia.org')) sourceName = '위키피디아';
        else if (url.includes('naver.com')) sourceName = '네이버';
        else if (url.includes('daum.net')) sourceName = '다음';
        else if (url.includes('.go.kr')) sourceName = '공공기관';
        
        // Try to scrape for images
        try {
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url,
              formats: ['html'],
              onlyMainContent: true,
            }),
          });

          const scrapeData = await scrapeResponse.json();
          
          if (scrapeResponse.ok && scrapeData.success) {
            const html = scrapeData.data?.html || '';
            
            // Extract image URLs from HTML
            const imagePatterns = [
              /https?:\/\/i\.namu\.wiki\/i\/[^"'\s<>]+\.(jpg|jpeg|png|gif|webp)/gi,
              /https?:\/\/w\.namu\.la\/s\/[^"'\s<>]+\.(jpg|jpeg|png|gif|webp)/gi,
              /https?:\/\/upload\.wikimedia\.org\/[^"'\s<>]+\.(jpg|jpeg|png|gif|webp)/gi,
              /https?:\/\/[^"'\s<>]+\.pstatic\.net\/[^"'\s<>]+\.(jpg|jpeg|png|gif|webp)/gi,
              /https?:\/\/[^"'\s<>]+\.(jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi,
            ];

            for (const pattern of imagePatterns) {
              const matches = html.match(pattern);
              if (matches) {
                for (const imgUrl of matches) {
                  // Filter out small/icon images
                  if (
                    !imgUrl.includes('icon') && 
                    !imgUrl.includes('logo') && 
                    !imgUrl.includes('favicon') &&
                    !imgUrl.includes('20px') &&
                    !imgUrl.includes('16px') &&
                    !imgUrl.includes('thumb/') &&
                    imgUrl.length > 50 &&
                    !images.some(img => img.url === imgUrl)
                  ) {
                    images.push({
                      url: imgUrl,
                      source: sourceName,
                      source_url: url
                    });
                    
                    // Limit images per source
                    if (images.filter(img => img.source === sourceName).length >= 3) {
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.log('Error scraping:', url, e);
        }
        
        // Limit total images
        if (images.length >= 8) break;
      }
    }
  } catch (e) {
    console.error('Error searching images:', e);
  }
  
  return images;
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

    // Search for images from multiple sources
    const searchQuery = party ? `${name} ${party} 정치인` : `${name} 정치인`;
    console.log('Searching images for:', searchQuery);
    
    const imageOptions = await searchImages(searchQuery, FIRECRAWL_API_KEY);
    console.log('Found image options:', imageOptions.length);

    // Search for candidate on Namuwiki for bio info
    const namuwikiQuery = `${searchQuery} site:namu.wiki`;
    console.log('Searching Namuwiki for:', namuwikiQuery);

    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: namuwikiQuery,
        limit: 5,
        lang: 'ko',
        country: 'KR',
      }),
    });

    const searchData = await searchResponse.json();

    let extractedInfo: CandidateInfo = {
      image_options: imageOptions,
      image_url: imageOptions.length > 0 ? imageOptions[0].url : undefined
    };

    if (searchResponse.ok && searchData.success) {
      // Find direct Namuwiki page for the person
      const namuwikiResult = searchData.data?.find((result: any) => {
        const url = result.url || '';
        return url.includes('namu.wiki/w/') && 
               !url.includes('%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%EC%9E%A5') &&
               !url.includes('/분류:') &&
               !url.includes('/역대');
      });

      if (namuwikiResult) {
        console.log('Found Namuwiki URL:', namuwikiResult.url);
        extractedInfo.namuwiki_url = namuwikiResult.url;

        // Scrape for bio info
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: namuwikiResult.url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (scrapeResponse.ok && scrapeData.success) {
          const markdown = scrapeData.data?.markdown || '';
          console.log('Markdown length:', markdown.length);

          // Use AI to extract structured information
          const systemPrompt = `당신은 나무위키 문서에서 정치인 정보를 추출하는 전문가입니다.
주어진 문서 내용에서 다음 정보를 정확하게 추출해주세요:

1. birth_date: 생년월일 (YYYY-MM-DD 형식)
2. age: 현재 나이 (숫자만, 만 나이 기준)
3. education: 최종 학력
4. careers: 주요 경력 배열 (최대 10개)
   - period: 기간 (예: "2006~2011", "2021~현재")
   - title: 직책
   - organization: 소속
5. summary: 인물 요약 (2-3문장)

중요: 실제 문서 정보만 추출, 없으면 null 반환`;

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
                { role: 'user', content: `"${name}" 정치인 정보 추출:\n\n${markdown.substring(0, 25000)}` }
              ],
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'extract_politician_info',
                    description: '정치인 정보 추출',
                    parameters: {
                      type: 'object',
                      properties: {
                        birth_date: { type: 'string' },
                        age: { type: 'number' },
                        education: { type: 'string' },
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
                        summary: { type: 'string' }
                      }
                    }
                  }
                }
              ],
              tool_choice: { type: 'function', function: { name: 'extract_politician_info' } }
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
            
            if (toolCalls && toolCalls.length > 0) {
              const functionArgs = toolCalls[0].function?.arguments;
              if (functionArgs) {
                try {
                  const parsed = JSON.parse(functionArgs);
                  extractedInfo = {
                    ...extractedInfo,
                    birth_date: parsed.birth_date,
                    age: parsed.age,
                    education: parsed.education,
                    careers: parsed.careers,
                    summary: parsed.summary,
                  };
                } catch (e) {
                  console.error('Failed to parse AI response:', e);
                }
              }
            }
          }
        }
      }
    }

    console.log('Final result:', JSON.stringify({
      has_image_options: extractedInfo.image_options?.length || 0,
      has_careers: extractedInfo.careers?.length || 0,
      has_education: !!extractedInfo.education
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...extractedInfo,
        source: 'multi'
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
