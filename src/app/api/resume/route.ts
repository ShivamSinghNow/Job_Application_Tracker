import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// pdf-parse v1: import inner module to avoid test file loading bug in index.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");

export async function POST(request: Request) {
  try {
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

    await prisma.resume.deleteMany();
    const resume = await prisma.resume.create({
      data: {
        filename: file.name,
        content: parsed.text.trim(),
      },
    });

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
    const resume = await prisma.resume.findFirst({
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
    await prisma.resume.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete resume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
