import { NextResponse } from "next/server";
import { sql, type ResumeRow } from "@/lib/db";
import { randomUUID } from "crypto";
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

    // Delete all existing resumes
    await sql`DELETE FROM resumes`;

    // Create new resume
    const id = randomUUID();
    const now = new Date();
    const content = parsed.text.trim();

    await sql`
      INSERT INTO resumes (id, filename, content, created_at)
      VALUES (${id}, ${file.name}, ${content}, ${now})
    `;

    return NextResponse.json({
      id,
      filename: file.name,
      contentLength: content.length,
      createdAt: now.toISOString(),
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
    const rows = await sql<ResumeRow[]>`
      SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1
    `;
    const resume = rows[0];

    if (!resume) {
      return NextResponse.json({ hasResume: false });
    }

    return NextResponse.json({
      hasResume: true,
      id: resume.id,
      filename: resume.filename,
      contentLength: resume.content.length,
      createdAt: new Date(resume.created_at).toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch resume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await sql`DELETE FROM resumes`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete resume:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
