import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { discoverJobsForUser } from "@/lib/discovery";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { resumes: { some: {} } },
    select: { id: true },
  });

  let processed = 0;
  let errors = 0;

  for (const user of users) {
    try {
      await discoverJobsForUser(user.id);
      processed++;
    } catch (error) {
      console.error(`Discovery failed for user ${user.id}:`, error);
      errors++;
    }
  }

  return NextResponse.json({ processed, errors });
}
