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
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload));

    const record = payload.record;

    if (!record || record.sender !== 'visitor') {
      console.log("Skipped — sender was:", record ? record.sender : "no record");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("Resend key exists:", !!resendApiKey);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Young Peacemakers Website <onboarding@resend.dev>",
        to: ["youngpeacemakers417@gmail.com"],
        subject: "New message from your website chat",
        html: `
          <p>A visitor sent a new message on your website chat:</p>
          <blockquote style="border-left:3px solid #1B3A6B; padding-left:12px; color:#333;">
            ${record.content}
          </blockquote>
        `,
      }),
    });

    const data = await emailResponse.json();
    console.log("Resend response:", JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("Error caught:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});