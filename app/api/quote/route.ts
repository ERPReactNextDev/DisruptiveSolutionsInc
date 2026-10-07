import { NextResponse } from "next/server";
import { Resend } from "resend";

// Admin email — where quote requests get sent
const ADMIN_EMAIL = "itd@disruptivesolutionsinc.com";
const FROM_EMAIL = "noreply@elev8solutions.cloud";

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_EMAIL_API);
  try {
    const body = await req.json();
    const {
      firstName, lastName, email, contactNumber,
      streetAddress, company, message, attachmentUrl,
    } = body;

    const inquiryId = Math.random().toString(36).substring(2, 7).toUpperCase();

    // ── Admin notification ────────────────────────────────────────
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `NEW QUOTE REQUEST: ${firstName} ${lastName} (#${inquiryId})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;border:1px solid #eee;padding:24px;color:#333">
          <h2 style="color:#d11a2a;text-transform:uppercase;margin-top:0">New Quotation Inquiry</h2>
          <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${contactNumber}</p>
          <p><strong>Address:</strong> ${streetAddress}</p>
          <p><strong>Company:</strong> ${company || "N/A"}</p>
          <p><strong>Message:</strong></p>
          <div style="background:#f9f9f9;padding:14px;border-radius:6px;font-size:14px">${message || "—"}</div>
          ${attachmentUrl ? `<p style="margin-top:14px"><strong>Attachment:</strong> <a href="${attachmentUrl}" style="color:#d11a2a">View File</a></p>` : ""}
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p style="font-size:11px;color:#999">Reference ID: ${inquiryId} · Disruptive Solutions Quote System</p>
        </div>
      `,
    });

    // ── Customer auto-reply ───────────────────────────────────────
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `We've received your quote request (#${inquiryId})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;padding:32px;text-align:center">
          <h1 style="color:#d11a2a;font-style:italic;margin-top:0">REQUEST RECEIVED!</h1>
          <p style="font-size:16px;color:#333">Hi ${firstName},</p>
          <p style="color:#666;line-height:1.7">
            Thank you for requesting a custom quote from Disruptive Solutions.
            Our specialists will review your project requirements and get back to you within 24–48 hours.
          </p>
          <div style="margin:28px 0;padding:18px;border:1px dashed #d11a2a;border-radius:10px;background:#fff5f5">
            <p style="margin:0;font-weight:bold;color:#d11a2a">REFERENCE ID: ${inquiryId}</p>
          </div>
          <p style="font-size:12px;color:#999">This is an automated response. No need to reply.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
          <p style="font-weight:bold;font-size:10px;letter-spacing:2px;color:#000">DISRUPTIVE SOLUTIONS INC.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Emails sent", id: inquiryId }, { status: 200 });
  } catch (error) {
    console.error("Resend Error (quote):", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
