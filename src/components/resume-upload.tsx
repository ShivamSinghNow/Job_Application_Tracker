"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ResumeInfo {
  hasResume: boolean;
  filename?: string;
  contentLength?: number;
}

export function ResumeUpload({
  initialResume,
  onResumeChange,
}: {
  initialResume: ResumeInfo;
  onResumeChange: (info: ResumeInfo) => void;
}) {
  const [resume, setResume] = useState<ResumeInfo>(initialResume);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are accepted.");
        return;
      }

      setUploading(true);
      setError(null);

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
        const info: ResumeInfo = {
          hasResume: true,
          filename: data.filename,
          contentLength: data.contentLength,
        };
        setResume(info);
        onResumeChange(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onResumeChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadFile]
  );

  const handleRemove = useCallback(async () => {
    try {
      await fetch("/api/resume", { method: "DELETE" });
      const info: ResumeInfo = { hasResume: false };
      setResume(info);
      onResumeChange(info);
    } catch {
      setError("Failed to remove resume");
    }
  }, [onResumeChange]);

  if (resume.hasResume) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{resume.filename}</p>
              <p className="text-xs text-muted-foreground">
                Resume loaded &middot; {Math.round((resume.contentLength || 0) / 100) / 10}k chars extracted
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              Remove
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          {uploading ? (
            <p className="text-sm text-muted-foreground">Processing PDF...</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Drop your resume here or{" "}
                <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">PDF only</p>
            </>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
