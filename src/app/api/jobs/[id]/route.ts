import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUSES } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (status !== undefined) {
      if (!APPLICATION_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${APPLICATION_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const application = await prisma.application.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...application,
      requirements: JSON.parse(application.requirements),
      potentialImprovements: JSON.parse(application.potentialImprovements),
      fitReasoning: JSON.parse(application.fitReasoning),
    });
  } catch (error) {
    console.error("Failed to update job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
