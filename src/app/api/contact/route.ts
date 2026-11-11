import { NextRequest, NextResponse } from "next/server";
import { saveContactMessage } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, inquiryType } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const saved = saveContactMessage({
      name: name.trim(),
      email: email.trim(),
      subject: (subject || "General Inquiry").trim(),
      message: message.trim(),
      inquiryType: inquiryType || "General",
    });

    return NextResponse.json({
      success: true,
      messageRecord: saved,
      message: "Thank you for contacting UTARE ZISEDU AI. Your message has been received.",
    });
  } catch (err: any) {
    console.error("[API /api/contact Error]:", err);
    return NextResponse.json(
      { error: "Failed to send contact message." },
      { status: 500 }
    );
  }
}
