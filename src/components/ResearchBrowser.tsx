/**
 * ResearchBrowser Component
 * Real web browser interface for academic research
 * Uses Firecrawl API to search and display web content
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { 
  X, 
  ArrowLeft, 
  Search,
  Loader2,
  ExternalLink,
  Globe,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ResearchBrowserProps {
  onClose: () => void;
}

type SearchResult = {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
};

type ViewMode = 'home' | 'results' | 'reading';

/**
 * ResearchBrowser Component
 * Provides real internet search and content viewing for research
 */
export const ResearchBrowser: React.FC<ResearchBrowserProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentContent, setCurrentContent] = useState<{ title: string; markdown: string; url: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [error, setError] = useState<string | null>(null);

  /**
   * Perform web search using Firecrawl
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await firecrawlApi.search(searchQuery, {
        limit: 10,
        scrapeOptions: { formats: ['markdown'] }
      });

      if (response.success && response.data) {
        setResults(response.data);
        setViewMode('results');
        if (response.data.length === 0) {
          toast.info('No results found', { description: 'Try a different search query.' });
        }
      } else {
        setError(response.error || 'Search failed');
        toast.error('Search failed', { description: response.error || 'Please try again.' });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to connect to search service');
      toast.error('Connection error', { description: 'Could not connect to search service.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open and read a specific search result
   */
  const openResult = async (result: SearchResult) => {
    // If we already have markdown content from search, use it
    if (result.markdown) {
      setCurrentContent({
        title: result.title,
        markdown: result.markdown,
        url: result.url
      });
      setViewMode('reading');
      return;
    }

    // Otherwise scrape the page
    setIsLoading(true);
    try {
      const response = await firecrawlApi.scrape(result.url);
      
      if (response.success && response.data) {
        setCurrentContent({
          title: response.data.metadata?.title || result.title,
          markdown: response.data.markdown || 'No content available',
          url: result.url
        });
        setViewMode('reading');
      } else {
        toast.error('Could not load page', { description: response.error });
      }
    } catch (err) {
      console.error('Scrape error:', err);
      toast.error('Failed to load page');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Go back to previous view
   */
  const goBack = () => {
    if (viewMode === 'reading') {
      setViewMode('results');
      setCurrentContent(null);
    } else if (viewMode === 'results') {
      setViewMode('home');
      setResults([]);
    }
  };

  /**
   * Render content based on current view mode
   */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {viewMode === 'home' ? 'Searching the web...' : 'Loading content...'}
            </p>
          </div>
        </div>
      );
    }

    if (error && viewMode === 'home') {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => setError(null)}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    switch (viewMode) {
      case 'home':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <Globe size={48} className="mx-auto text-primary mb-4" />
              <h1 className="text-2xl font-bold mb-2">SLDS Research Browser</h1>
              <p className="text-muted-foreground mb-6">
                Search the web for academic resources, articles, and research materials.
              </p>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search for research topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={!searchQuery.trim()}>
                  <Search size={16} className="mr-2" />
                  Search
                </Button>
              </form>
            </div>
          </div>
        );

      case 'results':
        return (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Search Results for "{searchQuery}"
                </h2>
                <span className="text-sm text-muted-foreground">
                  {results.length} results found
                </span>
              </div>
              
              {results.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No results found. Try a different search query.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <Card 
                      key={index}
                      className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => openResult(result)}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="text-primary flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-primary hover:underline truncate">
                            {result.title}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {result.url}
                          </p>
                          {result.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <ExternalLink size={16} className="text-muted-foreground flex-shrink-0" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        );

      case 'reading':
        return (
          <ScrollArea className="flex-1">
            <div className="p-6">
              {currentContent && (
                <article className="prose prose-sm dark:prose-invert max-w-none">
                  <h1 className="text-xl font-bold mb-2">{currentContent.title}</h1>
                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                    <Globe size={12} />
                    {currentContent.url}
                  </p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {currentContent.markdown}
                  </div>
                </article>
              )}
            </div>
          </ScrollArea>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl h-[85vh] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Browser toolbar */}
        <div className="bg-muted/50 border-b p-2 space-y-2">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-danger" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">SLDS Research Browser</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X size={14} />
            </Button>
          </div>
          
          {/* Navigation bar */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goBack}
              disabled={viewMode === 'home'}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft size={16} />
            </Button>
            
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center bg-background rounded-lg border px-3 py-1.5">
                <Globe size={14} className="text-muted-foreground mr-2" />
                <Input
                  type="text"
                  placeholder="Search the web..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 p-0 h-auto text-sm focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="sm" className="h-8" disabled={isLoading}>
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Browser content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {renderContent()}
        </div>
        
        {/* Status bar */}
        <div className="bg-muted/30 border-t px-3 py-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>🔒 Secure Research Mode</span>
          <span>
            {viewMode === 'home' && 'Ready to search'}
            {viewMode === 'results' && `${results.length} results`}
            {viewMode === 'reading' && 'Reading article'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResearchBrowser;
