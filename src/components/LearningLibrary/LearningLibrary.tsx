/**
 * Learning Library - Main component for browsing and managing offline learning materials
 * Optimized for performance with memoization and efficient rendering
 */

import React, { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useOffline } from '@/contexts/OfflineContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaterialCard } from './MaterialCard';
import {
  BookOpen,
  Download,
  Search,
  Wifi,
  WifiOff,
  HardDrive,
  RefreshCw,
  Library,
  CloudDownload,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Lazy load PDFReader for better initial load
const PDFReader = lazy(() => import('./PDFReader'));

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface LearningMaterial {
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

// Memoized format bytes function
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Memoized subject filter component
const SubjectFilter = memo(({ 
  subjects, 
  selectedSubject, 
  onSelect 
}: { 
  subjects: Subject[]; 
  selectedSubject: string; 
  onSelect: (id: string) => void;
}) => (
  <div className="flex gap-2 flex-wrap">
    <Badge
      variant={selectedSubject === 'all' ? 'default' : 'outline'}
      className="cursor-pointer hover:bg-primary/90 transition-colors"
      onClick={() => onSelect('all')}
    >
      All Subjects
    </Badge>
    {subjects.map((subject) => (
      <Badge
        key={subject.id}
        variant={selectedSubject === subject.id ? 'default' : 'outline'}
        className="cursor-pointer hover:bg-primary/90 transition-colors"
        onClick={() => onSelect(subject.id)}
      >
        {subject.name}
      </Badge>
    ))}
  </div>
));
SubjectFilter.displayName = 'SubjectFilter';

// Loading skeleton for material cards
const MaterialCardSkeleton = memo(() => (
  <Card className="animate-pulse">
    <CardContent className="pt-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-muted rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
    </CardContent>
  </Card>
));
MaterialCardSkeleton.displayName = 'MaterialCardSkeleton';

export const LearningLibrary: React.FC = () => {
  const { examMode } = useApp();
  const {
    isOnline,
    downloadedMaterials,
    downloadProgress,
    storageUsage,
    updatesAvailable,
    downloadMaterial,
    removeMaterialOffline,
    getMaterialFile,
    checkForUpdates,
    downloadMultipleMaterials,
  } = useOffline();
  const { toast } = useToast();

  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Fetch materials and subjects - optimized with single effect
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [subjectsRes, materialsRes] = await Promise.all([
          supabase.from('subjects').select('*').order('name'),
          supabase.from('learning_materials').select('*, subjects (id, name, code)').order('title'),
        ]);

        if (isMounted) {
          if (subjectsRes.data) setSubjects(subjectsRes.data);
          if (materialsRes.data) setMaterials(materialsRes.data as LearningMaterial[]);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        if (!isOnline && isMounted) {
          toast({
            title: 'Offline Mode',
            description: 'Showing downloaded materials only.',
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    
    return () => { isMounted = false; };
  }, [isOnline, toast]);

  // Memoized filtered materials
  const filteredMaterials = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return materials.filter((material) => {
      const matchesSubject = selectedSubject === 'all' || material.subject_id === selectedSubject;
      const matchesSearch = query === '' ||
        material.title.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query);
      return matchesSubject && matchesSearch;
    });
  }, [materials, selectedSubject, searchQuery]);

  // Memoized downloaded IDs set
  const downloadedIds = useMemo(() => 
    new Set(downloadedMaterials.map((m) => m.id)), 
    [downloadedMaterials]
  );

  // Memoized not downloaded materials for batch download
  const notDownloadedMaterials = useMemo(() => 
    filteredMaterials.filter((m) => !downloadedIds.has(m.id)),
    [filteredMaterials, downloadedIds]
  );

  // Handle opening a material
  const handleOpenMaterial = useCallback(async (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    if (!material) return;

    // Check if downloaded first (faster)
    const blob = await getMaterialFile(materialId);
    if (blob) {
      setPdfBlob(blob);
      setSelectedMaterial(materialId);
      return;
    }
    
    if (isOnline) {
      // Fetch from server
      try {
        const { data: urlData } = supabase.storage
          .from('learning-materials')
          .getPublicUrl(material.file_url);

        const response = await fetch(urlData.publicUrl);
        if (response.ok) {
          const fileBlob = await response.blob();
          setPdfBlob(fileBlob);
          setSelectedMaterial(materialId);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not open the material. Please download it first.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Not Available Offline',
        description: 'Please download this material when you have internet access.',
        variant: 'destructive',
      });
    }
  }, [materials, getMaterialFile, isOnline, toast]);

  // Handle check for updates
  const handleCheckUpdates = useCallback(async () => {
    setIsCheckingUpdates(true);
    await checkForUpdates();
    setIsCheckingUpdates(false);
  }, [checkForUpdates]);

  // Handle download all
  const handleDownloadAll = useCallback(async () => {
    if (notDownloadedMaterials.length === 0) {
      toast({
        title: 'All Downloaded',
        description: 'All materials are already downloaded.',
      });
      return;
    }

    toast({
      title: 'Downloading All',
      description: `Starting download of ${notDownloadedMaterials.length} materials...`,
    });

    await downloadMultipleMaterials(notDownloadedMaterials);
  }, [notDownloadedMaterials, downloadMultipleMaterials, toast]);

  // Close PDF reader
  const handleClosePdf = useCallback(() => {
    setSelectedMaterial(null);
    setPdfBlob(null);
  }, []);

  // If exam mode is active, show restricted message
  if (examMode) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Learning Materials Disabled
          </h3>
          <p className="text-muted-foreground max-w-md">
            Access to learning materials is restricted during exam mode.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If viewing a PDF
  if (selectedMaterial && pdfBlob) {
    const material = materials.find((m) => m.id === selectedMaterial);
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <PDFReader
          blob={pdfBlob}
          title={material?.title || 'Document'}
          onClose={handleClosePdf}
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Library className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Learning Library</h2>
          <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <HardDrive className="h-3 w-3" />
            {formatBytes(storageUsage.used)} • {storageUsage.materials} files
          </Badge>
          {isOnline && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCheckUpdates}
              disabled={isCheckingUpdates}
            >
              {isCheckingUpdates ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Check Updates
            </Button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <SubjectFilter 
          subjects={subjects} 
          selectedSubject={selectedSubject} 
          onSelect={setSelectedSubject}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="available" className="gap-1">
              <BookOpen className="h-4 w-4" />
              Available ({filteredMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="downloaded" className="gap-1">
              <Download className="h-4 w-4" />
              Downloaded ({downloadedMaterials.length})
            </TabsTrigger>
          </TabsList>
          {activeTab === 'available' && isOnline && notDownloadedMaterials.length > 0 && (
            <Button size="sm" onClick={handleDownloadAll}>
              <CloudDownload className="h-4 w-4 mr-1" />
              Download All ({notDownloadedMaterials.length})
            </Button>
          )}
        </div>

        <TabsContent value="available" className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <MaterialCardSkeleton key={i} />)}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Materials Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedSubject !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'No materials have been uploaded yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  isDownloaded={downloadedIds.has(material.id)}
                  downloadProgress={downloadProgress.get(material.id)}
                  hasUpdate={updatesAvailable.has(material.id)}
                  onDownload={() => downloadMaterial(material)}
                  onOpen={() => handleOpenMaterial(material.id)}
                  onRemove={() => removeMaterialOffline(material.id)}
                  isOnline={isOnline}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="downloaded" className="mt-4">
          {downloadedMaterials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Download className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Downloaded Materials</h3>
                <p className="text-muted-foreground">
                  Download materials to access them offline.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {downloadedMaterials.map((material) => {
                const fullMaterial = materials.find((m) => m.id === material.id);
                return (
                  <MaterialCard
                    key={material.id}
                    material={{
                      id: material.id,
                      title: material.title,
                      description: material.description,
                      subject_id: material.subjectId,
                      file_url: material.fileUrl,
                      file_name: material.fileName,
                      file_size: material.fileSize,
                      file_type: material.fileType,
                      version: material.version,
                      created_at: material.downloadedAt.toISOString(),
                      updated_at: material.lastAccessed.toISOString(),
                      subjects: { id: material.subjectId, name: material.subjectName, code: '' },
                    }}
                    isDownloaded={true}
                    downloadProgress={undefined}
                    hasUpdate={updatesAvailable.has(material.id)}
                    onDownload={() => {
                      if (fullMaterial) downloadMaterial(fullMaterial);
                    }}
                    onOpen={() => handleOpenMaterial(material.id)}
                    onRemove={() => removeMaterialOffline(material.id)}
                    isOnline={isOnline}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningLibrary;
