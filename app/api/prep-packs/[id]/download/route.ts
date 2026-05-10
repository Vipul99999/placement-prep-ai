import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { getPrepPackDetail, getPrepPackQuestions } from "@/lib/prepPack";
import type { RecommendedCategory } from "@/types/prep";
import { assertValidObjectId } from "@/lib/validators";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertValidObjectId(id, "prep pack id");
    const session = await requireUserSession();
    const pack = await getPrepPackDetail(id, session.user.id);

    if (!pack) {
      return NextResponse.json({ error: "Prep pack not found" }, { status: 404 });
    }

    const questionsByCategory = Object.fromEntries(
      await Promise.all(
        pack.categoryPlan.map(async (category: RecommendedCategory) => {
          const payload = await getPrepPackQuestions({
            prepPackId: id,
            userId: session.user.id,
            category: category.name,
            page: 1,
            limit: 50
          });

          return [category.name, payload.items];
        })
      )
    );

    return NextResponse.json({
      pack,
      questionsByCategory
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export prep pack" },
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
