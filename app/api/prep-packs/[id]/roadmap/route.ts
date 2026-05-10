import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { generateRoadmap } from "@/lib/gemini";
import { getDb } from "@/lib/mongodb";
import { assertValidObjectId } from "@/lib/validators";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    const db = await getDb();
    const prepPack = await db.collection("prepPacks").findOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });
    if (!prepPack) {
      return NextResponse.json({ error: "Prep pack not found" }, { status: 404 });
    }

    const roadmap = await generateRoadmap({
      companyName: prepPack.companyName,
      role: prepPack.role,
      preparationDays: prepPack.preparationDays,
      analysis: prepPack.analysis
    });

    await db.collection("prepPacks").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          roadmap: roadmap.days,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(roadmap);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate roadmap" },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : error instanceof Error && error.message.startsWith("Invalid ")
              ? 400
              : 500
      }
    );
  }
}
