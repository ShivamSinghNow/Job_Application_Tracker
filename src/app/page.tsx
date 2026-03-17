import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard";
import type { ApplicationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rawApplications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
  });

  const applications: ApplicationRecord[] = rawApplications.map((app) => ({
    ...app,
    requirements: JSON.parse(app.requirements),
    potentialImprovements: JSON.parse(app.potentialImprovements),
    fitReasoning: JSON.parse(app.fitReasoning),
    status: app.status as ApplicationRecord["status"],
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }));

  const resume = await prisma.resume.findFirst({
    orderBy: { createdAt: "desc" },
    select: { filename: true, content: true },
  });

  const resumeInfo = resume
    ? { hasResume: true, filename: resume.filename, contentLength: resume.content.length }
    : { hasResume: false };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Job Tracker</h1>
      <Dashboard initialApplications={applications} initialResume={resumeInfo} />
    </main>
  );
}
