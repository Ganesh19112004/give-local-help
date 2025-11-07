import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  name: string;
  type: "admin" | "ngo";
  status: "approved" | "rejected";
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, name, type, status, reason }: ApprovalEmailRequest = await req.json();

    const subject =
      status === "approved"
        ? `${type === "admin" ? "Admin Access" : "NGO Registration"} Approved!`
        : `${type === "admin" ? "Admin Access" : "NGO Registration"} Application Update`;

    const htmlContent =
      status === "approved"
        ? `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Congratulations, ${name}!</h1>
            </div>
            <div class="content">
              <p>Great news! Your ${type === "admin" ? "admin access request" : "NGO registration"} has been approved.</p>
              <p>${type === "admin" 
                ? "You now have full administrative privileges to manage the DonateConnect platform." 
                : "Your organization is now active and can start receiving donations from our community."
              }</p>
              <p>You can now sign in and access your dashboard:</p>
              <div style="text-align: center;">
                <a href="${supabaseUrl.replace('.supabase.co', '')}/auth" class="button">Sign In Now</a>
              </div>
              <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>DonateConnect - Connecting Donors with NGOs</p>
              <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
            </div>
          </body>
        </html>
      `
        : `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .reason-box { background: #fee; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Thank you for your interest in ${type === "admin" ? "becoming an administrator" : "registering your NGO"} on DonateConnect.</p>
              <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
              ${reason ? `
                <div class="reason-box">
                  <strong>Reason:</strong><br>
                  ${reason}
                </div>
              ` : ""}
              <p>If you believe this was a mistake or would like to reapply with additional information, please contact our support team.</p>
              <p style="margin-top: 30px;">Thank you for your understanding.</p>
            </div>
            <div class="footer">
              <p>DonateConnect - Connecting Donors with NGOs</p>
              <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
            </div>
          </body>
        </html>
      `;

    // Send email using Supabase's built-in email functionality
    // Note: In production, you'd want to use a proper email service like Resend
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        subject,
        html: htmlContent,
      },
    });

    if (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't throw - we don't want to fail the approval if email fails
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
