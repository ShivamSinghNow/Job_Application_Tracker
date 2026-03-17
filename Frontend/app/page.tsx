"use client";

import { useState } from "react";
import {
  JobTrackerDashboard,
  ApplicationRecord,
} from "@/components/job-tracker-dashboard";

// Sample data for demonstration
const SAMPLE_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "1",
    url: "https://careers.google.com/jobs/software-engineer",
    company: "Google",
    role: "Senior Software Engineer",
    location: "Mountain View, CA",
    salaryRange: "$180,000 - $250,000",
    summary:
      "Join our team to build next-generation cloud infrastructure. You'll work on distributed systems at scale, collaborating with world-class engineers to solve complex technical challenges.",
    requirements: [
      "5+ years of experience in software development",
      "Strong proficiency in Go, Java, or C++",
      "Experience with distributed systems",
      "BS/MS in Computer Science or equivalent",
      "Excellent problem-solving skills",
      "Experience with cloud platforms (GCP, AWS)",
      "Strong communication skills",
    ],
    potentialImprovements: [
      "Add more distributed systems projects to portfolio",
      "Get GCP certification",
    ],
    fitScore: 85,
    fitReasoning: [
      "Strong match with required programming languages",
      "Relevant distributed systems experience",
      "Education requirements met",
      "Previous work at similar scale companies",
    ],
    status: "PHONE_SCREEN",
    notes: null,
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-12T14:30:00Z",
  },
  {
    id: "2",
    url: "https://jobs.stripe.com/frontend-engineer",
    company: "Stripe",
    role: "Frontend Engineer",
    location: "San Francisco, CA (Remote)",
    salaryRange: "$150,000 - $200,000",
    summary:
      "Build beautiful, performant interfaces for Stripe's payment products. You'll shape how millions of businesses interact with their financial data.",
    requirements: [
      "3+ years of frontend development experience",
      "Expert knowledge of React and TypeScript",
      "Experience with design systems",
      "Strong CSS and animation skills",
      "Understanding of accessibility standards",
    ],
    potentialImprovements: [
      "Contribute to open-source design systems",
      "Build more animation-heavy projects",
    ],
    fitScore: 72,
    fitReasoning: [
      "Solid React and TypeScript experience",
      "Good understanding of modern CSS",
      "Could improve accessibility knowledge",
    ],
    status: "APPLIED",
    notes: null,
    createdAt: "2026-03-08T09:15:00Z",
    updatedAt: "2026-03-08T09:15:00Z",
  },
  {
    id: "3",
    url: "https://notion.so/careers/fullstack-engineer",
    company: "Notion",
    role: "Full Stack Engineer",
    location: "New York, NY",
    salaryRange: "$160,000 - $220,000",
    summary:
      "Help build the future of productivity tools. Work across the entire stack to create delightful user experiences that millions rely on daily.",
    requirements: [
      "4+ years of full-stack development",
      "Experience with Node.js and React",
      "Database design and optimization",
      "Strong product sense",
      "Experience with real-time collaboration features",
    ],
    potentialImprovements: [
      "Build a real-time collaborative app",
      "Gain more PostgreSQL optimization experience",
    ],
    fitScore: 45,
    fitReasoning: [
      "Good full-stack foundation",
      "Limited real-time collaboration experience",
      "Database optimization skills need improvement",
    ],
    status: "SAVED",
    notes: null,
    createdAt: "2026-03-05T16:45:00Z",
    updatedAt: "2026-03-05T16:45:00Z",
  },
  {
    id: "4",
    url: "https://vercel.com/careers/platform-engineer",
    company: "Vercel",
    role: "Platform Engineer",
    location: "Remote",
    salaryRange: "$170,000 - $230,000",
    summary:
      "Work on the infrastructure that powers millions of websites. Build and scale edge computing solutions for the modern web.",
    requirements: [
      "5+ years backend/infrastructure experience",
      "Deep knowledge of edge computing",
      "Experience with Rust or Go",
      "Understanding of CDN architectures",
      "Kubernetes and container orchestration",
    ],
    potentialImprovements: ["Learn Rust", "Get more edge computing experience"],
    fitScore: 68,
    fitReasoning: [
      "Strong backend experience",
      "Good Kubernetes knowledge",
      "Limited edge computing background",
      "Go experience is solid",
    ],
    status: "TECHNICAL",
    notes: null,
    createdAt: "2026-03-01T11:20:00Z",
    updatedAt: "2026-03-14T09:00:00Z",
  },
];

export default function HomePage() {
  const [applications, setApplications] =
    useState<ApplicationRecord[]>(SAMPLE_APPLICATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<1 | 2 | 3>(1);

  const handleStatusChange = (
    id: string,
    status: ApplicationRecord["status"]
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status, updatedAt: new Date().toISOString() } : app
      )
    );
  };

  const handleDelete = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleTrackJob = (url: string) => {
    // Simulate loading process
    setIsLoading(true);
    setLoadingStep(1);

    setTimeout(() => setLoadingStep(2), 1500);
    setTimeout(() => setLoadingStep(3), 3000);
    setTimeout(() => {
      // Add a mock new application
      const newApp: ApplicationRecord = {
        id: Date.now().toString(),
        url,
        company: "Example Company",
        role: "Software Engineer",
        location: "Remote",
        salaryRange: "$120,000 - $160,000",
        summary:
          "An exciting opportunity to work on innovative products and collaborate with talented engineers.",
        requirements: [
          "3+ years of experience",
          "Strong JavaScript skills",
          "Experience with modern frameworks",
        ],
        potentialImprovements: ["Learn more about the company's tech stack"],
        fitScore: Math.floor(Math.random() * 40) + 50,
        fitReasoning: [
          "Good match with core requirements",
          "Relevant experience",
        ],
        status: "SAVED",
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setApplications((prev) => [newApp, ...prev]);
      setIsLoading(false);
      setLoadingStep(1);
    }, 4500);
  };

  const handleResumeUpload = (file: File) => {
    console.log("Resume uploaded:", file.name);
    // Handle resume upload logic
  };

  return (
    <JobTrackerDashboard
      applications={applications}
      onStatusChange={handleStatusChange}
      onDelete={handleDelete}
      onTrackJob={handleTrackJob}
      onResumeUpload={handleResumeUpload}
      isLoading={isLoading}
      loadingStep={loadingStep}
    />
  );
}
