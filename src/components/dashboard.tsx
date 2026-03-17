"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FitBadge } from "@/components/fit-badge";
import { StatusSelect } from "@/components/status-select";
import { ResumeUpload } from "@/components/resume-upload";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/types";

const ENRICHMENT_STEPS = [
  "Fetching page...",
  "Extracting details...",
  "Scoring fit...",
];

interface ResumeInfo {
  hasResume: boolean;
  filename?: string;
  contentLength?: number;
}

export function Dashboard({
  initialApplications,
  initialResume,
}: {
  initialApplications: ApplicationRecord[];
  initialResume: ResumeInfo;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applications, setApplications] = useState(initialApplications);
  const [hasResume, setHasResume] = useState(initialResume.hasResume);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim() || loading) return;

      setLoading(true);
      setError(null);
      setCurrentStep(0);

      const stepTimer1 = setTimeout(() => setCurrentStep(1), 3000);
      const stepTimer2 = setTimeout(() => setCurrentStep(2), 8000);

      try {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to track job");
        }

        const job = await res.json();
        setApplications((prev) => [
          {
            ...job,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          },
          ...prev,
        ]);
        setUrl("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        setLoading(false);
        setCurrentStep(0);
      }
    },
    [url, loading, router]
  );

  const handleStatusChange = useCallback(
    async (id: string, status: ApplicationStatus) => {
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        if (!res.ok) throw new Error("Failed to update status");

        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status } : app))
        );
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Your Resume</h2>
          <ResumeUpload
            initialResume={initialResume}
            onResumeChange={(info) => setHasResume(info.hasResume)}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            type="url"
            placeholder={hasResume ? "Paste a job posting URL..." : "Upload your resume first to start tracking jobs"}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || !hasResume}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !url.trim() || !hasResume}>
            {loading ? "Processing..." : "Track Job"}
          </Button>
        </form>
      </div>

      {loading && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="space-y-2">
            {ENRICHMENT_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2 text-sm">
                {i < currentStep ? (
                  <span className="text-emerald-600">&#10003;</span>
                ) : i === currentStep ? (
                  <span className="animate-pulse text-primary">&#9679;</span>
                ) : (
                  <span className="text-muted-foreground">&#9675;</span>
                )}
                <span
                  className={
                    i <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No applications yet. Paste a job URL above to get started.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-center">Fit Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <>
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === app.id ? null : app.id)
                    }
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/jobs/${app.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {app.role}
                      </Link>
                    </TableCell>
                    <TableCell>{app.company}</TableCell>
                    <TableCell className="text-center">
                      <FitBadge score={app.fitScore} />
                    </TableCell>
                    <TableCell>
                      <StatusSelect
                        value={app.status}
                        onChange={(s) => handleStatusChange(app.id, s)}
                      />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                  {expandedId === app.id && (
                    <TableRow key={`${app.id}-expanded`}>
                      <TableCell colSpan={5} className="whitespace-normal bg-muted/30 p-4">
                        <ExpandedRow app={app} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ExpandedRow({ app }: { app: ApplicationRecord }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="min-w-0">
        <h4 className="mb-1 text-sm font-semibold">Summary</h4>
        <p className="break-words text-sm text-muted-foreground">{app.summary}</p>

        {app.salaryRange && (
          <div className="mt-3">
            <h4 className="mb-1 text-sm font-semibold">Salary Range</h4>
            <p className="text-sm text-muted-foreground">{app.salaryRange}</p>
          </div>
        )}

        <div className="mt-3">
          <h4 className="mb-1 text-sm font-semibold">Location</h4>
          <p className="text-sm text-muted-foreground">{app.location}</p>
        </div>
      </div>

      <div className="min-w-0">
        <h4 className="mb-1 text-sm font-semibold">Fit Reasoning</h4>
        <ul className="space-y-1">
          {app.fitReasoning.map((reason, i) => (
            <li key={i} className="break-words text-sm text-muted-foreground">
              &bull; {reason}
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <h4 className="mb-1 text-sm font-semibold">
            Requirements ({app.requirements.length})
          </h4>
          <ul className="space-y-0.5">
            {app.requirements.slice(0, 5).map((req, i) => (
              <li key={i} className="break-words text-sm text-muted-foreground">
                &bull; {req}
              </li>
            ))}
            {app.requirements.length > 5 && (
              <li className="text-sm text-muted-foreground">
                ...and {app.requirements.length - 5} more
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="md:col-span-2">
        <Link
          href={`/jobs/${app.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View full details &rarr;
        </Link>
      </div>
    </div>
  );
}
