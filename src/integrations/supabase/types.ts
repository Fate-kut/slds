export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_late: boolean
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_late?: boolean
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_late?: boolean
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submission: boolean
          class_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          max_score: number
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_late_submission?: boolean
          class_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          max_score?: number
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_late_submission?: boolean
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          max_score?: number
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          year?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          year?: number
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          exam_id: string
          id: string
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          exam_id: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text: string
          question_type?: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_submissions: {
        Row: {
          answers: Json
          exam_id: string
          id: string
          is_auto_submitted: boolean
          started_at: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          answers?: Json
          exam_id: string
          id?: string
          is_auto_submitted?: boolean
          started_at?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          answers?: Json
          exam_id?: string
          id?: string
          is_auto_submitted?: boolean
          started_at?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          auto_submit: boolean
          class_id: string
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number
          id: string
          is_online: boolean
          is_published: boolean
          max_score: number
          scheduled_end: string
          scheduled_start: string
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          auto_submit?: boolean
          class_id: string
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_online?: boolean
          is_published?: boolean
          max_score?: number
          scheduled_end: string
          scheduled_start: string
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          auto_submit?: boolean
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_online?: boolean
          is_published?: boolean
          max_score?: number
          scheduled_end?: string
          scheduled_start?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assignment_submission_id: string | null
          exam_submission_id: string | null
          feedback: string | null
          graded_at: string
          graded_by: string
          id: string
          is_published: boolean
          max_score: number
          score: number
          student_id: string
        }
        Insert: {
          assignment_submission_id?: string | null
          exam_submission_id?: string | null
          feedback?: string | null
          graded_at?: string
          graded_by: string
          id?: string
          is_published?: boolean
          max_score?: number
          score: number
          student_id: string
        }
        Update: {
          assignment_submission_id?: string | null
          exam_submission_id?: string | null
          feedback?: string | null
          graded_at?: string
          graded_by?: string
          id?: string
          is_published?: boolean
          max_score?: number
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assignment_submission_id_fkey"
            columns: ["assignment_submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_exam_submission_id_fkey"
            columns: ["exam_submission_id"]
            isOneToOne: false
            referencedRelation: "exam_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_materials: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          subject_id: string
          title: string
          updated_at: string
          uploaded_by: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number
          file_type?: string
          file_url: string
          id?: string
          subject_id: string
          title: string
          updated_at?: string
          uploaded_by: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          subject_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lockers: {
        Row: {
          created_at: string
          id: string
          location: string
          locked_at: string | null
          locked_by: string | null
          status: string
          student_id: string | null
          student_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          location: string
          locked_at?: string | null
          locked_by?: string | null
          status?: string
          student_id?: string | null
          student_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          locked_at?: string | null
          locked_by?: string | null
          status?: string
          student_id?: string | null
          student_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          class_id: string
          id: string
          material_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          class_id: string
          id?: string
          material_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          class_id?: string
          id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_assignments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "learning_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          locker_id: string | null
          name: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          locker_id?: string | null
          name: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          locker_id?: string | null
          name?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      student_classes: {
        Row: {
          class_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_classes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const
