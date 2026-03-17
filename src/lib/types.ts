export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "PHONE_SCREEN",
  "TECHNICAL",
  "FINAL",
  "OFFER",
  "REJECTED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  FINAL: "Final Round",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export interface JobData {
  company: string;
  role: string;
  location: string;
  salary_range: string | null;
  requirements: string[];
  nice_to_haves: string[];
  summary: string;
}

export interface FitScore {
  fit_score: number;
  fit_reasoning: string[];
}

export interface ApplicationRecord {
  id: string;
  url: string;
  company: string;
  role: string;
  location: string;
  salaryRange: string | null;
  summary: string;
  requirements: string[];
  niceToHaves: string[];
  fitScore: number;
  fitReasoning: string[];
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
