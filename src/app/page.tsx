import Link from "next/link";
import { Cpu, Target, FileText, Zap, BarChart3, Shield } from "lucide-react";

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden dark:block hidden">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-neon-cyan/8 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-neon-magenta/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-neon-cyan/3 blur-[150px]" />
      </div>

      <div className="relative">
        {/* Nav */}
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-neon-cyan/20 dark:neon-glow-cyan transition-all">
              <Cpu className="size-5 text-primary dark:text-neon-cyan" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground dark:text-neon-cyan">
              Power Tracker
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 dark:bg-neon-cyan dark:text-black dark:hover:bg-neon-cyan/90 dark:neon-glow-cyan transition-all"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-20 pb-32 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground dark:border-neon-cyan/30 dark:bg-neon-cyan/5">
              <Zap className="size-3.5 text-primary dark:text-neon-cyan" />
              AI-Powered Job Tracking
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl dark:text-neon-cyan dark:neon-text-cyan">
              Track Jobs.
              <br />
              Score Your Fit.
              <br />
              Land the Role.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Paste a job URL and let AI analyze the posting, score your resume fit,
              and give you actionable improvements. Stop guessing if you&apos;re qualified
              &mdash; know before you apply.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 dark:bg-neon-cyan dark:text-black dark:hover:bg-neon-cyan/90 dark:neon-glow-cyan transition-all"
              >
                Create Free Account
              </Link>
              <Link
                href="/auth/signin"
                className="rounded-md border border-border px-6 py-3 text-base font-semibold text-foreground hover:bg-muted dark:border-neon-cyan/40 dark:text-neon-cyan dark:hover:bg-neon-cyan/10 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Target className="size-6" />}
              title="AI Fit Scoring"
              description="Get a 0-100 fit score comparing your resume against job requirements, with detailed reasoning."
            />
            <FeatureCard
              icon={<FileText className="size-6" />}
              title="Resume Analysis"
              description="Upload your resume once and get personalized improvement suggestions for every job you track."
            />
            <FeatureCard
              icon={<Zap className="size-6" />}
              title="One-Click Tracking"
              description="Paste any job URL and AI extracts the company, role, requirements, and salary automatically."
            />
            <FeatureCard
              icon={<BarChart3 className="size-6" />}
              title="Application Pipeline"
              description="Track every application from saved to offer with status updates at each interview stage."
            />
            <FeatureCard
              icon={<Cpu className="size-6" />}
              title="Smart Suggestions"
              description="Receive actionable tips on projects to build, skills to learn, and resume tweaks to make."
            />
            <FeatureCard
              icon={<Shield className="size-6" />}
              title="Your Data, Your Account"
              description="All your applications and resumes are private to your account. Sign in from anywhere."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          <span className="font-mono dark:text-neon-cyan/60">Power Tracker</span>
          <span className="mx-2 dark:text-neon-magenta/60">//</span>
          Powered by AI
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-lg border border-border bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-primary/40 dark:bg-card/60 dark:hover:border-neon-cyan/40 dark:hover:neon-border-cyan">
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-neon-cyan/10 dark:text-neon-cyan transition-all group-hover:bg-primary/20 dark:group-hover:bg-neon-cyan/20">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
