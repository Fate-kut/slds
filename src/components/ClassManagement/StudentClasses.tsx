/**
 * StudentClasses Component
 * Shows students their enrolled classes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, Loader2, BookOpen } from 'lucide-react';

interface EnrolledClass {
  id: string;
  name: string;
  year: number;
  studentCount: number;
}

const StudentClasses: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnrolledClasses = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get student's class enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_classes')
        .select('class_id')
        .eq('student_id', user.id);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setClasses([]);
        return;
      }

      const classIds = enrollments.map(e => e.class_id);

      // Get class details
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);

      if (classError) throw classError;

      // Get student counts for each class
      const { data: allEnrollments, error: countError } = await supabase
        .from('student_classes')
        .select('class_id')
        .in('class_id', classIds);

      if (countError) throw countError;

      // Count students per class
      const countMap: Record<string, number> = {};
      allEnrollments?.forEach(e => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1;
      });

      const enrichedClasses: EnrolledClass[] = (classData || []).map(cls => ({
        id: cls.id,
        name: cls.name,
        year: cls.year,
        studentCount: countMap[cls.id] || 0,
      }));

      setClasses(enrichedClasses);
    } catch (error) {
      console.error('Error fetching enrolled classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEnrolledClasses();
  }, [fetchEnrolledClasses]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No Classes Enrolled</p>
          <p className="text-sm">Contact your teacher to be enrolled in a class</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          My Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg"
            >
              <div className="flex items-center gap-3">
                <GraduationCap size={18} className="text-primary" />
                <div>
                  <p className="font-medium text-sm">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">{cls.year}</p>
                </div>
              </div>
              <Badge variant="outline">
                <Users size={12} className="mr-1" />
                {cls.studentCount}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentClasses;
