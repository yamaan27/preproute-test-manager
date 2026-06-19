import type { TestStatus } from "../types";

export function StatusPill({ status }: { status?: TestStatus }) {
  const label = status ?? "draft";
  const display = label.charAt(0).toUpperCase() + label.slice(1);
  return <span className={`status-pill ${label}`}>{display}</span>;
}
