"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Upload,
  Link2,
  Loader2,
  Check,
  Trash2,
  ChevronDown,
  ChevronRight,
  MapPin,
  DollarSign,
  FileText,
  ExternalLink,
  Zap,
  Target,
  Cpu,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GlitchText, GlitchIcon } from "@/components/glitch-text";

export interface ApplicationRecord {
  id: string;
  url: string;
  company: string;
  role: string;
  location: string;
  salaryRange: string | null;
  summary: string;
  requirements: string[];
  potentialImprovements: string[];
  fitScore: number;
  fitReasoning: string[];
  status:
    | "SAVED"
    | "APPLIED"
    | "PHONE_SCREEN"
    | "TECHNICAL"
    | "FINAL"
    | "OFFER"
    | "REJECTED";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JobTrackerDashboardProps {
  applications: ApplicationRecord[];
  onStatusChange?: (id: string, status: ApplicationRecord["status"]) => void;
  onDelete?: (id: string) => void;
  onTrackJob?: (url: string) => void;
  onResumeUpload?: (file: File) => void;
  isLoading?: boolean;
  loadingStep?: 1 | 2 | 3;
}

const STATUS_OPTIONS: { value: ApplicationRecord["status"]; label: string }[] =
  [
    { value: "SAVED", label: "Saved" },
    { value: "APPLIED", label: "Applied" },
    { value: "PHONE_SCREEN", label: "Phone Screen" },
    { value: "TECHNICAL", label: "Technical" },
    { value: "FINAL", label: "Final Round" },
    { value: "OFFER", label: "Offer" },
    { value: "REJECTED", label: "Rejected" },
  ];

const LOADING_STEPS = [
  { step: 1, label: "Fetching page", icon: Zap },
  { step: 2, label: "Extracting details", icon: Cpu },
  { step: 3, label: "Scoring fit", icon: Target },
];

function getFitScoreColor(score: number) {
  if (score >= 75) return "bg-neon-green/20 text-neon-green border-neon-green/40";
  if (score >= 50) return "bg-neon-orange/20 text-neon-orange border-neon-orange/40";
  return "bg-destructive/20 text-destructive border-destructive/40";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusLabel(status: ApplicationRecord["status"]) {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label ?? status;
}

function getStatusColor(status: ApplicationRecord["status"]) {
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
  const { theme, setTheme } = useTheme();

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
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
          <Sun className="size-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
          <Moon className="size-4" />
          <span>Dark</span>
          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40">
            Cyber
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
          <Monitor className="size-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function JobTrackerDashboard({
  applications,
  onStatusChange,
  onDelete,
  onTrackJob,
  onResumeUpload,
  isLoading = false,
  loadingStep = 1,
}: JobTrackerDashboardProps) {
  const [jobUrl, setJobUrl] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
      onResumeUpload?.(file);
    }
  };

  const handleTrackJob = () => {
    if (jobUrl.trim()) {
      onTrackJob?.(jobUrl.trim());
      setJobUrl("");
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      {/* Ambient glow effects - only visible in dark mode */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden dark:block hidden">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-neon-cyan/8 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-neon-magenta/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-neon-cyan/3 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GlitchIcon className="flex size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-neon-cyan/20 dark:neon-glow-cyan transition-all">
                <Cpu className="size-5 text-primary dark:text-neon-cyan" />
              </GlitchIcon>
              <GlitchText
                as="h1"
                className="text-3xl font-bold tracking-tight text-foreground dark:text-neon-cyan dark:neon-text-cyan"
              >
                Job Tracker
              </GlitchText>
            </div>
            <p className="text-muted-foreground">
              AI-powered application tracking and fit analysis
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Top Section - Upload and Track */}
        <Card className="mb-8 border-border bg-card/80 backdrop-blur-sm dark:neon-border-cyan dark:bg-card/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-foreground dark:text-neon-cyan flex items-center gap-2">
              <Zap className="size-5" />
              Add New Application
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload your resume and paste a job posting URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resume Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Resume
              </label>
              <div className="flex items-center gap-3">
                <label className="group flex h-10 cursor-pointer items-center gap-2 rounded-md border border-accent dark:border-neon-magenta/40 bg-accent/50 dark:bg-neon-magenta/10 px-4 text-sm font-medium text-accent-foreground dark:text-neon-magenta transition-all hover:bg-accent dark:hover:bg-neon-magenta/20 dark:hover:neon-glow-magenta">
                  <Upload className="size-4" />
                  <span>Upload PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleResumeChange}
                  />
                </label>
                {resumeFileName && (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="size-4 text-primary dark:text-neon-cyan" />
                    {resumeFileName}
                  </span>
                )}
              </div>
            </div>

            {/* URL Input and Track Button */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Job Posting URL
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground dark:text-neon-cyan" />
                  <Input
                    type="url"
                    placeholder="https://example.com/jobs/software-engineer"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="pl-9 border-input bg-background/50 focus:border-primary dark:focus:border-neon-cyan focus:ring-primary/20 dark:focus:ring-neon-cyan/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTrackJob();
                    }}
                  />
                </div>
                <Button
                  onClick={handleTrackJob}
                  disabled={!jobUrl.trim() || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-neon-cyan dark:text-black dark:hover:bg-neon-cyan/90 dark:neon-glow-cyan transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Target className="size-4 mr-2" />
                      Track Job
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Loading Stepper */}
            {isLoading && (
              <div className="rounded-lg border border-primary/30 dark:border-neon-cyan/30 bg-primary/5 dark:bg-neon-cyan/5 p-4 dark:animate-neon-pulse">
                <div className="flex items-center gap-8">
                  {LOADING_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.step} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-lg border transition-all",
                            loadingStep > step.step
                              ? "border-neon-green/60 bg-neon-green/20 text-neon-green"
                              : loadingStep === step.step
                              ? "border-primary dark:border-neon-cyan bg-primary/20 dark:bg-neon-cyan/20 text-primary dark:text-neon-cyan animate-pulse"
                              : "border-border/50 bg-muted/30 text-muted-foreground/50"
                          )}
                        >
                          {loadingStep > step.step ? (
                            <Check className="size-4" />
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium transition-colors",
                            loadingStep > step.step
                              ? "text-neon-green"
                              : loadingStep === step.step
                              ? "text-primary dark:text-neon-cyan"
                              : "text-muted-foreground/50"
                          )}
                        >
                          {step.label}
                        </span>
                        {index < LOADING_STEPS.length - 1 && (
                          <div
                            className={cn(
                              "ml-2 h-px w-12",
                              loadingStep > step.step
                                ? "bg-neon-green"
                                : "bg-border/30"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="overflow-hidden border-border bg-card/80 backdrop-blur-sm dark:bg-card/60">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-foreground">Your Applications</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {applications.length} tracked application
                  {applications.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 dark:bg-neon-cyan/10 text-primary dark:text-neon-cyan border-primary/40 dark:border-neon-cyan/40">
                AI Scored
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Company</TableHead>
                  <TableHead className="text-center text-muted-foreground">Fit Score</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Date Added</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Target className="size-8 text-primary/50 dark:text-neon-cyan/50" />
                        <span>No applications tracked yet.</span>
                        <span className="text-sm">Add your first job posting above.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const isExpanded = expandedRows.has(app.id);
                    return (
                      <Fragment key={app.id}>
                        <TableRow
                          className={cn(
                            "cursor-pointer transition-colors border-b border-border/50",
                            isExpanded ? "bg-primary/5 dark:bg-neon-cyan/5" : "hover:bg-muted/30"
                          )}
                          onClick={() => toggleRow(app.id)}
                        >
                          <TableCell className="pr-0">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 text-muted-foreground hover:text-primary dark:hover:text-neon-cyan"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(app.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            <Link
                              href={`/jobs/${app.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-foreground hover:text-primary dark:hover:text-neon-cyan transition-colors"
                            >
                              {app.role}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {app.company}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono font-semibold tabular-nums",
                                getFitScoreColor(app.fitScore)
                              )}
                            >
                              {app.fitScore}%
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={app.status}
                              onValueChange={(value) =>
                                onStatusChange?.(
                                  app.id,
                                  value as ApplicationRecord["status"]
                                )
                              }
                            >
                              <SelectTrigger 
                                size="sm" 
                                className={cn(
                                  "w-[130px] border",
                                  getStatusColor(app.status)
                                )}
                              >
                                <SelectValue>
                                  {getStatusLabel(app.status)}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                {STATUS_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {formatDate(app.createdAt)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete?.(app.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <TableRow className="bg-primary/5 dark:bg-neon-cyan/5 hover:bg-primary/5 dark:hover:bg-neon-cyan/5 border-b border-border/50">
                            <TableCell colSpan={7} className="p-0">
                              <div className="grid gap-6 p-6 md:grid-cols-2">
                                {/* Left Column */}
                                <div className="space-y-4">
                                  {/* Summary */}
                                  <div>
                                    <h4 className="mb-2 text-sm font-medium text-primary dark:text-neon-cyan flex items-center gap-2">
                                      <FileText className="size-4" />
                                      Summary
                                    </h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                      {app.summary}
                                    </p>
                                  </div>

                                  {/* Location & Salary */}
                                  <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="size-4 text-accent dark:text-neon-magenta" />
                                      <span className="text-muted-foreground">{app.location}</span>
                                    </div>
                                    {app.salaryRange && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="size-4 text-neon-green" />
                                        <span className="text-neon-green font-mono">{app.salaryRange}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Requirements */}
                                  <div>
                                    <h4 className="mb-2 text-sm font-medium text-primary dark:text-neon-cyan">
                                      Requirements
                                    </h4>
                                    <ul className="space-y-1.5">
                                      {app.requirements
                                        .slice(0, 5)
                                        .map((req, index) => (
                                          <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                          >
                                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60 dark:bg-neon-cyan/60" />
                                            <span>{req}</span>
                                          </li>
                                        ))}
                                    </ul>
                                    {app.requirements.length > 5 && (
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        +{app.requirements.length - 5} more
                                        requirements
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                  {/* Fit Reasoning */}
                                  <div>
                                    <h4 className="mb-2 text-sm font-medium text-accent dark:text-neon-magenta flex items-center gap-2">
                                      <Target className="size-4" />
                                      Fit Analysis
                                    </h4>
                                    <ul className="space-y-1.5">
                                      {app.fitReasoning.map((reason, index) => (
                                        <li
                                          key={index}
                                          className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neon-green" />
                                          <span>{reason}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* View Full Details Link */}
                                  <div className="pt-2">
                                    <Link
                                      href={`/jobs/${app.id}`}
                                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary dark:text-neon-cyan hover:text-primary/80 dark:hover:text-neon-cyan/80 transition-colors"
                                    >
                                      View full details
                                      <ExternalLink className="size-3.5" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <span className="font-mono dark:text-neon-cyan/60">v0.1.0</span> <span className="dark:text-neon-magenta/60">//</span> Powered by AI
        </div>
      </div>
    </div>
  );
}
