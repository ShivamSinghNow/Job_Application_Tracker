import { sql, type ApplicationRow, type ResumeRow } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";
import type { ApplicationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rawApplications = await sql<ApplicationRow[]>`
    SELECT * FROM applications ORDER BY created_at DESC
  `;

  const applications: ApplicationRecord[] = rawApplications.map((app) => ({
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
    status: app.status as ApplicationRecord["status"],
    notes: app.notes,
    createdAt: new Date(app.created_at).toISOString(),
    updatedAt: new Date(app.updated_at).toISOString(),
  }));

  const resumes = await sql<ResumeRow[]>`
    SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1
  `;
  const resume = resumes[0];

  const resumeInfo = resume
    ? { hasResume: true, filename: resume.filename, contentLength: resume.content.length }
    : { hasResume: false };

  return <Dashboard initialApplications={applications} initialResume={resumeInfo} />;
}
