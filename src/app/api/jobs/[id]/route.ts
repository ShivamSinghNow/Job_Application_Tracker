import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUSES } from "@/lib/types";
import { getCurrentUser, unauthorized } from "@/lib/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

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

    const existing = await prisma.application.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const existing = await prisma.application.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    await prisma.application.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
