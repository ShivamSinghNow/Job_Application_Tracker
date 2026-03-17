"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  DollarSign,
  CheckCircle2,
  Lightbulb,
  FileText,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Target,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GlitchText, GlitchIcon } from "@/components/glitch-text";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "FINAL", label: "Final Round" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

function getFitScoreColor(score: number) {
  if (score >= 75)
    return {
      bg: "bg-neon-green/20",
      text: "text-neon-green",
      border: "border-neon-green/40",
      bar: "bg-neon-green",
    };
  if (score >= 50)
    return {
      bg: "bg-neon-orange/20",
      text: "text-neon-orange",
      border: "border-neon-orange/40",
      bar: "bg-neon-orange",
    };
  return {
    bg: "bg-destructive/20",
    text: "text-destructive",
    border: "border-destructive/40",
    bar: "bg-destructive",
  };
}

function getStatusLabel(status: ApplicationStatus) {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label ?? status;
}

function getStatusColor(status: ApplicationStatus) {
  switch (status) {
    case "OFFER":
      return "bg-neon-green/20 text-neon-green border-neon-green/40";
    case "REJECTED":
      return "bg-destructive/20 text-destructive border-destructive/40";
    case "TECHNICAL":
    case "FINAL":
      return "bg-neon-magenta/20 text-neon-magenta border-neon-magenta/40";
    case "PHONE_SCREEN":
      return "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-border bg-card/50 hover:bg-accent hover:border-neon-cyan dark:neon-border-cyan"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-neon-cyan" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="gap-2 cursor-pointer"
        >
          <Sun className="size-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="gap-2 cursor-pointer"
        >
          <Moon className="size-4" />
          <span>Dark</span>
          <Badge
            variant="outline"
            className="ml-auto text-[10px] px-1.5 py-0 bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40"
          >
            Cyber
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="gap-2 cursor-pointer"
        >
          <Monitor className="size-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function JobDetailView({
  application,
}: {
  application: ApplicationRecord;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [checkedRequirements, setCheckedRequirements] = useState<Set<number>>(
    new Set()
  );

  const scoreColors = getFitScoreColor(application.fitScore);

  const updateField = useCallback(
    async (data: { status?: ApplicationStatus; notes?: string }) => {
      setIsSaving(true);
      try {
        await fetch(`/api/jobs/${application.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setIsSaving(false);
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

  const toggleRequirement = (index: number) => {
    setCheckedRequirements((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const isPerfectMatch =
    application.potentialImprovements.length === 1 &&
    application.potentialImprovements[0]
      .toLowerCase()
      .includes("perfect match");

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden dark:block hidden">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-neon-cyan/8 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-neon-magenta/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-neon-cyan/3 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-neon-cyan transition-colors"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>

        {/* Header Section */}
        <Card className="mb-6 border-border bg-card/80 backdrop-blur-sm dark:neon-border-cyan dark:bg-card/60">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <GlitchIcon className="flex size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-neon-cyan/20 dark:neon-glow-cyan transition-all">
                    <Cpu className="size-5 text-primary dark:text-neon-cyan" />
                  </GlitchIcon>
                  <div>
                    <GlitchText
                      as="h1"
                      className="text-2xl font-bold tracking-tight text-foreground dark:text-neon-cyan dark:neon-text-cyan"
                    >
                      {application.role}
                    </GlitchText>
                    <p className="text-lg text-muted-foreground">
                      {application.company}
                    </p>
                  </div>
                </div>
              </div>

              <Select
                value={status}
                onValueChange={(value) =>
                  handleStatusChange(value as ApplicationStatus)
                }
              >
                <SelectTrigger
                  className={cn(
                    "w-[160px] border font-medium",
                    getStatusColor(status)
                  )}
                >
                  <SelectValue>{getStatusLabel(status)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metadata Row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary dark:text-neon-cyan" />
                {application.location}
              </span>
              {application.salaryRange && (
                <span className="inline-flex items-center gap-1.5">
                  <DollarSign className="size-4 text-neon-green" />
                  {application.salaryRange}
                </span>
              )}
              <a
                href={application.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary dark:text-neon-magenta hover:underline"
              >
                <ExternalLink className="size-4" />
                View Original Posting
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card className="mb-6 border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <FileText className="size-5 text-primary dark:text-neon-cyan" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {application.summary}
            </p>
          </CardContent>
        </Card>

        {/* Fit Score Section */}
        <Card className="mb-6 border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Target className="size-5 text-primary dark:text-neon-cyan" />
              Fit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={cn(
                  "text-xl font-bold tabular-nums px-4 py-2",
                  scoreColors.bg,
                  scoreColors.text,
                  scoreColors.border
                )}
              >
                {application.fitScore}%
              </Badge>
              <div className="flex-1 space-y-1">
                <Progress
                  value={application.fitScore}
                  className="h-3 bg-muted"
                  indicatorClassName={scoreColors.bar}
                />
                <p className="text-xs text-muted-foreground">
                  {application.fitScore}/100 match score
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                Why this score?
              </h4>
              <ul className="space-y-2">
                {application.fitReasoning.map((reason, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2
                      className={cn("size-4 mt-0.5 shrink-0", scoreColors.text)}
                    />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Grid: Requirements & Improvements */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <CheckCircle2 className="size-5 text-primary dark:text-neon-cyan" />
                Requirements
              </CardTitle>
              <CardDescription>
                Check off requirements as you review them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {application.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Checkbox
                      id={`req-${index}`}
                      checked={checkedRequirements.has(index)}
                      onCheckedChange={() => toggleRequirement(index)}
                      className="mt-0.5 border-border data-[state=checked]:bg-neon-cyan data-[state=checked]:border-neon-cyan dark:data-[state=checked]:text-black"
                    />
                    <label
                      htmlFor={`req-${index}`}
                      className={cn(
                        "text-sm cursor-pointer transition-colors",
                        checkedRequirements.has(index)
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {req}
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Lightbulb className="size-5 text-neon-orange" />
                Potential Improvements
              </CardTitle>
              <CardDescription>
                Suggestions to strengthen your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPerfectMatch ? (
                <div className="flex items-center gap-3 rounded-lg border border-neon-green/40 bg-neon-green/10 p-4 dark:neon-glow-cyan">
                  <Sparkles className="size-6 text-neon-green shrink-0" />
                  <div>
                    <p className="font-medium text-neon-green">
                      Perfect Match!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your profile aligns excellently with this role.
                    </p>
                  </div>
                </div>
              ) : application.potentialImprovements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No suggestions available.
                </p>
              ) : (
                <ul className="space-y-3">
                  {application.potentialImprovements.map(
                    (improvement, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-neon-orange/30 bg-neon-orange/5 p-3"
                      >
                        <p className="text-sm text-foreground">{improvement}</p>
                      </li>
                    )
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        <Card className="border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <FileText className="size-5 text-primary dark:text-neon-magenta" />
                Personal Notes
              </CardTitle>
              {isSaving && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Saving...
                </span>
              )}
            </div>
            <CardDescription>
              Add notes about this application for future reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add your notes here..."
              className="min-h-[120px] resize-none border-input bg-background/50 focus:border-primary dark:focus:border-neon-cyan focus:ring-primary/20 dark:focus:ring-neon-cyan/20"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
