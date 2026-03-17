import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import type { JobData, FitScore } from "./types";

const client = new Anthropic();

async function getResumeContent(): Promise<string> {
  const resume = await prisma.resume.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!resume) {
    throw new Error("No resume uploaded. Please upload your resume before tracking jobs.");
  }

  return resume.content;
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
  const tools: Anthropic.Messages.Tool[] = [
    {
      name: "fetch_url",
      description:
        "Fetches the content of a web page at the given URL. Returns the raw HTML content.",
      input_schema: {
        type: "object" as const,
        properties: {
          url: {
            type: "string",
            description: "The URL to fetch",
          },
        },
        required: ["url"],
      },
    },
  ];

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: `I need you to extract structured job posting data from this URL: ${url}

Use the fetch_url tool to get the page content, then extract the following fields as JSON:
- company: the company name
- role: the job title/role
- location: job location (or "Remote" if remote)
- salary_range: salary range if mentioned, otherwise null
- requirements: array of key requirements/qualifications
- nice_to_haves: array of nice-to-have/preferred qualifications (empty array if none listed)
- summary: 2-3 sentence plain English description of the role

Return ONLY valid JSON with these exact fields, no markdown formatting.`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    tools,
    messages,
  });

  if (response.stop_reason === "tool_use") {
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlock && toolUseBlock.name === "fetch_url") {
      const input = toolUseBlock.input as { url: string };
      const html = await fetchUrl(input.url);

      const followUp = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools,
        messages: [
          ...messages,
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUseBlock.id,
                content: html,
              },
            ],
          },
        ],
      });

      const textBlock = followUp.content.find(
        (block): block is Anthropic.Messages.TextBlock => block.type === "text"
      );

      if (textBlock) {
        return JSON.parse(textBlock.text) as JobData;
      }
    }
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (textBlock) {
    return JSON.parse(textBlock.text) as JobData;
  }

  throw new Error("Failed to extract job data from the URL");
}

export async function scoreResumeFit(jobData: JobData, resumeContent: string): Promise<FitScore> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Given the following resume and job posting, score the resume fit from 0-100 and provide exactly 3 bullet points of reasoning.

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

No markdown formatting.`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (textBlock) {
    return JSON.parse(textBlock.text) as FitScore;
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
