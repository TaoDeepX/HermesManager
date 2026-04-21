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

export interface TestRequest {
  base_url: string;
  api_key?: string;
  model: string;
  extra_headers?: [string, string][];
}

export interface TestResponse {
  ok: boolean;
  status: number;
  latency_ms: number;
  body_preview: string;
  error: string | null;
}

export function testProvider(req: TestRequest): Promise<TestResponse> {
  return invoke<TestResponse>("test_provider", { req });
}

export function openExternal(url: string): Promise<void> {
  return invoke("open_external", { url });
}
