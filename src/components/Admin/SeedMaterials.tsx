/**
 * SeedMaterials - Admin component to seed learning materials from uploaded PDFs
 */

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MaterialConfig {
  fileName: string;
  title: string;
  description: string;
  subjectCode: string;
}

const materials: MaterialConfig[] = [
  {
    fileName: "006JavaScript.pdf",
    title: "JavaScript Fundamentals",
    description: "Introduction to JavaScript programming",
    subjectCode: "JS101",
  },
  {
    fileName: "javascript_tutorial.pdf",
    title: "JavaScript Tutorial",
    description: "Comprehensive JavaScript tutorial guide",
    subjectCode: "JS101",
  },
  {
    fileName: "bioogy-form-three-topical-questions.pdf",
    title: "Biology Form 3 Topical Questions",
    description: "Biology practice questions for Form 3",
    subjectCode: "103",
  },
  {
    fileName: "KB-COMPUTER-F3-QS.pdf",
    title: "Computer Studies Form 3 Questions",
    description: "Computer Studies practice questions for Form 3",
    subjectCode: "102",
  },
  {
    fileName: "MATHEMATICS_F1_Q.pdf",
    title: "Mathematics Form 1 Questions",
    description: "Mathematics practice questions for Form 1",
    subjectCode: "101",
  },
  {
    fileName: "FORM_3_SET_3_EXAMS_ALL_SUBJECTS.pdf",
    title: "Form 3 Set 3 Exams - All Subjects",
    description: "Comprehensive exam papers for all subjects",
    subjectCode: "EXAM01",
  },
];

interface UploadResult {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'skipped';
  message?: string;
}

const SeedMaterials: React.FC = () => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [progress, setProgress] = useState(0);

  const seedMaterials = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setIsSeeding(true);
    setResults(materials.map(m => ({ fileName: m.fileName, status: 'pending' })));
    setProgress(0);

    try {
      // Get all subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*');

      if (subjectsError) throw subjectsError;

      const totalMaterials = materials.length;

      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        
        // Update status to uploading
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'uploading' } : r
        ));

        try {
          // Find subject
          const subject = subjects?.find(s => s.code === material.subjectCode);
          if (!subject) {
            setResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, status: 'error', message: 'Subject not found' } : r
            ));
            continue;
          }

          // Check if already exists
          const { data: existing } = await supabase
            .from('learning_materials')
            .select('id')
            .eq('file_name', material.fileName)
            .maybeSingle();

          if (existing) {
            setResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, status: 'skipped', message: 'Already exists' } : r
            ));
            continue;
          }

          // Fetch the PDF from public folder
          const pdfUrl = `/uploads/${material.fileName}`;
          const response = await fetch(pdfUrl);
          
          if (!response.ok) {
            setResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, status: 'error', message: `File not found (${response.status})` } : r
            ));
            continue;
          }

          const blob = await response.blob();
          const fileSize = blob.size;

          // Upload to storage
          const storagePath = `${subject.id}/${Date.now()}_${material.fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('learning-materials')
            .upload(storagePath, blob, {
              contentType: 'application/pdf',
              upsert: false,
            });

          if (uploadError) {
            setResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, status: 'error', message: uploadError.message } : r
            ));
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('learning-materials')
            .getPublicUrl(storagePath);

          // Create learning material record
          const { error: insertError } = await supabase
            .from('learning_materials')
            .insert({
              title: material.title,
              description: material.description,
              file_name: material.fileName,
              file_url: urlData.publicUrl,
              file_type: 'pdf',
              file_size: fileSize,
              subject_id: subject.id,
              uploaded_by: user.id,
            });

          if (insertError) {
            setResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, status: 'error', message: insertError.message } : r
            ));
            continue;
          }

          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'success' } : r
          ));
        } catch (err) {
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'error', message: err instanceof Error ? err.message : 'Unknown error' } : r
          ));
        }

        setProgress(((i + 1) / totalMaterials) * 100);
      }

      const successCount = results.filter(r => r.status === 'success').length;
      toast.success(`Seeding complete! ${successCount} materials uploaded.`);
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed materials');
    } finally {
      setIsSeeding(false);
    }
  };

  const getStatusIcon = (status: UploadResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'skipped':
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload size={20} />
          Seed Learning Materials
        </CardTitle>
        <CardDescription>
          Upload pre-configured PDFs to their respective subjects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={seedMaterials} 
          disabled={isSeeding}
          className="w-full"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading Materials...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Start Seeding ({materials.length} files)
            </>
          )}
        </Button>

        {isSeeding && (
          <Progress value={progress} className="h-2" />
        )}

        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            {results.map((result, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 bg-secondary rounded-lg text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getStatusIcon(result.status)}
                  <span className="truncate">{result.fileName}</span>
                </div>
                {result.message && (
                  <span className="text-xs text-muted-foreground truncate ml-2">
                    {result.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeedMaterials;
