import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from '@supabase/supabase-js';

const CONTACT_EMAIL = 'theslds.mail@gmail.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    if (!record) {
      return new Response(JSON.stringify({ error: 'No record provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, subject, message, type } = record;

    // Log the notification (in production, integrate with an email service)
    console.log(`📧 New feedback notification:`);
    console.log(`  To: ${CONTACT_EMAIL}`);
    console.log(`  From: ${name} <${email}>`);
    console.log(`  Type: ${type}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Message: ${message}`);

    // Store a notification record in activity_logs for admin visibility
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase.from('activity_logs').insert({
      user_id: record.user_id || '00000000-0000-0000-0000-000000000000',
      user_name: name || 'Anonymous',
      user_role: 'system',
      action: 'feedback_submitted',
      details: `New ${type} from ${name} (${email}): ${subject}`,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Notification processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing feedback notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
