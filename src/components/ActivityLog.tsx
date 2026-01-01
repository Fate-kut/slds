/**
 * ActivityLog Component
 * Displays a scrollable list of system activity entries
 * Shows timestamp, user, and action details
 */

import React from 'react';
import { LogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Lock, 
  Unlock, 
  FileText, 
  Search,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ActivityLogProps {
  logs: LogEntry[];
  maxHeight?: string;
  title?: string;
  className?: string;
}

/**
 * Get icon for log action type
 */
const getActionIcon = (action: string) => {
  const iconProps = { size: 14, className: 'flex-shrink-0' };
  
  if (action.includes('LOGIN')) return <LogIn {...iconProps} className="text-success" />;
  if (action.includes('LOGOUT')) return <LogOut {...iconProps} className="text-muted-foreground" />;
  if (action.includes('LOCK')) return <Lock {...iconProps} className="text-danger" />;
  if (action.includes('UNLOCK')) return <Unlock {...iconProps} className="text-success" />;
  if (action.includes('EXAM')) return <FileText {...iconProps} className="text-warning" />;
  if (action.includes('RESEARCH')) return <Search {...iconProps} className="text-primary" />;
  if (action.includes('BLOCKED')) return <AlertTriangle {...iconProps} className="text-danger" />;
  return <Activity {...iconProps} className="text-muted-foreground" />;
};

/**
 * Get background color class for log entry based on action type
 */
const getActionBgClass = (action: string): string => {
  if (action.includes('BLOCKED')) return 'bg-danger/5 border-l-danger';
  if (action.includes('EXAM_MODE_ON')) return 'bg-warning/5 border-l-warning';
  if (action.includes('EXAM_MODE_OFF')) return 'bg-success/5 border-l-success';
  if (action.includes('LOGIN')) return 'bg-success/5 border-l-success';
  if (action.includes('LOCK_ALL')) return 'bg-danger/5 border-l-danger';
  return 'bg-card border-l-border';
};

/**
 * ActivityLog Component
 * Renders a scrollable list of log entries with visual indicators
 */
export const ActivityLog: React.FC<ActivityLogProps> = ({
  logs,
  maxHeight = '400px',
  title = 'Activity Log',
  className,
}) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          {title}
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {logs.length} entries
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-1 p-4 pt-0">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity size={32} className="mx-auto mb-2 opacity-40" />
                <p>No activity recorded yet</p>
                <p className="text-sm">Actions will appear here as they occur</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'p-3 rounded-md border-l-2 transition-colors hover:bg-accent/50',
                    'animate-fade-in',
                    getActionBgClass(log.action)
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Action icon */}
                    <div className="mt-0.5">
                      {getActionIcon(log.action)}
                    </div>
                    
                    {/* Log content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.userName}</span>
                        <span 
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full',
                            log.userRole === 'teacher' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-secondary text-secondary-foreground'
                          )}
                        >
                          {log.userRole}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{log.details}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock size={10} />
                        <span>{format(log.timestamp, 'HH:mm:ss')}</span>
                        <span className="mx-1">•</span>
                        <span>{format(log.timestamp, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
