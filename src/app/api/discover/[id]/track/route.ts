import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichJob } from "@/lib/enrichment";
import { getCurrentUser, unauthorized } from "@/lib/auth-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const discoveredJob = await prisma.discoveredJob.findFirst({
      where: { id, userId: user.id },
    });

    if (!discoveredJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const existing = await prisma.application.findFirst({
      where: { url: discoveredJob.url, userId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already tracking this job" },
        { status: 409 }
      );
    }

    const enriched = await enrichJob(discoveredJob.url, user.id);

    const application = await prisma.application.create({
      data: {
        url: discoveredJob.url,
        company: enriched.company,
        role: enriched.role,
        location: enriched.location,
        salaryRange: enriched.salary_range,
        summary: enriched.summary,
        requirements: JSON.stringify(enriched.requirements),
        potentialImprovements: JSON.stringify(enriched.potential_improvements),
        fitScore: enriched.fit_score,
        fitReasoning: JSON.stringify(enriched.fit_reasoning),
        userId: user.id,
      },
    });

    await prisma.discoveredJob.update({
      where: { id },
      data: { tracked: true },
    });

    return NextResponse.json({
      ...application,
      requirements: JSON.parse(application.requirements),
      potentialImprovements: JSON.parse(application.potentialImprovements),
      fitReasoning: JSON.parse(application.fitReasoning),
    });
  } catch (error) {
    console.error("Failed to track job:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
