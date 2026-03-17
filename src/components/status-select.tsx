"use client";

import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "@/lib/types";

export function StatusSelect({
  value,
  onChange,
}: {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      onClick={(e) => e.stopPropagation()}
      className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {APPLICATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
