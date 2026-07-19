import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();
    
    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields: to, subject, html" }, { status: 400 });
    }

    const gmailUser = "aeva.nine@gmail.com";
    // Check if App Password is set in environment, otherwise fall back to raw password
    const gmailPassword = process.env.GMAIL_APP_PASSWORD || "!@#Aeva";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    console.log(`API attempting email dispatch to ${to} via nodemailer...`);
    const info = await transporter.sendMail({
      from: `Aeva Biology Sync <${gmailUser}>`,
      to,
      subject,
      html
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("API Send Email error:", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch email" }, { status: 500 });
  }
}
