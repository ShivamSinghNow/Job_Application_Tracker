import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichJob } from "@/lib/enrichment";

export async function POST(request: Request) {
  try {
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

    const enriched = await enrichJob(url);

    const application = await prisma.application.create({
      data: {
        url,
        company: enriched.company,
        role: enriched.role,
        location: enriched.location,
        salaryRange: enriched.salary_range,
        summary: enriched.summary,
        requirements: JSON.stringify(enriched.requirements),
        niceToHaves: JSON.stringify(enriched.nice_to_haves),
        fitScore: enriched.fit_score,
        fitReasoning: JSON.stringify(enriched.fit_reasoning),
      },
    });

    return NextResponse.json({
      ...application,
      requirements: JSON.parse(application.requirements),
      niceToHaves: JSON.parse(application.niceToHaves),
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
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
    });

    const parsed = applications.map((app) => ({
      ...app,
      requirements: JSON.parse(app.requirements),
      niceToHaves: JSON.parse(app.niceToHaves),
      fitReasoning: JSON.parse(app.fitReasoning),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
