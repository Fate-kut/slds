/// <reference types="vite-plugin-pwa/client" />

/**
 * Update Prompt Component
 * Shows when a new version of the app is available
 */

import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UpdatePromptProps {
  className?: string;
}

export function UpdatePrompt({ className }: UpdatePromptProps) {
  const [dismissed, setDismissed] = useState(false);
  
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setDismissed(false);
    }
  }, [needRefresh]);

  if (!needRefresh || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm w-full',
        'bg-card border border-border rounded-lg shadow-xl p-4',
        'animate-fade-in',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">Update Available</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            A new version of SLDS is available. Refresh to get the latest features.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => updateServiceWorker(true)}
              className="h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8"
            >
              Later
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default UpdatePrompt;
