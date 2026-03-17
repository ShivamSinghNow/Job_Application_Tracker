import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export interface ApplicationRow {
  id: string;
  url: string;
  company: string;
  role: string;
  location: string;
  salary_range: string | null;
  summary: string;
  requirements: string;
  potential_improvements: string;
  fit_score: number;
  fit_reasoning: string;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ResumeRow {
  id: string;
  filename: string;
  content: string;
  created_at: Date;
}
