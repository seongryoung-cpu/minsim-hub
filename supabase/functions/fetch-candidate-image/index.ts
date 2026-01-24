import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
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
        limit: 3,
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

    // Find Namuwiki URL from search results
    const namuwikiResult = searchData.data?.find((result: any) => 
      result.url?.includes('namu.wiki')
    );

    if (!namuwikiResult) {
      console.log('No Namuwiki result found');
      return new Response(
        JSON.stringify({ success: false, error: 'No Namuwiki page found for this candidate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found Namuwiki URL:', namuwikiResult.url);

    // Scrape the Namuwiki page to get the image
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: namuwikiResult.url,
        formats: ['html', 'links'],
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

    // Extract image URL from HTML
    const html = scrapeData.data?.html || '';
    
    // Look for profile images in Namuwiki format
    // Namuwiki uses various image hosting patterns
    const imagePatterns = [
      // Namuwiki CDN images
      /https?:\/\/[^"'\s]+\.namu\.wiki\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi,
      // Direct image links in wiki content
      /https?:\/\/w\.namu\.la\/s\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi,
      // Alternative Namuwiki image URLs
      /https?:\/\/namu\.wiki\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi,
    ];

    let imageUrl: string | null = null;

    for (const pattern of imagePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out icons, logos, and small images
        const validImage = matches.find((url: string) => 
          !url.includes('icon') && 
          !url.includes('logo') && 
          !url.includes('favicon') &&
          !url.includes('thumb') &&
          !url.includes('20px') &&
          !url.includes('16px')
        );
        if (validImage) {
          imageUrl = validImage;
          break;
        }
      }
    }

    // If no image found in patterns, try to find any large image
    if (!imageUrl) {
      const allImages = html.match(/https?:\/\/[^"'\s<>]+\.(jpg|jpeg|png|gif|webp)/gi);
      if (allImages && allImages.length > 0) {
        // Get the first non-icon image
        imageUrl = allImages.find((url: string) => 
          !url.includes('icon') && 
          !url.includes('logo') && 
          !url.includes('favicon') &&
          url.length > 30 // Filter out short URLs which are likely icons
        ) || null;
      }
    }

    if (!imageUrl) {
      console.log('No suitable image found on page');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No image found on Namuwiki page',
          namuwiki_url: namuwikiResult.url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found image URL:', imageUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: imageUrl,
        namuwiki_url: namuwikiResult.url,
        source: 'namuwiki'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching candidate image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
