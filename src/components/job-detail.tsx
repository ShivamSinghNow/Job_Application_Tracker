"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FitBadge } from "@/components/fit-badge";
import { StatusSelect } from "@/components/status-select";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/types";

export function JobDetail({ application }: { application: ApplicationRecord }) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.notes || "");
  const [saving, setSaving] = useState(false);

  const updateField = useCallback(
    async (data: { status?: ApplicationStatus; notes?: string }) => {
      setSaving(true);
      try {
        await fetch(`/api/jobs/${application.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [application.id]
  );

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setStatus(newStatus);
    updateField({ status: newStatus });
  };

  const handleNotesBlur = () => {
    if (notes !== (application.notes || "")) {
      updateField({ notes });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {application.role}
            </h1>
            <p className="mt-1 text-lg text-muted-foreground">
              {application.company}
            </p>
          </div>
          <StatusSelect value={status} onChange={handleStatusChange} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{application.location}</span>
          {application.salaryRange && (
            <>
              <span>&middot;</span>
              <span>{application.salaryRange}</span>
            </>
          )}
          <span>&middot;</span>
          <a
            href={application.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View Original Posting
          </a>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="mb-2 text-lg font-semibold">Summary</h2>
        <p className="text-muted-foreground">{application.summary}</p>
      </div>

      <Separator />

      <div>
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold">Fit Score</h2>
          <FitBadge score={application.fitScore} />
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${
                  application.fitScore >= 75
                    ? "bg-emerald-500"
                    : application.fitScore >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${application.fitScore}%` }}
              />
            </div>
            <span className="text-sm font-medium">{application.fitScore}/100</span>
          </div>
          <ul className="space-y-2">
            {application.fitReasoning.map((reason, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 shrink-0">&bull;</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Separator />

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Requirements</h2>
          <ul className="space-y-2">
            {application.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0 rounded border border-white/60 accent-neon-cyan"
                />
                <span className="text-sm text-muted-foreground">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Potential Improvements</h2>
          {application.potentialImprovements.length === 1 &&
          application.potentialImprovements[0].toLowerCase().includes("perfect match") ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <span className="text-lg">&#10003;</span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {application.potentialImprovements[0]}
              </span>
            </div>
          ) : application.potentialImprovements.length > 0 ? (
            <ul className="space-y-2">
              {application.potentialImprovements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 rounded-md border bg-muted/30 p-3">
                  <span className="mt-0.5 shrink-0 text-sm text-primary">&rarr;</span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No suggestions available</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>
        <Textarea
          placeholder="Add your notes about this application..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={4}
          className="resize-y"
        />
      </div>
    </div>
  );
}
