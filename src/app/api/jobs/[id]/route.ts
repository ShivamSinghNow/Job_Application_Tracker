import { NextResponse } from "next/server";
import { sql, type ApplicationRow } from "@/lib/db";
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

    const now = new Date();

    // Build dynamic update query
    if (status !== undefined && notes !== undefined) {
      await sql`
        UPDATE applications SET status = ${status}, notes = ${notes}, updated_at = ${now}
        WHERE id = ${id}
      `;
    } else if (status !== undefined) {
      await sql`
        UPDATE applications SET status = ${status}, updated_at = ${now}
        WHERE id = ${id}
      `;
    } else if (notes !== undefined) {
      await sql`
        UPDATE applications SET notes = ${notes}, updated_at = ${now}
        WHERE id = ${id}
      `;
    }

    const rows = await sql<ApplicationRow[]>`
      SELECT * FROM applications WHERE id = ${id}
    `;
    const application = rows[0];

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: application.id,
      url: application.url,
      company: application.company,
      role: application.role,
      location: application.location,
      salaryRange: application.salary_range,
      summary: application.summary,
      requirements: JSON.parse(application.requirements),
      potentialImprovements: JSON.parse(application.potential_improvements),
      fitScore: application.fit_score,
      fitReasoning: JSON.parse(application.fit_reasoning),
      status: application.status,
      notes: application.notes,
      createdAt: new Date(application.created_at).toISOString(),
      updatedAt: new Date(application.updated_at).toISOString(),
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
    const { id } = await params;
    await sql`DELETE FROM applications WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
