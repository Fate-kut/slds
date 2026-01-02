/**
 * Firecrawl API Client
 * Provides methods to search and scrape the web via edge functions
 */

import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

type SearchResult = {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
};

type ScrapeResult = {
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
  };
};

type SearchOptions = {
  limit?: number;
  lang?: string;
  country?: string;
  scrapeOptions?: { formats?: ('markdown' | 'html')[] };
};

type ScrapeOptions = {
  formats?: ('markdown' | 'html' | 'links')[];
  onlyMainContent?: boolean;
  waitFor?: number;
};

/**
 * Firecrawl API methods for web searching and scraping
 */
export const firecrawlApi = {
  /**
   * Search the web and optionally scrape results
   * @param query - Search query string
   * @param options - Search options
   */
  async search(query: string, options?: SearchOptions): Promise<FirecrawlResponse<SearchResult[]>> {
    const { data, error } = await supabase.functions.invoke('firecrawl-search', {
      body: { query, options },
    });

    if (error) {
      console.error('Firecrawl search error:', error);
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Scrape a single URL for content
   * @param url - URL to scrape
   * @param options - Scrape options
   */
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse<ScrapeResult>> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      console.error('Firecrawl scrape error:', error);
      return { success: false, error: error.message };
    }
    return data;
  },
};
