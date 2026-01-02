/**
 * SimulatedBrowser Component
 * A fake browser interface for research access within the SLDS
 * Allows students to "browse" academic resources in normal mode
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Home,
  Search,
  BookOpen,
  GraduationCap,
  FileText,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulatedBrowserProps {
  onClose: () => void;
}

// Mock academic websites/resources
const ACADEMIC_SITES = [
  {
    id: 'home',
    title: 'SLDS Research Portal',
    url: 'slds://research-portal',
    content: 'home',
  },
  {
    id: 'library',
    title: 'Digital Library - Academic Journals',
    url: 'slds://digital-library',
    content: 'library',
  },
  {
    id: 'encyclopedia',
    title: 'Academic Encyclopedia',
    url: 'slds://encyclopedia',
    content: 'encyclopedia',
  },
  {
    id: 'papers',
    title: 'Research Papers Database',
    url: 'slds://research-papers',
    content: 'papers',
  },
];

/**
 * SimulatedBrowser Component
 * Renders a browser-like interface for academic research
 */
export const SimulatedBrowser: React.FC<SimulatedBrowserProps> = ({ onClose }) => {
  const [currentSite, setCurrentSite] = useState(ACADEMIC_SITES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<string[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);

  /**
   * Navigate to a specific site
   */
  const navigateTo = (siteId: string) => {
    const site = ACADEMIC_SITES.find(s => s.id === siteId);
    if (site) {
      setCurrentSite(site);
      const newHistory = [...history.slice(0, historyIndex + 1), siteId];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  /**
   * Go back in history
   */
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const site = ACADEMIC_SITES.find(s => s.id === history[newIndex]);
      if (site) setCurrentSite(site);
    }
  };

  /**
   * Go forward in history
   */
  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const site = ACADEMIC_SITES.find(s => s.id === history[newIndex]);
      if (site) setCurrentSite(site);
    }
  };

  /**
   * Handle search submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Simulate a search result page
      setCurrentSite({
        id: 'search',
        title: `Search Results: ${searchQuery}`,
        url: `slds://search?q=${encodeURIComponent(searchQuery)}`,
        content: 'search',
      });
    }
  };

  /**
   * Render page content based on current site
   */
  const renderContent = () => {
    switch (currentSite.content) {
      case 'home':
        return (
          <div className="p-6 space-y-6">
            <div className="text-center py-8">
              <GraduationCap size={48} className="mx-auto text-primary mb-4" />
              <h1 className="text-2xl font-bold mb-2">SLDS Research Portal</h1>
              <p className="text-muted-foreground">Access academic resources and research materials</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigateTo('library')}
              >
                <BookOpen className="text-primary mb-2" size={24} />
                <h3 className="font-semibold">Digital Library</h3>
                <p className="text-sm text-muted-foreground">Access journals and publications</p>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigateTo('encyclopedia')}
              >
                <Search className="text-primary mb-2" size={24} />
                <h3 className="font-semibold">Encyclopedia</h3>
                <p className="text-sm text-muted-foreground">Look up academic topics</p>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigateTo('papers')}
              >
                <FileText className="text-primary mb-2" size={24} />
                <h3 className="font-semibold">Research Papers</h3>
                <p className="text-sm text-muted-foreground">Browse scholarly articles</p>
              </Card>
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="p-6 space-y-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="text-primary" />
              Digital Library
            </h1>
            <div className="space-y-3">
              {['Nature Scientific Reports', 'Journal of Computer Science', 'Mathematics Today', 'Physics Review Letters'].map((journal, i) => (
                <Card key={i} className="p-4 hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{journal}</h3>
                      <p className="text-sm text-muted-foreground">Latest Volume - {2024 - i} Issues Available</p>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'encyclopedia':
        return (
          <div className="p-6 space-y-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Search className="text-primary" />
              Academic Encyclopedia
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Biology', 'Chemistry', 'Physics', 'Mathematics', 'History', 'Literature', 'Computer Science', 'Economics'].map((topic, i) => (
                <Card key={i} className="p-3 text-center hover:bg-primary/10 cursor-pointer">
                  <span className="text-sm font-medium">{topic}</span>
                </Card>
              ))}
            </div>
            <Card className="p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Select a topic above to explore articles, definitions, and learning resources.
              </p>
            </Card>
          </div>
        );

      case 'papers':
        return (
          <div className="p-6 space-y-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-primary" />
              Research Papers Database
            </h1>
            <div className="space-y-3">
              {[
                { title: 'Machine Learning in Education', authors: 'Smith et al.', year: 2024 },
                { title: 'Quantum Computing Fundamentals', authors: 'Johnson & Lee', year: 2023 },
                { title: 'Climate Change Analysis', authors: 'Anderson et al.', year: 2024 },
                { title: 'Neural Network Architectures', authors: 'Chen & Williams', year: 2023 },
              ].map((paper, i) => (
                <Card key={i} className="p-4 hover:bg-muted/50 cursor-pointer">
                  <h3 className="font-medium text-primary">{paper.title}</h3>
                  <p className="text-sm text-muted-foreground">{paper.authors} • {paper.year}</p>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="p-6 space-y-4">
            <h1 className="text-xl font-bold">Search Results for "{searchQuery}"</h1>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 hover:bg-muted/50 cursor-pointer">
                  <h3 className="font-medium text-primary">Result {i}: {searchQuery} in Academic Context</h3>
                  <p className="text-sm text-muted-foreground">
                    Relevant academic content about {searchQuery}...
                  </p>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl h-[80vh] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Browser chrome / toolbar */}
        <div className="bg-muted/50 border-b p-2 space-y-2">
          {/* Top bar with close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-danger" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">SLDS Secure Browser</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X size={14} />
            </Button>
          </div>
          
          {/* Navigation bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                disabled={historyIndex === 0}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goForward}
                disabled={historyIndex >= history.length - 1}
                className="h-8 w-8 p-0"
              >
                <ArrowRight size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateTo('home')}
                className="h-8 w-8 p-0"
              >
                <Home size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentSite({...currentSite})}
                className="h-8 w-8 p-0"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
            
            {/* URL bar */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center bg-background rounded-lg border px-3 py-1.5">
                <span className="text-xs text-muted-foreground truncate">
                  {currentSite.url}
                </span>
              </div>
              <Input
                type="text"
                placeholder="Search academic resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-8 text-sm"
              />
              <Button type="submit" size="sm" className="h-8">
                <Search size={14} />
              </Button>
            </form>
          </div>
        </div>
        
        {/* Browser content area */}
        <div className="flex-1 overflow-auto bg-background">
          {renderContent()}
        </div>
        
        {/* Status bar */}
        <div className="bg-muted/30 border-t px-3 py-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>🔒 Secure Connection</span>
          <span>{currentSite.title}</span>
        </div>
      </div>
    </div>
  );
};

export default SimulatedBrowser;
