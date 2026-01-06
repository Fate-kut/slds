import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Material definitions with subject mappings
const materials = [
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
    subjectCode: "103", // Existing Biology subject
  },
  {
    fileName: "KB-COMPUTER-F3-QS.pdf",
    title: "Computer Studies Form 3 Questions",
    description: "Computer Studies practice questions for Form 3",
    subjectCode: "102", // Existing Cs subject
  },
  {
    fileName: "MATHEMATICS_F1_Q.pdf",
    title: "Mathematics Form 1 Questions",
    description: "Mathematics practice questions for Form 1",
    subjectCode: "101", // Existing Maths subject
  },
  {
    fileName: "FORM_3_SET_3_EXAMS_ALL_SUBJECTS.pdf",
    title: "Form 3 Set 3 Exams - All Subjects",
    description: "Comprehensive exam papers for all subjects",
    subjectCode: "EXAM01",
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from("subjects")
      .select("*");

    if (subjectsError) {
      throw new Error(`Failed to fetch subjects: ${subjectsError.message}`);
    }

    const results: { file: string; status: string; error?: string }[] = [];

    // Get a system user ID for uploaded_by (use the first admin/teacher)
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "teacher"])
      .limit(1)
      .single();

    const uploaderId = adminRole?.user_id;

    if (!uploaderId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No admin or teacher user found. Please create a teacher account first." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    for (const material of materials) {
      try {
        // Find the subject
        const subject = subjects?.find(s => s.code === material.subjectCode);
        if (!subject) {
          results.push({ 
            file: material.fileName, 
            status: "skipped", 
            error: `Subject with code ${material.subjectCode} not found` 
          });
          continue;
        }

        // Check if material already exists
        const { data: existing } = await supabase
          .from("learning_materials")
          .select("id")
          .eq("file_name", material.fileName)
          .single();

        if (existing) {
          results.push({ file: material.fileName, status: "already_exists" });
          continue;
        }

        // Fetch the PDF from the public uploads folder
        const baseUrl = req.headers.get("origin") || supabaseUrl.replace(".supabase.co", ".lovableproject.com");
        const pdfUrl = `${baseUrl}/uploads/${material.fileName}`;
        
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
          results.push({ 
            file: material.fileName, 
            status: "error", 
            error: `Failed to fetch PDF: ${pdfResponse.status}` 
          });
          continue;
        }

        const pdfBlob = await pdfResponse.blob();
        const fileSize = pdfBlob.size;

        // Upload to Supabase Storage
        const storagePath = `${subject.id}/${Date.now()}_${material.fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("learning-materials")
          .upload(storagePath, pdfBlob, {
            contentType: "application/pdf",
            upsert: false,
          });

        if (uploadError) {
          results.push({ 
            file: material.fileName, 
            status: "error", 
            error: `Upload failed: ${uploadError.message}` 
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("learning-materials")
          .getPublicUrl(storagePath);

        // Create learning material record
        const { error: insertError } = await supabase
          .from("learning_materials")
          .insert({
            title: material.title,
            description: material.description,
            file_name: material.fileName,
            file_url: urlData.publicUrl,
            file_type: "pdf",
            file_size: fileSize,
            subject_id: subject.id,
            uploaded_by: uploaderId,
          });

        if (insertError) {
          results.push({ 
            file: material.fileName, 
            status: "error", 
            error: `DB insert failed: ${insertError.message}` 
          });
          continue;
        }

        results.push({ file: material.fileName, status: "success" });
      } catch (err) {
        results.push({ 
          file: material.fileName, 
          status: "error", 
          error: err instanceof Error ? err.message : "Unknown error" 
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed materials error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
