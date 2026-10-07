import { NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAIL = "admin@disruptivesolutionsinc.com";
const FROM_EMAIL = "noreply@elev8solutions.cloud";

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_EMAIL_API);
  try {
    const body = await req.json();
    const { fullName, email, phone, company, message, attachmentUrl } = body;
    const inquiryId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const firstName = fullName?.split(" ")[0] || fullName || "there";

    // ── Admin notification ────────────────────────────────────────
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `NEW CONTACT INQUIRY: ${fullName} (#${inquiryId})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;padding:24px;color:#333">
          <h2 style="color:#d11a2a;border-bottom:2px solid #d11a2a;padding-bottom:10px;text-transform:uppercase;font-style:italic;margin-top:0">
            New General Inquiry
          </h2>
          <div style="background:#f9f9f9;padding:16px;border-radius:10px;margin-bottom:20px">
            <p style="margin:4px 0"><strong>Full Name:</strong> ${fullName}</p>
            <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
            <p style="margin:4px 0"><strong>Phone:</strong> ${phone || "N/A"}</p>
            <p style="margin:4px 0"><strong>Company:</strong> ${company || "N/A"}</p>
            <p style="margin:4px 0"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="padding:16px;border:1px solid #eee;border-radius:10px">
            <h4 style="margin-top:0;color:#d11a2a;text-transform:uppercase;font-size:12px">Message / Project Brief</h4>
            <p style="color:#333;line-height:1.7;white-space:pre-wrap;margin:0">${message}</p>
          </div>
          ${attachmentUrl ? `<p style="margin-top:16px"><strong>Attachment:</strong> <a href="${attachmentUrl}" style="color:#d11a2a">View File</a></p>` : ""}
          <p style="margin-top:20px;font-size:10px;color:#bbb;text-align:center">Reference ID: ${inquiryId} · Disruptive Solutions Contact System</p>
        </div>
      `,
    });

    // ── Customer auto-reply ───────────────────────────────────────
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `We've received your message (#${inquiryId})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;padding:32px;text-align:center">
          <h1 style="color:#d11a2a;font-style:italic;margin-top:0">MESSAGE RECEIVED!</h1>
          <p style="font-size:16px;color:#333">Hi ${firstName},</p>
          <p style="color:#666;line-height:1.7">
            Thank you for reaching out to Disruptive Solutions. We have received your inquiry
            and our specialists will review your details and get back to you within 24–48 hours.
          </p>
          <div style="margin:28px 0;padding:18px;border:1px dashed #d11a2a;border-radius:10px;background:#fff5f5">
            <p style="margin:0;font-weight:bold;color:#d11a2a">REFERENCE ID: ${inquiryId}</p>
          </div>
          <p style="font-size:12px;color:#999">This is an automated response. No need to reply to this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
          <p style="font-weight:bold;font-size:10px;letter-spacing:2px;color:#000">DISRUPTIVE SOLUTIONS INC.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, id: inquiryId }, { status: 200 });
  } catch (error) {
    console.error("Resend Error (contact):", error);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
