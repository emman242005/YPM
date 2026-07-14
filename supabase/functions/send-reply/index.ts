import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toEmail, toName, replyText, originalMessage } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Young Peacemakers <onboarding@resend.dev>",
        to: [toEmail],
        subject: "Reply from Young Peacemakers Organization",
        html: `
          <p>Hi ${toName},</p>
          <p>${replyText}</p>
          <hr>
          <p style="color:#888; font-size:0.85em;">Your original message: "${originalMessage}"</p>
          <p style="color:#888; font-size:0.85em;">— Young Peacemakers Organization, Kumba, Cameroon</p>
        `,
      }),
    });

    const data = await emailResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});