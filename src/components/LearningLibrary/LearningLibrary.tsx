/**
 * Learning Library - Main component for browsing and managing offline learning materials
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useOffline } from '@/contexts/OfflineContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MaterialCard } from './MaterialCard';
import { PDFReader } from './PDFReader';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    refreshDownloadedMaterials,
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

  // Fetch materials and subjects
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subjects
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .order('name');

        if (subjectsData) {
          setSubjects(subjectsData);
        }

        // Fetch assigned materials
        const { data: materialsData, error } = await supabase
          .from('learning_materials')
          .select(`
            *,
            subjects (id, name, code)
          `)
          .order('title');

        if (error) throw error;

        if (materialsData) {
          setMaterials(materialsData as LearningMaterial[]);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        // If offline, just show downloaded materials
        if (!isOnline) {
          toast({
            title: 'Offline Mode',
            description: 'Showing downloaded materials only.',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOnline, toast]);

  // Filter materials
  const filteredMaterials = materials.filter((material) => {
    const matchesSubject = selectedSubject === 'all' || material.subject_id === selectedSubject;
    const matchesSearch =
      searchQuery === '' ||
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Get downloaded material IDs for quick lookup
  const downloadedIds = new Set(downloadedMaterials.map((m) => m.id));

  // Handle opening a material
  const handleOpenMaterial = async (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    if (!material) return;

    // Check if downloaded
    const blob = await getMaterialFile(materialId);
    if (blob) {
      setPdfBlob(blob);
      setSelectedMaterial(materialId);
    } else if (isOnline) {
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
  };

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Download all materials
  const handleDownloadAll = async () => {
    const notDownloaded = filteredMaterials.filter((m) => !downloadedIds.has(m.id));
    if (notDownloaded.length === 0) {
      toast({
        title: 'All Downloaded',
        description: 'All materials are already downloaded.',
      });
      return;
    }

    toast({
      title: 'Downloading All',
      description: `Downloading ${notDownloaded.length} materials...`,
    });

    for (const material of notDownloaded) {
      await downloadMaterial(material);
    }
  };

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
            Access to learning materials is restricted during exam mode. Only exam-specific
            content is available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If viewing a PDF
  if (selectedMaterial && pdfBlob) {
    const material = materials.find((m) => m.id === selectedMaterial);
    return (
      <PDFReader
        blob={pdfBlob}
        title={material?.title || 'Document'}
        onClose={() => {
          setSelectedMaterial(null);
          setPdfBlob(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <Button variant="outline" size="sm" onClick={checkForUpdates}>
              <RefreshCw className="h-4 w-4 mr-1" />
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
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedSubject === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedSubject('all')}
          >
            All Subjects
          </Badge>
          {subjects.map((subject) => (
            <Badge
              key={subject.id}
              variant={selectedSubject === subject.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedSubject(subject.id)}
            >
              {subject.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
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
          {activeTab === 'available' && isOnline && filteredMaterials.length > 0 && (
            <Button size="sm" onClick={handleDownloadAll}>
              <CloudDownload className="h-4 w-4 mr-1" />
              Download All
            </Button>
          )}
        </div>

        <TabsContent value="available" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Materials Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedSubject !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'No materials have been assigned to your class yet.'}
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
