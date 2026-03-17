import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { JobDetail } from "@/components/job-detail";
import type { ApplicationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const raw = await prisma.application.findUnique({
    where: { id },
  });

  if (!raw) return notFound();

  const application: ApplicationRecord = {
    ...raw,
    requirements: JSON.parse(raw.requirements),
    potentialImprovements: JSON.parse(raw.potentialImprovements),
    fitReasoning: JSON.parse(raw.fitReasoning),
    status: raw.status as ApplicationRecord["status"],
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Dashboard
      </Link>
      <JobDetail application={application} />
    </main>
  );
}
