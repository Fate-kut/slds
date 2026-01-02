/**
 * DeskInterface Component
 * Simulates a smart desk with two modes: Normal and Exam
 * Shows available actions and restrictions based on current mode
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { ResearchBrowser } from './ResearchBrowser';
import { useApp } from '@/contexts/AppContext';
import { 
  Monitor, 
  Search, 
  FileText, 
  BookOpen, 
  Globe, 
  Ban,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * DeskInterface Component
 * Displays the smart desk UI with mode-specific actions
 */
export const DeskInterface: React.FC = () => {
  const { examMode, performResearch, performExamAction } = useApp();
  const [lastAction, setLastAction] = useState<{ success: boolean; message: string } | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);

  /**
   * Handle research action button click
   * Opens the real research browser if not in exam mode
   */
  const handleResearch = () => {
    const result = performResearch();
    setLastAction(result);
    
    if (result.success) {
      setShowBrowser(true);
      toast.success('Research Access Granted', {
        description: 'Opening academic browser...',
      });
    } else {
      toast.error('Action Blocked', {
        description: 'Research is disabled during exam mode.',
      });
    }
  };

  /**
   * Handle exam action button click
   * Always allowed regardless of mode
   */
  const handleExamAction = () => {
    const result = performExamAction();
    setLastAction(result);
    toast.success('Exam Action Completed', {
      description: 'Your exam action was processed successfully.',
    });
  };

  return (
    <Card className="overflow-hidden">
      {/* Mode indicator header */}
      <div 
        className={cn(
          'p-4 flex items-center justify-between',
          examMode 
            ? 'bg-warning/10 border-b border-warning/20' 
            : 'bg-primary/5 border-b border-primary/10'
        )}
      >
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              examMode ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
            )}
          >
            <Monitor size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Smart Desk Terminal</h3>
            <p className="text-sm text-muted-foreground">
              {examMode ? 'Restricted access - Exam in progress' : 'Full access - Normal operation'}
            </p>
          </div>
        </div>
        <StatusBadge 
          variant={examMode ? 'exam' : 'normal'} 
          size="lg"
        />
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Exam mode warning banner */}
        {examMode && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg animate-fade-in">
            <AlertCircle className="text-warning flex-shrink-0 mt-0.5\" size={20} />
            <div>
              <h4 className="font-medium text-warning">Exam Mode Active</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Non-academic features are temporarily disabled. Only exam-related actions are permitted.
                Contact your teacher if you need assistance.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Research action - blocked in exam mode */}
          <div 
            className={cn(
              'p-4 rounded-lg border-2 transition-all duration-200',
              examMode 
                ? 'border-dashed border-muted bg-muted/30 opacity-60' 
                : 'border-primary/20 bg-card hover:border-primary/40 hover:shadow-md'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe 
                  size={18} 
                  className={examMode ? 'text-muted-foreground' : 'text-primary'} 
                />
                <span className="font-medium">Research Access</span>
              </div>
              {examMode && (
                <Ban size={16} className="text-danger" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Browse academic databases, journals, and online research resources.
            </p>
            <Button 
              onClick={handleResearch}
              disabled={examMode}
              variant={examMode ? 'secondary' : 'default'}
              className="w-full"
            >
              <Search size={16} className="mr-2" />
              {examMode ? 'Blocked During Exam' : 'Start Research'}
            </Button>
          </div>

          {/* Exam action - always allowed */}
          <div 
            className={cn(
              'p-4 rounded-lg border-2 transition-all duration-200',
              'border-success/20 bg-card hover:border-success/40 hover:shadow-md'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-success" />
                <span className="font-medium">Exam Tools</span>
              </div>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Access exam-specific tools, submit answers, and view exam materials.
            </p>
            <Button 
              onClick={handleExamAction}
              variant="outline"
              className="w-full border-success/30 hover:bg-success/10 hover:text-success"
            >
              <BookOpen size={16} className="mr-2" />
              Access Exam Tools
            </Button>
          </div>
        </div>

        {/* Last action feedback */}
        {lastAction && (
          <div 
            className={cn(
              'p-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in',
              lastAction.success 
                ? 'bg-success/10 text-success' 
                : 'bg-danger/10 text-danger'
            )}
          >
            {lastAction.success ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{lastAction.message}</span>
          </div>
        )}
      </CardContent>

      {/* Research browser overlay - real web access */}
      {showBrowser && (
        <ResearchBrowser onClose={() => setShowBrowser(false)} />
      )}
    </Card>
  );
};

export default DeskInterface;
