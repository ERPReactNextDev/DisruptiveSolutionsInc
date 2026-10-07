import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_EMAIL_API);

const ADMIN_EMAIL = "admin@disruptivesolutionsinc.com";
const FROM_EMAIL = "noreply@elev8solutions.cloud";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerDetails, items, inquiryId } = body;

    const itemsHtml = (items ?? [])
      .map(
        (item: any) => `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:12px">
            ${item.image ? `<img src="${item.image}" width="48" height="48" style="vertical-align:middle;margin-right:12px;border-radius:6px;object-fit:contain;background:#f9f9f9"/>` : ""}
            <span style="vertical-align:middle">
              <strong style="font-size:13px;color:#333">${item.name || "—"}</strong><br/>
              <small style="color:#999;font-size:11px">SKU: ${item.sku || "—"}</small>
            </span>
          </td>
          <td style="padding:12px;text-align:center;font-weight:bold;color:#d11a2a">×${item.quantity ?? 1}</td>
        </tr>
      `,
      )
      .join("");

    // ── Admin notification ────────────────────────────────────────
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `NEW INQUIRY: ${customerDetails.firstName} ${customerDetails.lastName} (#${inquiryId?.slice(-5)})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;padding:24px">
          <h2 style="color:#d11a2a;border-bottom:2px solid #d11a2a;padding-bottom:10px;text-transform:uppercase;font-style:italic;margin-top:0">
            New Product Request
          </h2>
          <div style="background:#f9f9f9;padding:16px;border-radius:10px;margin-bottom:20px">
            <p style="margin:4px 0"><strong>Customer:</strong> ${customerDetails.firstName} ${customerDetails.lastName}</p>
            <p style="margin:4px 0"><strong>Email:</strong> ${customerDetails.email}</p>
            <p style="margin:4px 0"><strong>Phone:</strong> ${customerDetails.phone || "N/A"}</p>
            <p style="margin:4px 0"><strong>Address:</strong> ${customerDetails.streetAddress}${customerDetails.apartment ? ", " + customerDetails.apartment : ""}</p>
            <p style="margin:4px 0"><strong>Notes:</strong> ${customerDetails.orderNotes || "None"}</p>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#000;color:#fff;font-size:10px;text-transform:uppercase">
                <th style="text-align:left;padding:10px">Product</th>
                <th style="padding:10px">Qty</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin-top:20px;font-size:10px;color:#bbb;text-align:center">Reference ID: ${inquiryId}</p>
        </div>
      `,
    });

    // ── Customer auto-reply ───────────────────────────────────────
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerDetails.email,
      subject: `Inquiry Received (#${inquiryId?.slice(-5)})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;padding:32px;text-align:center">
          <h1 style="color:#d11a2a;font-style:italic;margin-top:0">THANK YOU!</h1>
          <p style="font-size:16px;color:#333">Hi ${customerDetails.firstName},</p>
          <p style="color:#666;line-height:1.7">
            We've received your inquiry. Our team is reviewing your product selection
            and will get back to you with a formal quote shortly.
          </p>
          <div style="margin:28px 0;padding:18px;border:1px dashed #d11a2a;border-radius:10px;background:#fff5f5">
            <p style="margin:0;font-weight:bold;color:#d11a2a">REFERENCE ID: ${inquiryId?.slice(-5)}</p>
          </div>
          <p style="font-size:12px;color:#999">This is an automated response. Please do not reply to this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
          <p style="font-weight:bold;font-size:10px;letter-spacing:2px;color:#000">DISRUPTIVE SOLUTIONS INC.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Resend Error (send-email):", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
