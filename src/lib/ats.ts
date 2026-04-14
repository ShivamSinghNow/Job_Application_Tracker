export interface NormalizedJob {
  atsJobId: string;
  source: "greenhouse" | "lever" | "ashby";
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  postedAt: Date | null;
  salaryRange: string | null;
}

export interface TargetCompany {
  name: string;
  greenhouse?: string;
  lever?: string;
  ashby?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

const FETCH_HEADERS = { "User-Agent": "JobTracker/1.0" };
const FETCH_TIMEOUT = 10_000;

interface GreenhouseJob {
  id: number | string;
  title?: string;
  location?: { name?: string };
  updated_at?: string;
  absolute_url?: string;
  content?: string;
}

interface LeverPosting {
  id: string;
  text?: string;
  categories?: { location?: string; team?: string; commitment?: string };
  createdAt?: number;
  hostedUrl?: string;
  descriptionPlain?: string;
}

interface AshbyJob {
  id: string;
  title?: string;
  location?: string;
  publishedAt?: string;
  jobUrl?: string;
  descriptionPlain?: string;
}

export async function fetchGreenhouseJobs(
  companySlug: string,
  companyName: string
): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs?content=true`,
      {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      }
    );

    if (!res.ok) {
      console.warn(`Greenhouse: non-200 status (${res.status}) for ${companySlug}`);
      return [];
    }

    const data = await res.json();
    const jobs: NormalizedJob[] = (data.jobs ?? []).map((job: GreenhouseJob) => ({
      atsJobId: `gh_${job.id}`,
      source: "greenhouse" as const,
      title: job.title ?? "",
      company: companyName,
      location: job.location?.name ?? "Unknown",
      url: job.absolute_url ?? "",
      description: truncate(stripHtml(job.content ?? ""), 2000),
      postedAt: job.updated_at ? new Date(job.updated_at) : null,
      salaryRange: null,
    }));

    return jobs;
  } catch (err) {
    console.warn(`Greenhouse: failed to fetch jobs for ${companySlug}`, err);
    return [];
  }
}

export async function fetchLeverJobs(
  companySlug: string,
  companyName: string
): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${companySlug}?mode=json`,
      {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      }
    );

    if (!res.ok) {
      console.warn(`Lever: non-200 status (${res.status}) for ${companySlug}`);
      return [];
    }

    const data = await res.json();
    const postings: LeverPosting[] = Array.isArray(data) ? data : [];

    const jobs: NormalizedJob[] = postings.map((posting: LeverPosting) => ({
      atsJobId: `lv_${posting.id}`,
      source: "lever" as const,
      title: posting.text ?? "",
      company: companyName,
      location: posting.categories?.location ?? "Unknown",
      url: posting.hostedUrl ?? "",
      description: truncate(posting.descriptionPlain ?? "", 2000),
      postedAt: posting.createdAt ? new Date(posting.createdAt) : null,
      salaryRange: posting.categories?.commitment ?? null,
    }));

    return jobs;
  } catch (err) {
    console.warn(`Lever: failed to fetch jobs for ${companySlug}`, err);
    return [];
  }
}

export async function fetchAshbyJobs(
  companySlug: string,
  companyName: string
): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${companySlug}`,
      {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      }
    );

    if (!res.ok) {
      console.warn(`Ashby: non-200 status (${res.status}) for ${companySlug}`);
      return [];
    }

    const data = await res.json();
    const jobs: NormalizedJob[] = (data.jobs ?? []).map((job: AshbyJob) => ({
      atsJobId: `ab_${job.id}`,
      source: "ashby" as const,
      title: job.title ?? "",
      company: companyName,
      location: job.location ?? "Unknown",
      url: job.jobUrl ?? "",
      description: truncate(job.descriptionPlain ?? "", 2000),
      postedAt: job.publishedAt ? new Date(job.publishedAt) : null,
      salaryRange: null,
    }));

    return jobs;
  } catch (err) {
    console.warn(`Ashby: failed to fetch jobs for ${companySlug}`, err);
    return [];
  }
}

export async function fetchAllJobsForCompany(
  company: TargetCompany
): Promise<NormalizedJob[]> {
  const promises: Promise<NormalizedJob[]>[] = [];

  if (company.greenhouse) {
    promises.push(fetchGreenhouseJobs(company.greenhouse, company.name));
  }
  if (company.lever) {
    promises.push(fetchLeverJobs(company.lever, company.name));
  }
  if (company.ashby) {
    promises.push(fetchAshbyJobs(company.ashby, company.name));
  }

  const results = await Promise.allSettled(promises);
  const allJobs: NormalizedJob[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allJobs.push(...result.value);
    } else {
      console.warn("fetchAllJobsForCompany: a fetch was rejected", result.reason);
    }
  }

  return allJobs;
}

export const VERIFIED_COMPANIES: TargetCompany[] = [
  // Greenhouse — verified working slugs
  { name: "Stripe", greenhouse: "stripe" },
  { name: "Cloudflare", greenhouse: "cloudflare" },
  { name: "Coinbase", greenhouse: "coinbase" },
  { name: "Databricks", greenhouse: "databricks" },
  { name: "Datadog", greenhouse: "datadog" },
  { name: "Discord", greenhouse: "discord" },
  { name: "Reddit", greenhouse: "reddit" },
  { name: "Robinhood", greenhouse: "robinhood" },
  { name: "Lyft", greenhouse: "lyft" },
  { name: "Instacart", greenhouse: "instacart" },
  { name: "Gusto", greenhouse: "gusto" },
  { name: "Twitch", greenhouse: "twitch" },
  { name: "CockroachDB", greenhouse: "cockroachlabs" },
  // Ashby — verified working slugs
  { name: "Ramp", ashby: "ramp" },
  { name: "Notion", ashby: "notion" },
  { name: "Linear", ashby: "linear" },
  { name: "Replit", ashby: "replit" },
  { name: "Cohere", ashby: "cohere" },
  { name: "Modal", ashby: "modal" },
  { name: "Anyscale", ashby: "anyscale" },
  { name: "Watershed", ashby: "watershed" },
  { name: "Plaid", ashby: "plaid" },
  { name: "Deel", ashby: "deel" },
  { name: "Resend", ashby: "resend" },
  // Lever — verified working slugs
  { name: "Spotify", lever: "spotify" },
  { name: "Samsara", lever: "samsara" },
  { name: "NerdWallet", lever: "nerdwallet" },
  { name: "Netlify", lever: "netlify" },
  { name: "Figma", lever: "figma" },
];

export async function fetchJobsForCompanies(
  companies: TargetCompany[]
): Promise<NormalizedJob[]> {
  const results = await Promise.allSettled(
    companies.map((company) => fetchAllJobsForCompany(company))
  );

  const allJobs: NormalizedJob[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allJobs.push(...result.value);
    } else {
      console.warn("fetchJobsForCompanies: a company fetch was rejected", result.reason);
    }
  }

  return allJobs;
}
