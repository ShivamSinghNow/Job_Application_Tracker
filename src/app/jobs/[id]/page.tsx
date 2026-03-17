import { notFound } from "next/navigation";
import { sql, type ApplicationRow } from "@/lib/db";
import { JobDetailView } from "@/components/job-detail-view";
import type { ApplicationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const applications = await sql<ApplicationRow[]>`
    SELECT * FROM applications WHERE id = ${id} LIMIT 1
  `;

  if (applications.length === 0) return notFound();

  const raw = applications[0];

  const application: ApplicationRecord = {
    id: raw.id,
    url: raw.url,
    company: raw.company,
    role: raw.role,
    requirements: JSON.parse(raw.requirements),
    potentialImprovements: JSON.parse(raw.potential_improvements),
    fitReasoning: JSON.parse(raw.fit_reasoning),
    fitScore: raw.fit_score,
    status: raw.status as ApplicationRecord["status"],
    createdAt: raw.created_at.toISOString(),
    updatedAt: raw.updated_at.toISOString(),
  };

  return <JobDetailView application={application} />;
}
