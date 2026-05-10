import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { exportUserData } from "@/lib/privacy";

export async function GET() {
  try {
    const session = await requireUserSession();
    const payload = await exportUserData(session.user.id);
    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": "attachment; filename=placementprep-account-export.json"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export account data" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
