import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-helpers";
// pdf-parse v1: import inner module to avoid test file loading bug in index.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    console.log("[v0] Resume upload - user:", user?.id);
    if (!user) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);

    if (!parsed.text || parsed.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from the PDF. The file may be image-based." },
        { status: 400 }
      );
    }

    console.log("[v0] Deleting existing resumes for user:", user.id);
    await prisma.resume.deleteMany({ where: { userId: user.id } });
    await prisma.jobSearchProfile.deleteMany({ where: { userId: user.id } });
    console.log("[v0] Creating new resume with filename:", file.name);
    const resume = await prisma.resume.create({
      data: {
        filename: file.name,
        content: parsed.text.trim(),
        userId: user.id,
      },
    });
    console.log("[v0] Resume created successfully:", resume.id);

    return NextResponse.json({
      id: resume.id,
      filename: resume.filename,
      contentLength: resume.content.length,
      createdAt: resume.createdAt,
    });
  } catch (error) {
    console.error("Failed to process resume:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const resume = await prisma.resume.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!resume) {
      return NextResponse.json({ hasResume: false });
    }

    return NextResponse.json({
      hasResume: true,
      id: resume.id,
      filename: resume.filename,
      contentLength: resume.content.length,
      createdAt: resume.createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch resume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    await prisma.resume.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete resume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
