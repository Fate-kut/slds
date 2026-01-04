/**
 * MaterialUploader - Upload and manage learning materials (Teacher/Admin)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  Trash2,
  Edit,
  Plus,
  BookOpen,
  Users,
  CheckCircle,
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Class {
  id: string;
  name: string;
  year: number;
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
  subjects: Subject | null;
}

interface MaterialAssignment {
  id: string;
  material_id: string;
  class_id: string;
  classes: Class | null;
}

export const MaterialUploader: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [assignments, setAssignments] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    fileType: 'pdf',
  });
  const [selectedMaterialForAssign, setSelectedMaterialForAssign] = useState<string>('');
  const [selectedClassesForAssign, setSelectedClassesForAssign] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [newClass, setNewClass] = useState({ name: '', year: new Date().getFullYear() });

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjectsRes, classesRes, materialsRes, assignmentsRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('classes').select('*').order('name'),
        supabase.from('learning_materials').select('*, subjects(id, name, code)').order('created_at', { ascending: false }),
        supabase.from('material_assignments').select('*, classes(id, name, year)'),
      ]);

      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data as LearningMaterial[]);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data as MaterialAssignment[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Upload material
  const handleUpload = async () => {
    if (!selectedFile || !materialForm.title || !materialForm.subjectId || !user) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${materialForm.subjectId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('learning-materials')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Create material record
      const { error: insertError } = await supabase.from('learning_materials').insert({
        title: materialForm.title,
        description: materialForm.description || null,
        subject_id: materialForm.subjectId,
        file_url: filePath,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: materialForm.fileType,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      setUploadProgress(100);

      toast({
        title: 'Upload Successful',
        description: 'Material has been uploaded successfully.',
      });

      // Reset form
      setShowUploadDialog(false);
      setSelectedFile(null);
      setMaterialForm({ title: '', description: '', subjectId: '', fileType: 'pdf' });
      fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload material. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Assign material to classes
  const handleAssign = async () => {
    if (!selectedMaterialForAssign || selectedClassesForAssign.length === 0 || !user) {
      toast({
        title: 'Missing Information',
        description: 'Please select a material and at least one class.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const assignmentData = selectedClassesForAssign.map((classId) => ({
        material_id: selectedMaterialForAssign,
        class_id: classId,
        assigned_by: user.id,
      }));

      const { error } = await supabase.from('material_assignments').upsert(assignmentData, {
        onConflict: 'material_id,class_id',
      });

      if (error) throw error;

      toast({
        title: 'Assignment Successful',
        description: 'Material has been assigned to the selected classes.',
      });

      setShowAssignDialog(false);
      setSelectedMaterialForAssign('');
      setSelectedClassesForAssign([]);
      fetchData();
    } catch (error) {
      console.error('Assignment error:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign material. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Create subject
  const handleCreateSubject = async () => {
    if (!newSubject.name || !newSubject.code) return;

    try {
      const { error } = await supabase.from('subjects').insert(newSubject);
      if (error) throw error;

      toast({ title: 'Subject Created', description: `${newSubject.name} has been added.` });
      setShowSubjectDialog(false);
      setNewSubject({ name: '', code: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({ title: 'Error', description: 'Failed to create subject.', variant: 'destructive' });
    }
  };

  // Create class
  const handleCreateClass = async () => {
    if (!newClass.name) return;

    try {
      const { error } = await supabase.from('classes').insert(newClass);
      if (error) throw error;

      toast({ title: 'Class Created', description: `${newClass.name} has been added.` });
      setShowClassDialog(false);
      setNewClass({ name: '', year: new Date().getFullYear() });
      fetchData();
    } catch (error) {
      console.error('Error creating class:', error);
      toast({ title: 'Error', description: 'Failed to create class.', variant: 'destructive' });
    }
  };

  // Delete material
  const handleDeleteMaterial = async (id: string, fileUrl: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('learning-materials').remove([fileUrl]);

      // Delete from database
      const { error } = await supabase.from('learning_materials').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Material Deleted', description: 'Material has been removed.' });
      fetchData();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({ title: 'Error', description: 'Failed to delete material.', variant: 'destructive' });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssignmentsForMaterial = (materialId: string) => {
    return assignments.filter((a) => a.material_id === materialId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Learning Materials Management</h2>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input
                    placeholder="e.g., Mathematics"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject Code</Label>
                  <Input
                    placeholder="e.g., MATH101"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject((prev) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSubject}>Create Subject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  <Input
                    placeholder="e.g., Grade 10A"
                    value={newClass.name}
                    onChange={(e) => setNewClass((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={newClass.year}
                    onChange={(e) => setNewClass((prev) => ({ ...prev, year: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateClass}>Create Class</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-1" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Learning Material</DialogTitle>
                <DialogDescription>
                  Upload a PDF, slides, or notes for students to access.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., Chapter 1: Introduction"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description of the material..."
                    value={materialForm.description}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Select
                      value={materialForm.subjectId}
                      onValueChange={(value) => setMaterialForm((prev) => ({ ...prev, subjectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={materialForm.fileType}
                      onValueChange={(value) => setMaterialForm((prev) => ({ ...prev, fileType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="slides">Slides</SelectItem>
                        <SelectItem value="notes">Notes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>File *</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </p>
                  )}
                </div>
                {isUploading && (
                  <div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{materials.length}</p>
                <p className="text-sm text-muted-foreground">Total Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{subjects.length}</p>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No materials uploaded yet. Click "Upload Material" to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const materialAssignments = getAssignmentsForMaterial(material.id);
                  return (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.subjects?.name || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>{formatBytes(material.file_size)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {materialAssignments.length === 0 ? (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          ) : (
                            materialAssignments.map((a) => (
                              <Badge key={a.id} variant="secondary" className="text-xs">
                                {a.classes?.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>v{material.version}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMaterialForAssign(material.id);
                              setSelectedClassesForAssign(materialAssignments.map((a) => a.class_id));
                              setShowAssignDialog(true);
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMaterial(material.id, material.file_url)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Material to Classes</DialogTitle>
            <DialogDescription>
              Select which classes should have access to this material.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {classes.map((cls) => (
                <label
                  key={cls.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedClassesForAssign.includes(cls.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClassesForAssign((prev) => [...prev, cls.id]);
                      } else {
                        setSelectedClassesForAssign((prev) => prev.filter((id) => id !== cls.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span>{cls.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {cls.year}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAssign}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialUploader;
