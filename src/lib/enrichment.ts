import Anthropic from "@anthropic-ai/sdk";
import { sql, type ResumeRow } from "./db";
import type { JobData, FitScore } from "./types";

const client = new Anthropic();

function extractJSON<T>(text: string): T {
  const trimmed = text.trim();

  // Try parsing directly first (ideal case)
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue to fallback strategies
  }

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // continue
    }
  }

  // Find the first { ... } or [ ... ] block in the text
  const jsonStart = trimmed.search(/[{[]/);
  if (jsonStart !== -1) {
    const bracket = trimmed[jsonStart];
    const closingBracket = bracket === "{" ? "}" : "]";
    const lastClose = trimmed.lastIndexOf(closingBracket);
    if (lastClose > jsonStart) {
      try {
        return JSON.parse(trimmed.slice(jsonStart, lastClose + 1)) as T;
      } catch {
        // continue
      }
    }
  }

  throw new Error(
    "The AI response could not be parsed as JSON. The job posting page may be inaccessible or not contain recognizable job data."
  );
}

async function getResumeContent(): Promise<string> {
  const resumes = await sql<ResumeRow[]>`
    SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1
  `;

  if (resumes.length === 0) {
    throw new Error("No resume uploaded. Please upload your resume before tracking jobs.");
  }

  return resumes[0].content;
}

async function fetchUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible)",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return html.slice(0, 50000);
}

export async function extractJobData(url: string): Promise<JobData> {
  const html = await fetchUrl(url);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract structured job posting data from the following HTML content (fetched from ${url}).

<html_content>
${html}
</html_content>

You MUST respond with ONLY a valid JSON object — no explanation, no markdown, no code fences.
If the page does not appear to be a job posting, use your best judgment to fill in reasonable values from whatever content is available.

Required JSON fields:
{
  "company": "string - the company name",
  "role": "string - the job title/role",
  "location": "string - job location, or 'Remote' if remote",
  "salary_range": "string or null - salary range if mentioned",
  "requirements": ["array of key requirements/qualifications"],
  "nice_to_haves": ["array of preferred qualifications, empty array if none"],
  "summary": "string - 2-3 sentence plain English description of the role"
}`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (textBlock) {
    return extractJSON<JobData>(textBlock.text);
  }

  throw new Error("Failed to extract job data from the URL");
}

export async function scoreResumeFit(jobData: JobData, resumeContent: string): Promise<FitScore> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Given the following resume and job posting, score the resume fit from 0-100, provide exactly 3 bullet points of reasoning, and suggest potential improvements.

RESUME:
${resumeContent}

JOB POSTING:
Company: ${jobData.company}
Role: ${jobData.role}
Location: ${jobData.location}
Requirements: ${jobData.requirements.join(", ")}
Nice to haves: ${jobData.nice_to_haves.join(", ")}
Summary: ${jobData.summary}

Return ONLY valid JSON with these exact fields:
- fit_score: number from 0-100
- fit_reasoning: array of exactly 3 strings, each a brief bullet point explaining the score
- potential_improvements: an array of 3-5 actionable suggestions for the candidate to improve their fit for this role. These can include:
  * Specific resume tweaks (e.g., reword a bullet point, highlight a specific skill more prominently)
  * Projects to build that would demonstrate relevant skills
  * Areas or domains to expand knowledge in
  * Certifications or courses to consider
  If the resume is an excellent match (fit_score >= 90), return exactly one item: "Your resume is a perfect match for this role — no improvements needed!"

No markdown formatting.`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (textBlock) {
    return extractJSON<FitScore>(textBlock.text);
  }

  throw new Error("Failed to score resume fit");
}

export async function enrichJob(
  url: string
): Promise<JobData & FitScore> {
  const resumeContent = await getResumeContent();
  const jobData = await extractJobData(url);
  const fitScore = await scoreResumeFit(jobData, resumeContent);
  return { ...jobData, ...fitScore };
}
