"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Loader2,
  ExternalLink,
  MapPin,
  Clock,
  Briefcase,
  X,
} from "lucide-react";

export interface DiscoveredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  salaryRange: string | null;
  source: string;
  fitScore: number;
  matchExplanation: string;
  companyFunding: string | null;
  remoteStatus: string | null;
  seniorityLevel: string | null;
  postedAt: string | null;
  discoveredAt: string;
  dismissed: boolean;
  tracked: boolean;
}

interface DiscoveredJobsProps {
  hasResume: boolean;
}

function formatPostedDate(postedAt: string | null): string {
  if (!postedAt) return "Posted recently";
  const days = Math.floor(
    (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

function FitScoreBadge({ score }: { score: number }) {
  const colorClass =
    score >= 75
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-neon-green/20 dark:text-neon-green border-transparent"
      : score >= 50
        ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-neon-orange/20 dark:text-neon-orange border-transparent"
        : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-transparent";

  return (
    <Badge variant="outline" className={colorClass}>
      {score}% fit
    </Badge>
  );
}

export function DiscoveredJobs({ hasResume }: DiscoveredJobsProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/discover");
        if (res.ok) {
          const data = await res.json();
          const list: DiscoveredJob[] = data.jobs ?? [];
          setJobs(list.filter((j) => !j.dismissed && !j.tracked));
        }
      } catch {
        // silently fail on initial load
      } finally {
        setFetching(false);
      }
    }
    fetchJobs();
  }, []);

  const handleDiscover = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const list: DiscoveredJob[] = data.jobs ?? [];
        setJobs(list.filter((j) => !j.dismissed && !j.tracked));
      }
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTrack = useCallback(
    async (id: string) => {
      setTrackingId(id);
      try {
        const res = await fetch(`/api/discover/${id}/track`, { method: "POST" });
        if (res.ok) {
          setJobs((prev) => prev.filter((j) => j.id !== id));
          router.refresh();
        }
      } catch {
        // handle error silently
      } finally {
        setTrackingId(null);
      }
    },
    [router]
  );

  const handleDismiss = useCallback(async (id: string) => {
    setDismissingId(id);
    try {
      const res = await fetch(`/api/discover/${id}/dismiss`, { method: "POST" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
      }
    } catch {
      // handle error silently
    } finally {
      setDismissingId(null);
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight dark:text-neon-cyan">
            <Sparkles className="size-6" />
            Discover Jobs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered job recommendations based on your resume
          </p>
        </div>
        <Button
          onClick={handleDiscover}
          disabled={loading || !hasResume}
          className="dark:bg-neon-cyan/20 dark:text-neon-cyan dark:hover:bg-neon-cyan/30 dark:border-neon-cyan/50"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Find Jobs Now
            </>
          )}
        </Button>
      </div>

      {loading && (
        <Card className="border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground dark:text-neon-cyan" />
              <div className="space-y-2">
                <div className="mx-auto h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="mx-auto h-4 w-64 animate-pulse rounded bg-muted" />
              </div>
              <p className="text-sm text-muted-foreground">
                Analyzing your resume and searching across job boards... This
                takes about 30 seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !fetching && jobs.length === 0 && (
        <Card className="border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <Briefcase className="size-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                {!hasResume
                  ? "Upload your resume first to discover matching jobs"
                  : "No jobs discovered yet. Click 'Find Jobs Now' to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {fetching && !loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="border-border bg-card/80 backdrop-blur-sm dark:bg-card/60 transition-colors hover:border-border/80 dark:hover:border-neon-cyan/30"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:underline dark:text-neon-cyan"
                  >
                    {job.title}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{job.company}</span>
                  {job.location && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {job.location}
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-1.5">
                  <FitScoreBadge score={job.fitScore} />
                  {job.companyFunding && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100 dark:bg-neon-magenta/20 dark:text-neon-magenta"
                    >
                      {job.companyFunding}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="border-transparent bg-muted text-muted-foreground"
                  >
                    {job.source}
                  </Badge>
                  {job.remoteStatus && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-muted text-muted-foreground"
                    >
                      {job.remoteStatus}
                    </Badge>
                  )}
                  {job.seniorityLevel && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-muted text-muted-foreground"
                    >
                      {job.seniorityLevel}
                    </Badge>
                  )}
                  {job.salaryRange && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-neon-green/15 dark:text-neon-green"
                    >
                      {job.salaryRange}
                    </Badge>
                  )}
                </div>

                <div className="border-l-2 border-primary/30 pl-3 dark:border-neon-cyan/40">
                  <p className="text-[0.9rem] leading-relaxed text-foreground/90">
                    {job.matchExplanation}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between pt-0">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatPostedDate(job.postedAt)}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(job.id)}
                    disabled={dismissingId === job.id}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {dismissingId === job.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleTrack(job.id)}
                    disabled={trackingId === job.id}
                    className={cn(
                      "dark:bg-neon-cyan/20 dark:text-neon-cyan dark:hover:bg-neon-cyan/30 dark:border-neon-cyan/50"
                    )}
                  >
                    {trackingId === job.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Briefcase className="size-3.5" />
                    )}
                    Track
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
