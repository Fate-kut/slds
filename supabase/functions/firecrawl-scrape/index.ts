/**
 * Firecrawl Scrape Edge Function
 * Scrapes content from a specific URL using Firecrawl API
 * Requires authentication
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates that a URL is public (not private IP, localhost, or cloud metadata)
 */
function isPublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTPS for security
    if (url.protocol !== 'https:') return false;
    
    const hostname = url.hostname.toLowerCase();
    
    // Block private IP ranges, localhost, and cloud metadata endpoints
    const blockedPatterns = [
      /^127\./,                              // 127.0.0.0/8 (localhost)
      /^10\./,                               // 10.0.0.0/8 (private)
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,     // 172.16.0.0/12 (private)
      /^192\.168\./,                         // 192.168.0.0/16 (private)
      /^169\.254\./,                         // 169.254.0.0/16 (link-local, AWS metadata)
      /^localhost$/i,
      /^0\.0\.0\.0$/,
      /^\[?::1\]?$/,                         // IPv6 localhost
      /^\[?fe80:/i,                          // IPv6 link-local
      /^metadata\.google\.internal$/i,       // GCP metadata
      /^.*\.internal$/i,                     // Internal domains
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token with Supabase - pass auth header to client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'User not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { url, options } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format and validate URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Basic URL validation
    try {
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // URL length check
    if (formattedUrl.length > 2000) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF protection: Block private IPs, localhost, and cloud metadata
    if (!isPublicUrl(formattedUrl)) {
      console.warn('Blocked SSRF attempt by user', user.id, 'to:', formattedUrl.substring(0, 100));
      return new Response(
        JSON.stringify({ success: false, error: 'URL not allowed. Only public HTTPS URLs are permitted.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User', user.id, 'scraping URL:', formattedUrl.substring(0, 100));

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: options?.formats || ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scrape successful for user', user.id);
    return new Response(
      JSON.stringify({ success: true, data: data.data || data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
