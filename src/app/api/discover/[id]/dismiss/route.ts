import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const job = await prisma.discoveredJob.findFirst({
      where: { id, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.discoveredJob.update({
      where: { id },
      data: { dismissed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to dismiss job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
