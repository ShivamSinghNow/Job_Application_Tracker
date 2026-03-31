import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard";
import type { ApplicationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  const rawApplications = await prisma.application.findMany({
    where: { userId },
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
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { filename: true, content: true },
  });

  const resumeInfo = resume
    ? { hasResume: true, filename: resume.filename, contentLength: resume.content.length }
    : { hasResume: false };

  return (
    <Dashboard
      initialApplications={applications}
      initialResume={resumeInfo}
      user={{ name: session.user.name, email: session.user.email, image: session.user.image }}
    />
  );
}
