import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { confirmUserRemainOnPlatform, deleteAllUserData } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "confirm_remain") {
      const user = confirmUserRemainOnPlatform(session.email);
      return NextResponse.json({
        success: true,
        remainConfirmedAt: user?.remainConfirmedAt || new Date().toISOString(),
        message: "Thank you for confirming. Your account remains active on UTARE ZEM AI.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[API /api/auth/account POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to update account status." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorizedResponse("You must be signed in as yourself to delete your account.");
  }

  try {
    const body = await req.json().catch(() => ({}));
    const confirmationText = String(body.confirmationText || "")
      .trim()
      .toLowerCase();

    if (confirmationText !== "delete") {
      return NextResponse.json(
        {
          error:
            'Confirmation failed. Please type "delete" to permanently remove your account and all data.',
        },
        { status: 400 }
      );
    }

    const result = await deleteAllUserData({
      targetEmail: session.email,
      targetUserId: session.sub,
      actorEmail: session.email,
      actorRole: session.role,
      reason: "User self-deletion via Account Settings",
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }

    const res = NextResponse.json({
      success: true,
      deleted: result.deleted,
      removedCounts: result.removedCounts,
      message:
        "Your account and all associated personal data have been permanently deleted from UTARE ZEM AI.",
    });

    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (error) {
    console.error("[API /api/auth/account DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete your account and data." },
      { status: 500 }
    );
  }
}
