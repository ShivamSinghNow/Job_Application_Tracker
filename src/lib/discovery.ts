import Anthropic from "@anthropic-ai/sdk";
import { tavily } from "@tavily/core";
import { prisma } from "./prisma";
import {
  fetchJobsForCompanies,
  VERIFIED_COMPANIES,
  type NormalizedJob,
  type TargetCompany,
} from "./ats";

const anthropic = new Anthropic();
function getTavilyClient() {
  return tavily({ apiKey: process.env.TAVILY_API_KEY! });
}

interface ResumeAnalysis {
  targetCompanies: TargetCompany[];
  targetRoles: string[];
  skills: string[];
  seniorityLevel: string;
  yearsOfExperience: number;
  locationPreferences: string[];
  industryPreferences: string[];
}

interface RankedJob {
  atsJobId: string;
  fitScore: number;
  matchExplanation: string;
  seniorityLevel: string;
  remoteStatus: string;
  companyFunding: string | null;
}

function extractJSON<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {}
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {}
  }
  const jsonStart = trimmed.search(/[{[]/);
  if (jsonStart !== -1) {
    const bracket = trimmed[jsonStart];
    const closingBracket = bracket === "{" ? "}" : "]";
    const lastClose = trimmed.lastIndexOf(closingBracket);
    if (lastClose > jsonStart) {
      try {
        return JSON.parse(trimmed.slice(jsonStart, lastClose + 1)) as T;
      } catch {}
    }
  }
  throw new Error("Failed to parse JSON from AI response");
}

async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Analyze the following resume and return a JSON object describing the candidate's profile for a job search.

<resume>
${resumeText}
</resume>

Return ONLY valid JSON with these exact fields:
{
  "targetCompanies": [
    {
      "name": "Company Name",
      "greenhouse": "company-slug-on-greenhouse-or-null",
      "lever": "company-slug-on-lever-or-null",
      "ashby": "company-slug-on-ashby-or-null"
    }
  ],
  "targetRoles": ["Role Title 1", "Role Title 2"],
  "skills": ["skill1", "skill2"],
  "seniorityLevel": "new-grad|entry-level|junior|mid-level|senior|staff|principal",
  "yearsOfExperience": 0,
  "locationPreferences": ["Location 1"],
  "industryPreferences": ["Industry 1"]
}

CRITICAL — Seniority determination rules:
- Count ONLY full-time professional work experience (NOT internships, co-ops, research assistantships, or academic lab positions).
- If the candidate is still in school or about to graduate (look at education dates), they are "new-grad" with yearsOfExperience = 0 regardless of how impressive their internships/labs are.
- If the candidate has graduated but has < 1 year of full-time work: "entry-level", yearsOfExperience = 0.
- If 1-2 years full-time: "junior", yearsOfExperience = the count.
- If 3-5 years full-time: "mid-level".
- If 6-9 years full-time: "senior".
- If 10+ years: "staff" or "principal".
- Internships and lab experience do NOT count toward years of experience.

For targetCompanies, provide 15-20 companies. Important:
- If the candidate is new-grad, entry-level, or junior, focus on companies known for university/new-grad hiring programs (e.g., companies with "University", "New Grad", or "Early Career" job tracks).
- Include a mix of big tech with known new-grad pipelines and growth-stage startups that hire junior engineers.
- For senior+ candidates, focus on companies matching their tech stack and domain expertise.

CRITICAL ATS slug guidance:
- "greenhouse": The slug used at boards-api.greenhouse.io. Known examples: "twitch", "spotify", "doordash", "gusto", "plaid", "hashicorp", "cockroachlabs", "redpandadata". Typically lowercase company name. Most big tech (Google, Meta, Apple, Amazon, Microsoft) do NOT use Greenhouse — omit the field for them.
- "lever": The slug used at api.lever.co. Known examples: "spotify", "nerdwallet", "samsara". Typically lowercase company name. Only include if you are fairly confident the company uses Lever.
- "ashby": The slug used at api.ashbyhq.com. Known examples: "notion", "ramp", "linear", "vercel", "retool", "replit", "resend". Popular with modern startups. Typically lowercase company name.

Only include an ATS field if you believe the company actually uses that specific platform. It's better to omit a slug than to guess wrong. Focus on growth-stage tech companies that are known to use these ATS platforms rather than big tech that uses internal career portals.

For targetRoles, provide 3-5 job titles appropriate for the candidate's ACTUAL seniority level:
- For new-grad/entry-level: use titles like "Software Engineer", "Junior Software Engineer", "New Grad Software Engineer", "Associate Software Engineer". NEVER suggest "Senior", "Staff", "Lead", or "Principal" titles.
- For junior: similar to new-grad but can include slightly broader titles.
- For mid-level+: match the seniority in the title.

For seniorityLevel, choose exactly one of: "new-grad", "entry-level", "junior", "mid-level", "senior", "staff", "principal".

For yearsOfExperience, return the number of full-time (non-internship) work years. Return 0 for current students and recent grads with no full-time experience.

For locationPreferences, infer from the resume's listed location, any remote work indicators, or stated preferences.

No markdown, no explanation — just the JSON object.`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (!textBlock) {
    throw new Error("No text response from resume analysis");
  }

  return extractJSON<ResumeAnalysis>(textBlock.text);
}

export async function getOrCreateProfile(
  userId: string,
  resumeText: string,
  forceRefresh = false
): Promise<{ profile: ResumeAnalysis; companies: TargetCompany[] }> {
  if (forceRefresh) {
    await prisma.jobSearchProfile.deleteMany({ where: { userId } });
  }

  const existing = await prisma.jobSearchProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    const isStale = existing.yearsOfExperience === null;
    if (isStale) {
      await prisma.jobSearchProfile.delete({ where: { userId } });
    } else {
      const profile: ResumeAnalysis = {
        targetCompanies: JSON.parse(existing.targetCompanies),
        targetRoles: JSON.parse(existing.targetRoles),
        skills: JSON.parse(existing.skills),
        seniorityLevel: existing.seniorityLevel,
        yearsOfExperience: existing.yearsOfExperience ?? 0,
        locationPreferences: JSON.parse(existing.locationPreferences),
        industryPreferences: existing.industryPreferences
          ? JSON.parse(existing.industryPreferences)
          : [],
      };
      return { profile, companies: profile.targetCompanies };
    }
  }

  const profile = await analyzeResume(resumeText);

  await prisma.jobSearchProfile.upsert({
    where: { userId },
    update: {
      targetCompanies: JSON.stringify(profile.targetCompanies),
      targetRoles: JSON.stringify(profile.targetRoles),
      skills: JSON.stringify(profile.skills),
      seniorityLevel: profile.seniorityLevel,
      yearsOfExperience: profile.yearsOfExperience,
      locationPreferences: JSON.stringify(profile.locationPreferences),
      industryPreferences: JSON.stringify(profile.industryPreferences),
    },
    create: {
      userId,
      targetCompanies: JSON.stringify(profile.targetCompanies),
      targetRoles: JSON.stringify(profile.targetRoles),
      skills: JSON.stringify(profile.skills),
      seniorityLevel: profile.seniorityLevel,
      yearsOfExperience: profile.yearsOfExperience,
      locationPreferences: JSON.stringify(profile.locationPreferences),
      industryPreferences: JSON.stringify(profile.industryPreferences),
    },
  });

  return { profile, companies: profile.targetCompanies };
}

async function discoverFundedCompanies(
  profile: ResumeAnalysis
): Promise<{ companies: TargetCompany[]; fundingInfo: Map<string, string> }> {
  const queries = [
    `${profile.skills[0]} engineer jobs company raised Series A Series B 2026`,
    `${profile.seniorityLevel} ${profile.targetRoles[0]} startup hiring recently funded 2026`,
    `${profile.skills.slice(0, 3).join(" ")} startup hiring recently funded 2025 2026`,
    `${profile.industryPreferences[0] ?? "tech"} startup engineering jobs funding round 2026`,
    `AI startup hiring engineers recently funded 2025 2026`,
  ];

  const searchResults: Array<{ title: string; content: string; url: string }> =
    [];

  const searchPromises = queries.map(async (query) => {
    try {
      const result = await getTavilyClient().search(query, { maxResults: 5 });
      return result.results.map((r) => ({
        title: r.title,
        content: r.content,
        url: r.url,
      }));
    } catch (err) {
      console.warn("Tavily search failed for query:", query, err);
      return [];
    }
  });

  const settled = await Promise.allSettled(searchPromises);
  for (const result of settled) {
    if (result.status === "fulfilled") {
      searchResults.push(...result.value);
    }
  }

  if (searchResults.length === 0) {
    return { companies: [], fundingInfo: new Map() };
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `From the following search results about recently funded companies hiring engineers, extract company names and funding information.

<search_results>
${searchResults.map((r) => `Title: ${r.title}\nSnippet: ${r.content}\nURL: ${r.url}`).join("\n\n")}
</search_results>

The candidate's skills are: ${profile.skills.join(", ")}

Return ONLY valid JSON:
{
  "companies": [
    {
      "name": "Company Name",
      "greenhouse": "slug-or-null",
      "lever": "slug-or-null",
      "ashby": "slug-or-null",
      "funding": "Series B - $40M"
    }
  ]
}

For each company, guess the ATS platform slugs based on common patterns (lowercase name, sometimes hyphenated). Only include ATS fields you believe are correct; omit otherwise. Include the "funding" field with a brief description of their latest round if mentioned.

Return up to 10 unique companies. No markdown, no explanation.`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (!textBlock) {
    return { companies: [], fundingInfo: new Map() };
  }

  const parsed = extractJSON<{
    companies: Array<
      TargetCompany & { funding?: string }
    >;
  }>(textBlock.text);

  const fundingInfo = new Map<string, string>();
  const companies: TargetCompany[] = parsed.companies.map((c) => {
    if (c.funding) {
      fundingInfo.set(c.name, c.funding);
    }
    return {
      name: c.name,
      greenhouse: c.greenhouse,
      lever: c.lever,
      ashby: c.ashby,
    };
  });

  return { companies, fundingInfo };
}

const SENIOR_TITLE_KEYWORDS = [
  "senior",
  "staff",
  "principal",
  "lead",
  "director",
  "vp",
  "head of",
  "manager",
  "phd",
  "distinguished",
];

const MID_PLUS_TITLE_KEYWORDS = [
  "staff",
  "principal",
  "director",
  "vp",
  "head of",
  "distinguished",
];

const NEW_GRAD_BOOST_KEYWORDS = [
  "new grad",
  "new graduate",
  "university",
  "early career",
  "associate",
  "entry level",
  "entry-level",
  "junior",
  "intern to full",
  "rotational",
];

function isTitleDisqualified(
  titleLower: string,
  seniorityLevel: string
): boolean {
  if (["new-grad", "entry-level", "junior"].includes(seniorityLevel)) {
    return SENIOR_TITLE_KEYWORDS.some((kw) => titleLower.includes(kw));
  }
  if (seniorityLevel === "mid-level") {
    return MID_PLUS_TITLE_KEYWORDS.some((kw) => titleLower.includes(kw));
  }
  return false;
}

function preFilterJobs(
  jobs: NormalizedJob[],
  profile: ResumeAnalysis
): NormalizedJob[] {
  const eligible = jobs.filter(
    (job) => !isTitleDisqualified(job.title.toLowerCase(), profile.seniorityLevel)
  );

  const roleKeywords = profile.targetRoles
    .flatMap((r) => r.toLowerCase().split(/\s+/))
    .filter((w) => w.length > 2);
  const skillKeywords = profile.skills.map((s) => s.toLowerCase());
  const allKeywords = [...new Set([...roleKeywords, ...skillKeywords])];

  const isJuniorCandidate = ["new-grad", "entry-level", "junior"].includes(
    profile.seniorityLevel
  );

  const scored = eligible.map((job) => {
    const titleLower = job.title.toLowerCase();
    const descLower = job.description.toLowerCase().slice(0, 500);
    let score = 0;
    for (const kw of allKeywords) {
      if (titleLower.includes(kw)) score += 3;
      if (descLower.includes(kw)) score += 1;
    }
    if (isJuniorCandidate) {
      for (const kw of NEW_GRAD_BOOST_KEYWORDS) {
        if (titleLower.includes(kw)) score += 10;
        if (descLower.includes(kw)) score += 3;
      }
    }
    return { job, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 50).map((s) => s.job);
}

async function rankAndScore(
  jobs: NormalizedJob[],
  resumeText: string,
  profile: ResumeAnalysis,
  fundingInfo: Map<string, string>
): Promise<RankedJob[]> {
  const filtered = preFilterJobs(jobs, profile);

  const jobSummaries = filtered.map((job) => ({
    atsJobId: job.atsJobId,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description.slice(0, 300),
    postedAt: job.postedAt?.toISOString() ?? null,
    salaryRange: job.salaryRange,
    funding: fundingInfo.get(job.company) ?? null,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `You are a job-matching expert. Rank and score the following jobs for this candidate.

<resume>
${resumeText.slice(0, 3000)}
</resume>

<candidate_profile>
Skills: ${profile.skills.join(", ")}
Seniority: ${profile.seniorityLevel}
Years of experience: ${profile.yearsOfExperience} (full-time only, excludes internships/labs)
Target roles: ${profile.targetRoles.join(", ")}
Location preferences: ${profile.locationPreferences.join(", ")}
Industry preferences: ${profile.industryPreferences.join(", ")}
</candidate_profile>

<jobs>
${JSON.stringify(jobSummaries, null, 2)}
</jobs>

CRITICAL SENIORITY RULE — THIS IS A HARD GATE, NOT A SUGGESTION:
The candidate's seniority level is "${profile.seniorityLevel}" with ${profile.yearsOfExperience} years of full-time experience.
${["new-grad", "entry-level", "junior"].includes(profile.seniorityLevel) ? `This is a new-grad/entry-level/junior candidate. You MUST NOT include ANY role that:
- Has "Senior", "Staff", "Lead", "Principal", "Distinguished" in the title
- Requires a PhD
- Requires 3+ years of professional experience
- Is clearly designed for experienced professionals (e.g., "Engineering Manager", "Architect")

PRIORITIZE roles explicitly labeled as: new grad, university hire, early career, associate, junior, entry-level, or rotational program. These are far better matches than a generic role with high keyword overlap.

If fewer than 10 jobs remain after applying this filter, return fewer jobs. Do NOT pad results with mismatched senior roles.` : profile.seniorityLevel === "mid-level" ? `This is a mid-level candidate. Exclude roles requiring Staff/Principal/Director level experience. Prefer roles matching 3-5 years of experience.` : `Match roles to the candidate's ${profile.seniorityLevel} level.`}

Score and rank using FOUR signals:
1. Resume fit (0-100): How well the job matches the candidate's skills and experience
2. Recency: Postings from the last 7 days weighted heavily. Over 30 days old deprioritized. No postedAt = treat as moderately recent.
3. Seniority match: HARD FILTER as described above — do not include roles outside the candidate's level range
4. Remote/location match: Filter against candidate's location preferences (${profile.locationPreferences.join(", ")}). Remote jobs always pass.

Boost companies with funding info — they're actively growing and more likely to hire.

Return the TOP 10 jobs as a JSON array (or fewer if fewer qualify). Each element must have:
- atsJobId: the job's atsJobId from the input
- fitScore: number 0-100 combining all four signals
- matchExplanation: 2-3 sentence plain English explanation (e.g. "This role matches your Python and distributed systems background. The company raised Series B four months ago and is actively scaling engineering.")
- seniorityLevel: inferred seniority of the role ("new-grad", "entry-level", "junior", "mid-level", "senior", "staff", "principal")
- remoteStatus: "remote", "hybrid", "onsite", or "unknown"
- companyFunding: funding info string or null

Return ONLY valid JSON — an array of objects. No markdown, no explanation.`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (!textBlock) {
    throw new Error("No text response from ranking");
  }

  return extractJSON<RankedJob[]>(textBlock.text);
}

export async function discoverJobsForUser(
  userId: string,
  forceRefresh = false
): Promise<void> {
  const resume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!resume) {
    throw new Error(
      "No resume found. Please upload your resume before discovering jobs."
    );
  }

  const { profile, companies } = await getOrCreateProfile(
    userId,
    resume.content,
    forceRefresh
  );

  console.log(
    `[Discovery] Profile: seniority=${profile.seniorityLevel}, yoe=${profile.yearsOfExperience}, companies=${companies.length}`
  );

  const knownNames = new Set(companies.map((c) => c.name.toLowerCase()));
  const supplemental = VERIFIED_COMPANIES.filter(
    (vc) => !knownNames.has(vc.name.toLowerCase())
  );
  const allCompanies = [...companies, ...supplemental];

  console.log(
    `[Discovery] Querying ${allCompanies.length} companies (${companies.length} from profile + ${supplemental.length} verified fallback)`
  );

  const [profileJobs, fundedResult] = await Promise.all([
    fetchJobsForCompanies(allCompanies),
    discoverFundedCompanies(profile),
  ]);

  const fundedJobs = await fetchJobsForCompanies(fundedResult.companies);

  const jobMap = new Map<string, NormalizedJob>();
  for (const job of [...profileJobs, ...fundedJobs]) {
    if (!jobMap.has(job.atsJobId)) {
      jobMap.set(job.atsJobId, job);
    }
  }

  const allJobs = Array.from(jobMap.values());

  const sourceCounts = { greenhouse: 0, lever: 0, ashby: 0 };
  for (const job of allJobs) {
    sourceCounts[job.source]++;
  }
  console.log(
    `[Discovery] Total jobs fetched: ${allJobs.length} (greenhouse=${sourceCounts.greenhouse}, lever=${sourceCounts.lever}, ashby=${sourceCounts.ashby})`
  );

  if (allJobs.length === 0) return;

  const ranked = await rankAndScore(
    allJobs,
    resume.content,
    profile,
    fundedResult.fundingInfo
  );

  const upserts = ranked.map((rankedJob) => {
    const source = jobMap.get(rankedJob.atsJobId);
    if (!source) return null;

    return prisma.discoveredJob.upsert({
      where: {
        userId_atsJobId: { userId, atsJobId: rankedJob.atsJobId },
      },
      update: {
        fitScore: rankedJob.fitScore,
        matchExplanation: rankedJob.matchExplanation,
        seniorityLevel: rankedJob.seniorityLevel,
        remoteStatus: rankedJob.remoteStatus,
        companyFunding: rankedJob.companyFunding,
        discoveredAt: new Date(),
      },
      create: {
        userId,
        atsJobId: source.atsJobId,
        title: source.title,
        company: source.company,
        location: source.location,
        url: source.url,
        description: source.description,
        source: source.source,
        postedAt: source.postedAt,
        salaryRange: source.salaryRange,
        fitScore: rankedJob.fitScore,
        matchExplanation: rankedJob.matchExplanation,
        seniorityLevel: rankedJob.seniorityLevel,
        remoteStatus: rankedJob.remoteStatus,
        companyFunding: rankedJob.companyFunding,
      },
    });
  });

  await Promise.all(upserts.filter(Boolean));
}
