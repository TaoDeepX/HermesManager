import { invoke } from "@tauri-apps/api/core";

export type Level = "ok" | "warn" | "err" | "info";

export interface Check {
  id: string;
  label: string;
  level: Level;
  value: string;
  hint: string | null;
  auto_fixable: boolean;
}

export interface Report {
  os: string;
  os_version: string;
  arch: string;
  checks: Check[];
  ms_elapsed: number;
}

export function detectEnvironment(): Promise<Report> {
  return invoke<Report>("detect_environment");
}
