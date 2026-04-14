import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { discoverJobsForUser } from "@/lib/discovery";
import { getCurrentUser, unauthorized } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "10", 10)));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.discoveredJob.findMany({
        where: { userId: user.id, dismissed: false },
        orderBy: [{ discoveredAt: "desc" }, { fitScore: "desc" }],
        skip,
        take: limit,
      }),
      prisma.discoveredJob.count({
        where: { userId: user.id, dismissed: false },
      }),
    ]);

    return NextResponse.json({ jobs, total, page, limit });
  } catch (error) {
    console.error("Failed to fetch discovered jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    await discoverJobsForUser(user.id, true);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const jobs = await prisma.discoveredJob.findMany({
      where: {
        userId: user.id,
        dismissed: false,
        discoveredAt: { gte: todayStart },
      },
      orderBy: { fitScore: "desc" },
      take: 10,
    });

    return NextResponse.json({ jobs, message: "Discovery complete" });
  } catch (error) {
    console.error("Failed to discover jobs:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
