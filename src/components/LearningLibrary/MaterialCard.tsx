/**
 * MaterialCard - Individual learning material card with download/open controls
 */

import React from 'react';
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

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  isDownloaded,
  downloadProgress,
  hasUpdate,
  onDownload,
  onOpen,
  onRemove,
  isOnline,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    switch (material.file_type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'slides':
        return <FileText className="h-8 w-8 text-orange-500" />;
      case 'notes':
        return <FileText className="h-8 w-8 text-blue-500" />;
      default:
        return <FileText className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const isDownloading = downloadProgress?.status === 'downloading';
  const downloadFailed = downloadProgress?.status === 'failed';

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-md',
        isDownloaded && 'border-primary/30 bg-primary/5',
        downloadFailed && 'border-destructive/30'
      )}
    >
      {/* Status indicators */}
      <div className="absolute top-2 right-2 flex gap-1">
        {isDownloaded && !hasUpdate && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Check className="h-3 w-3" />
            Downloaded
          </Badge>
        )}
        {hasUpdate && (
          <Badge variant="default" className="gap-1 text-xs">
            <RefreshCw className="h-3 w-3" />
            Update
          </Badge>
        )}
        {!isOnline && !isDownloaded && (
          <Badge variant="outline" className="gap-1 text-xs">
            <CloudOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
      </div>

      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
            {getFileIcon()}
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
              <span>{formatBytes(material.file_size)}</span>
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
            <p className="text-xs text-muted-foreground mt-1">Downloading...</p>
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
              onClick={onOpen}
              disabled={!isDownloaded && !isOnline}
            >
              <Eye className="h-4 w-4 mr-1" />
              Open
            </Button>
            {isDownloaded && (
              <>
                {hasUpdate && isOnline && (
                  <Button size="sm" variant="outline" onClick={onDownload}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={onRemove}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={onDownload}
            disabled={isDownloading || !isOnline}
          >
            <Download className="h-4 w-4 mr-1" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MaterialCard;
