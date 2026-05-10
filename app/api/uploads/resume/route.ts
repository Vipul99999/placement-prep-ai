import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUserSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceSameOrigin, getRequestGuardErrorStatus, parseJsonBody } from "@/lib/request-guards";
import { deleteResumeUpload, extractTextFromResume, listResumeUploads, saveResumeUpload } from "@/lib/uploads";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export async function GET() {
  try {
    const session = await requireVerifiedUserSession();
    const items = await listResumeUploads(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load uploads" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireVerifiedUserSession();
    enforceSameOrigin(request);
    enforceRateLimit(request, {
      key: "resume-upload",
      limit: 12,
      windowMs: 10 * 60 * 1000,
      userKey: session.user.id
    });
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume file must be 5MB or smaller" }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      return NextResponse.json(
        { error: "Resume file must be a PDF, DOCX, TXT, or MD file" },
        { status: 400 }
      );
    }

    const extractedText = await extractTextFromResume(file);
    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Could not extract resume text from this file" }, { status: 400 });
    }

    const saved = await saveResumeUpload({
      userId: session.user.id,
      fileName: file.name,
      extractedText
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "resume_uploaded",
      entityType: "resumeUpload",
      entityId: saved._id,
      metadata: {
        fileName: file.name,
        projectHighlights: saved.projectHighlights.length
      }
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload resume" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message === "Email verification required"
              ? 403
            : error instanceof Error && error.message.includes("Too many requests")
              ? 429
              : 500
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireVerifiedUserSession();
    enforceSameOrigin(request);
    const body = await parseJsonBody<{ resumeUploadId?: string }>(request);
    if (!body.resumeUploadId?.trim()) {
      return NextResponse.json({ error: "Resume upload id is required" }, { status: 400 });
    }

    await deleteResumeUpload({
      userId: session.user.id,
      resumeUploadId: body.resumeUploadId.trim()
    });

    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "resume_upload_deleted",
      entityType: "resumeUpload",
      entityId: body.resumeUploadId.trim(),
      severity: "warning"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete upload" },
      {
        status:
          error instanceof Error && getRequestGuardErrorStatus(error) !== null
            ? (getRequestGuardErrorStatus(error) as number)
            :
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message.startsWith("Invalid ")
              ? 400
              : 500
      }
    );
  }
}
