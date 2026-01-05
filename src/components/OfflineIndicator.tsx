/**
 * Offline Indicator Component
 * Shows a banner when the app is offline and handles reconnection
 */

import { useEffect, useState } from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { WifiOff, RefreshCw, CloudOff, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  variant?: 'banner' | 'badge' | 'minimal';
  className?: string;
}

export function OfflineIndicator({ variant = 'banner', className }: OfflineIndicatorProps) {
  const { isOnline, isServiceWorkerReady } = useOffline();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Don't show anything if online and not recently reconnected
  if (isOnline && !showReconnected) {
    return null;
  }

  // Show reconnected message briefly
  if (showReconnected && variant === 'banner') {
    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-success text-success-foreground py-2 px-4',
          'flex items-center justify-center gap-2 animate-fade-in',
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Back online</span>
      </div>
    );
  }

  if (dismissed) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-warning text-sm',
          className
        )}
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span>Offline</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
          'bg-warning/15 text-warning border border-warning/30 text-xs font-medium',
          className
        )}
      >
        <CloudOff className="h-3 w-3" />
        <span>Offline Mode</span>
      </div>
    );
  }

  // Default banner variant
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-warning/95 text-warning-foreground py-2.5 px-4',
        'flex items-center justify-between gap-4 animate-fade-in shadow-lg',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-warning-foreground/20 rounded-full">
          <WifiOff className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">You're offline</span>
          <span className="text-xs opacity-90">
            {isServiceWorkerReady 
              ? 'Cached content is available. Some features may be limited.'
              : 'Content may not be available offline.'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-warning-foreground hover:bg-warning-foreground/20 h-8"
          onClick={handleRetry}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-warning-foreground hover:bg-warning-foreground/20 h-8 w-8 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default OfflineIndicator;
