import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichJob } from "@/lib/enrichment";
import { getCurrentUser, unauthorized } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const enriched = await enrichJob(url, user.id);

    const application = await prisma.application.create({
      data: {
        url,
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

    return NextResponse.json({
      ...application,
      requirements: JSON.parse(application.requirements),
      potentialImprovements: JSON.parse(application.potentialImprovements),
      fitReasoning: JSON.parse(application.fitReasoning),
    });
  } catch (error) {
    console.error("Failed to enrich job:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const parsed = applications.map((app) => ({
      ...app,
      requirements: JSON.parse(app.requirements),
      potentialImprovements: JSON.parse(app.potentialImprovements),
      fitReasoning: JSON.parse(app.fitReasoning),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
