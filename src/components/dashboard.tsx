"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  JobTrackerDashboard,
  type ApplicationRecord,
} from "@/components/job-tracker-dashboard";

interface ResumeInfo {
  hasResume: boolean;
  filename?: string;
  contentLength?: number;
}

interface UserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function Dashboard({
  initialApplications,
  initialResume,
  user,
}: {
  initialApplications: ApplicationRecord[];
  initialResume: ResumeInfo;
  user?: UserInfo;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [hasResume, setHasResume] = useState(initialResume.hasResume);
  const [resumeFileName, setResumeFileName] = useState<string | null>(
    initialResume.filename ?? null
  );
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<1 | 2 | 3>(1);

  const handleTrackJob = useCallback(
    async (url: string) => {
      if (loading) return;

      setLoading(true);
      setLoadingStep(1);

      const stepTimer1 = setTimeout(() => setLoadingStep(2), 3000);
      const stepTimer2 = setTimeout(() => setLoadingStep(3), 8000);

      try {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to track job");
        }

        const job = await res.json();
        setApplications((prev) => [job, ...prev]);
        router.refresh();
      } catch (err) {
        console.error("Failed to track job:", err);
      } finally {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        setLoading(false);
        setLoadingStep(1);
      }
    },
    [loading, router]
  );

  const handleStatusChange = useCallback(
    async (id: string, status: ApplicationRecord["status"]) => {
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

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  }, []);

  const handleResumeUpload = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/resume", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload resume");
        }

        const data = await res.json();
        setHasResume(true);
        setResumeFileName(data.filename);
        router.refresh();
      } catch (err) {
        console.error("Failed to upload resume:", err);
        setResumeFileName(null);
      }
    },
    [router]
  );

  return (
    <JobTrackerDashboard
      applications={applications}
      onStatusChange={handleStatusChange}
      onDelete={handleDelete}
      onTrackJob={handleTrackJob}
      onResumeUpload={handleResumeUpload}
      isLoading={loading}
      loadingStep={loadingStep}
      hasResume={hasResume}
      initialResumeFileName={resumeFileName}
      user={user}
    />
  );
}
