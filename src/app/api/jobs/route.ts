import { NextResponse } from "next/server";
import { sql, type ApplicationRow } from "@/lib/db";
import { enrichJob } from "@/lib/enrichment";
import { randomUUID } from "crypto";

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

    const id = randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO applications (
        id, url, company, role, location, salary_range, summary,
        requirements, potential_improvements, fit_score, fit_reasoning,
        status, notes, created_at, updated_at
      ) VALUES (
        ${id}, ${url}, ${enriched.company}, ${enriched.role}, ${enriched.location},
        ${enriched.salary_range}, ${enriched.summary},
        ${JSON.stringify(enriched.requirements)}, ${JSON.stringify(enriched.potential_improvements)},
        ${enriched.fit_score}, ${JSON.stringify(enriched.fit_reasoning)},
        'SAVED', NULL, ${now}, ${now}
      )
    `;

    return NextResponse.json({
      id,
      url,
      company: enriched.company,
      role: enriched.role,
      location: enriched.location,
      salaryRange: enriched.salary_range,
      summary: enriched.summary,
      requirements: enriched.requirements,
      potentialImprovements: enriched.potential_improvements,
      fitScore: enriched.fit_score,
      fitReasoning: enriched.fit_reasoning,
      status: "SAVED",
      notes: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to enrich job:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const applications = await sql<ApplicationRow[]>`
      SELECT * FROM applications ORDER BY created_at DESC
    `;

    const parsed = applications.map((app) => ({
      id: app.id,
      url: app.url,
      company: app.company,
      role: app.role,
      location: app.location,
      salaryRange: app.salary_range,
      summary: app.summary,
      requirements: JSON.parse(app.requirements),
      potentialImprovements: JSON.parse(app.potential_improvements),
      fitScore: app.fit_score,
      fitReasoning: JSON.parse(app.fit_reasoning),
      status: app.status,
      notes: app.notes,
      createdAt: new Date(app.created_at).toISOString(),
      updatedAt: new Date(app.updated_at).toISOString(),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
