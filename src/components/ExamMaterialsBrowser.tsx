/**
 * ExamMaterialsBrowser Component
 * Provides access to exam materials and educational tools from the web
 * Uses Firecrawl API to search and display relevant content
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Search, 
  BookOpen, 
  FileText, 
  Calculator, 
  Clock,
  ExternalLink,
  Loader2,
  ChevronLeft,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  FlaskConical,
  BookText,
  History,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { Badge } from '@/components/ui/badge';

type SubjectCategory = 'all' | 'math' | 'science' | 'english' | 'history';

const subjectCategories: { id: SubjectCategory; name: string; icon: React.ReactNode; keywords: string }[] = [
  { id: 'all', name: 'All Subjects', icon: <BookOpen size={14} />, keywords: '' },
  { id: 'math', name: 'Math', icon: <Calculator size={14} />, keywords: 'mathematics algebra calculus geometry statistics' },
  { id: 'science', name: 'Science', icon: <FlaskConical size={14} />, keywords: 'science physics chemistry biology' },
  { id: 'english', name: 'English', icon: <BookText size={14} />, keywords: 'english literature grammar writing essay' },
  { id: 'history', name: 'History', icon: <History size={14} />, keywords: 'history historical events civilization' },
];

type ExamMaterialsBrowserProps = {
  onClose: () => void;
};

type SearchResult = {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
};

type ViewMode = 'home' | 'results' | 'reading';

type QuickAccessTool = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  searchQuery: string;
};

const quickAccessTools: QuickAccessTool[] = [
  {
    id: 'formulas',
    name: 'Math Formulas',
    description: 'Mathematical formulas and equations reference',
    icon: <Calculator className="text-primary" size={20} />,
    searchQuery: 'math formulas cheat sheet algebra calculus geometry',
  },
  {
    id: 'periodic',
    name: 'Periodic Table',
    description: 'Interactive periodic table of elements',
    icon: <GraduationCap className="text-success" size={20} />,
    searchQuery: 'periodic table elements chemistry reference',
  },
  {
    id: 'essay-tips',
    name: 'Essay Writing Tips',
    description: 'Structure and writing guidelines',
    icon: <FileText className="text-warning" size={20} />,
    searchQuery: 'essay writing tips structure academic writing guide',
  },
  {
    id: 'study-techniques',
    name: 'Study Techniques',
    description: 'Effective study and memorization methods',
    icon: <Lightbulb className="text-accent" size={20} />,
    searchQuery: 'effective study techniques memorization methods',
  },
];

export const ExamMaterialsBrowser: React.FC<ExamMaterialsBrowserProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentContent, setCurrentContent] = useState<SearchResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory>('all');

  /**
   * Search for exam materials using Firecrawl
   */
  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setViewMode('results');

    try {
      // Add educational context and subject filter to searches
      const subjectKeywords = subjectCategories.find(s => s.id === selectedSubject)?.keywords || '';
      const educationalQuery = `${searchTerm} ${subjectKeywords} educational resource study guide`.trim();
      const response = await firecrawlApi.search(educationalQuery, {
        limit: 8,
        scrapeOptions: { formats: ['markdown'] },
      });

      if (response.success && response.data) {
        setResults(response.data);
        if (response.data.length === 0) {
          setError('No materials found. Try different keywords.');
        }
      } else {
        setError(response.error || 'Failed to search for materials');
        toast.error('Search failed', { description: response.error });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      toast.error('Search Error', { description: 'Could not connect to search service' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open a specific result and display its content
   */
  const openResult = async (result: SearchResult) => {
    if (result.markdown) {
      setCurrentContent(result);
      setViewMode('reading');
      return;
    }

    setIsLoading(true);
    try {
      const response = await firecrawlApi.scrape(result.url, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      if (response.success && response.data) {
        // Handle nested data structure from Firecrawl API
        const scrapeData = response.data as any;
        const markdownContent = scrapeData.markdown || scrapeData.data?.markdown || 'No content available';
        const content = {
          ...result,
          markdown: markdownContent,
        };
        setCurrentContent(content);
        setViewMode('reading');
      } else {
        toast.error('Failed to load content', { description: response.error });
      }
    } catch (err) {
      console.error('Scrape error:', err);
      toast.error('Load Error', { description: 'Could not load the material' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate back in the browser
   */
  const goBack = () => {
    if (viewMode === 'reading') {
      setViewMode('results');
      setCurrentContent(null);
    } else if (viewMode === 'results') {
      setViewMode('home');
      setResults([]);
      setSearchQuery('');
      setSelectedSubject('all');
    }
  };

  /**
   * Render the home view with quick access tools
   */
  const renderHome = () => (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-4">
          <GraduationCap className="text-success" size={32} />
        </div>
        <h2 className="text-xl font-semibold">Exam Materials & Tools</h2>
        <p className="text-muted-foreground mt-2">
          Access educational resources, study guides, and reference materials
        </p>
      </div>

      {/* Subject filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter size={14} />
          <span>Filter by subject:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {subjectCategories.map((subject) => (
            <Badge
              key={subject.id}
              variant={selectedSubject === subject.id ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors flex items-center gap-1.5 px-3 py-1.5',
                selectedSubject === subject.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              )}
              onClick={() => setSelectedSubject(subject.id)}
            >
              {subject.icon}
              {subject.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={`Search ${selectedSubject === 'all' ? 'all' : selectedSubject} materials...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={() => handleSearch()} disabled={isLoading}>
          <Search size={16} className="mr-2" />
          Search
        </Button>
      </div>

      {/* Quick access tools */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Access Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickAccessTools.map((tool) => (
            <Card 
              key={tool.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => {
                setSearchQuery(tool.name);
                handleSearch(tool.searchQuery);
              }}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{tool.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Render search results
   */
  const renderResults = () => (
    <ScrollArea className="h-[400px]">
      <div className="p-4 space-y-3">
        {results.map((result, idx) => (
          <Card
            key={idx}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => openResult(result)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1">{result.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {result.description || 'Click to view content'}
                  </p>
                  <p className="text-xs text-primary/60 mt-2 truncate">{result.url}</p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );

  /**
   * Render content reading view
   */
  const renderReading = () => (
    <ScrollArea className="h-[400px]">
      <div className="p-4">
        <div className="mb-4 pb-4 border-b">
          <h2 className="font-semibold">{currentContent?.title}</h2>
          <a 
            href={currentContent?.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
          >
            {currentContent?.url}
            <ExternalLink size={12} />
          </a>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {currentContent?.markdown?.split('\n').map((line, idx) => {
            if (line.startsWith('# ')) {
              return <h1 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
            } else if (line.startsWith('## ')) {
              return <h2 key={idx} className="text-lg font-semibold mt-3 mb-2">{line.slice(3)}</h2>;
            } else if (line.startsWith('### ')) {
              return <h3 key={idx} className="text-base font-medium mt-2 mb-1">{line.slice(4)}</h3>;
            } else if (line.startsWith('- ')) {
              return <li key={idx} className="ml-4">{line.slice(2)}</li>;
            } else if (line.trim()) {
              return <p key={idx} className="my-2 text-sm leading-relaxed">{line}</p>;
            }
            return null;
          })}
        </div>
      </div>
    </ScrollArea>
  );

  /**
   * Render content based on current view mode
   */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] gap-4">
          <Loader2 className="animate-spin text-success" size={32} />
          <p className="text-muted-foreground">Loading materials...</p>
        </div>
      );
    }

    if (error && viewMode === 'results') {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] gap-4 text-center p-4">
          <BookOpen className="text-muted-foreground" size={48} />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={goBack}>
            Go Back
          </Button>
        </div>
      );
    }

    switch (viewMode) {
      case 'home':
        return renderHome();
      case 'results':
        return renderResults();
      case 'reading':
        return renderReading();
      default:
        return renderHome();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b bg-card">
          {viewMode !== 'home' && (
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ChevronLeft size={16} className="mr-1" />
              Back
            </Button>
          )}
          
          <div className="flex-1 flex items-center gap-2">
            <CheckCircle2 className="text-success" size={18} />
            <span className="text-sm font-medium">Exam Materials Browser</span>
          </div>

          {viewMode !== 'home' && (
            <div className="flex-1 max-w-md mx-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-sm h-8"
                />
                <Button size="sm" onClick={() => handleSearch()} disabled={isLoading}>
                  <Search size={14} />
                </Button>
              </div>
            </div>
          )}

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden bg-background">
          {renderContent()}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-card text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>Exam-approved resources only</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={12} className="text-success" />
            <span>Safe browsing mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamMaterialsBrowser;
