import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JobDetailView } from "@/components/job-detail-view";
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

  return <JobDetailView application={application} />;
}
