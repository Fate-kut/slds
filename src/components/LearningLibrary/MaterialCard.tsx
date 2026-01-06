/**
 * MaterialCard - Individual learning material card with download/open controls
 * Optimized with React.memo for performance
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  Check,
  RefreshCw,
  Trash2,
  Eye,
  CloudOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DownloadProgress {
  materialId: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  version: number;
  created_at: string;
  updated_at: string;
  subjects: Subject | null;
}

interface MaterialCardProps {
  material: Material;
  isDownloaded: boolean;
  downloadProgress?: DownloadProgress;
  hasUpdate: boolean;
  onDownload: () => void;
  onOpen: () => void;
  onRemove: () => void;
  isOnline: boolean;
}

// Memoized format function
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// File icon component for better performance
const FileIcon = memo(({ fileType }: { fileType: string }) => {
  const colorClass = useMemo(() => {
    switch (fileType) {
      case 'pdf': return 'text-red-500';
      case 'slides': return 'text-orange-500';
      case 'notes': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  }, [fileType]);

  return <FileText className={cn('h-8 w-8', colorClass)} />;
});
FileIcon.displayName = 'FileIcon';

// Status badges component
const StatusBadges = memo(({ 
  isDownloaded, 
  hasUpdate, 
  isOnline 
}: { 
  isDownloaded: boolean; 
  hasUpdate: boolean; 
  isOnline: boolean;
}) => (
  <div className="absolute top-2 right-2 flex gap-1">
    {isDownloaded && !hasUpdate && (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Check className="h-3 w-3" />
        Offline
      </Badge>
    )}
    {hasUpdate && (
      <Badge variant="default" className="gap-1 text-xs animate-pulse">
        <RefreshCw className="h-3 w-3" />
        Update
      </Badge>
    )}
    {!isOnline && !isDownloaded && (
      <Badge variant="outline" className="gap-1 text-xs">
        <CloudOff className="h-3 w-3" />
        Unavailable
      </Badge>
    )}
  </div>
));
StatusBadges.displayName = 'StatusBadges';

export const MaterialCard: React.FC<MaterialCardProps> = memo(({
  material,
  isDownloaded,
  downloadProgress,
  hasUpdate,
  onDownload,
  onOpen,
  onRemove,
  isOnline,
}) => {
  const isDownloading = downloadProgress?.status === 'downloading';
  const downloadFailed = downloadProgress?.status === 'failed';

  const formattedSize = useMemo(() => formatBytes(material.file_size), [material.file_size]);

  const handleOpen = useCallback(() => onOpen(), [onOpen]);
  const handleDownload = useCallback(() => onDownload(), [onDownload]);
  const handleRemove = useCallback(() => onRemove(), [onRemove]);

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-md group',
        isDownloaded && 'border-primary/30 bg-primary/5',
        downloadFailed && 'border-destructive/30',
        isDownloading && 'animate-pulse'
      )}
    >
      <StatusBadges isDownloaded={isDownloaded} hasUpdate={hasUpdate} isOnline={isOnline} />

      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
            <FileIcon fileType={material.file_type} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 pr-16">{material.title}</h3>
            {material.subjects && (
              <Badge variant="outline" className="mt-1 text-xs">
                {material.subjects.name}
              </Badge>
            )}
            {material.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {material.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{formattedSize}</span>
              <span>•</span>
              <span className="capitalize">{material.file_type}</span>
              <span>•</span>
              <span>v{material.version}</span>
            </div>
          </div>
        </div>

        {/* Download progress */}
        {isDownloading && (
          <div className="mt-3">
            <Progress value={downloadProgress?.progress || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Downloading...
            </p>
          </div>
        )}

        {/* Download failed */}
        {downloadFailed && (
          <div className="mt-3 flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="h-4 w-4" />
            Download failed. Try again.
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {isDownloaded || (!isOnline && !isDownloaded) ? (
          <>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleOpen}
              disabled={!isDownloaded && !isOnline}
            >
              <Eye className="h-4 w-4 mr-1" />
              {isDownloaded ? 'Open' : 'Unavailable'}
            </Button>
            {isDownloaded && (
              <>
                {hasUpdate && isOnline && (
                  <Button size="sm" variant="outline" onClick={handleDownload} title="Update">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handleRemove} title="Remove offline">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={handleDownload}
            disabled={isDownloading || !isOnline}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Download for Offline
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});

MaterialCard.displayName = 'MaterialCard';

export default MaterialCard;
