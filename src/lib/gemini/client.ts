// =============================================================================
// UTARE ZISEDU AI — Shared Gemini Client
// =============================================================================
// One place to configure the live model. Every AI feature (pathway, CV, cover
// letter) goes through `generateJson`, which:
//   - uses JSON mode + a response schema so output is always parseable
//   - enforces a timeout so a slow network never hangs the UI
//   - returns null on any failure so callers fall back to the built-in engine
// =============================================================================

import { GoogleGenAI, Schema } from "@google/genai";

export const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 45_000;

export function getGeminiConfig() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  return { apiKey, model, enabled: apiKey.length > 10 };
}

export function isGeminiEnabled(): boolean {
  return getGeminiConfig().enabled;
}

let cachedClient: { key: string; client: GoogleGenAI } | null = null;

function getClient(apiKey: string): GoogleGenAI {
  if (!cachedClient || cachedClient.key !== apiKey) {
    cachedClient = { key: apiKey, client: new GoogleGenAI({ apiKey }) };
  }
  return cachedClient.client;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Gemini request timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export interface GenerateJsonOptions {
  systemInstruction: string;
  prompt: string;
  schema?: Schema;
  temperature?: number;
  timeoutMs?: number;
  label?: string;
}

/**
 * Calls the live Gemini model and returns parsed JSON, or null when the model
 * is not configured or the call fails for any reason.
 */
export async function generateJson<T>(
  opts: GenerateJsonOptions
): Promise<T | null> {
  const { apiKey, model, enabled } = getGeminiConfig();
  if (!enabled) return null;

  try {
    const ai = getClient(apiKey);
    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: opts.prompt,
        config: {
          systemInstruction: opts.systemInstruction,
          temperature: opts.temperature ?? 0.7,
          responseMimeType: "application/json",
          ...(opts.schema ? { responseSchema: opts.schema } : {}),
        },
      }),
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
    );

    const text = response.text;
    if (!text) throw new Error("Empty response from model");
    return JSON.parse(stripCodeFences(text)) as T;
  } catch (error) {
    console.warn(
      `[Utare Gemini${opts.label ? ` · ${opts.label}` : ""}] Live call failed, using built-in engine:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/** Lightweight live check used by /api/ai/status. */
export async function pingGemini(): Promise<{
  enabled: boolean;
  model: string;
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const { apiKey, model, enabled } = getGeminiConfig();
  if (!enabled) {
    return {
      enabled: false,
      model,
      ok: false,
      error: "GEMINI_API_KEY is not set in .env.local",
    };
  }
  const started = Date.now();
  try {
    const ai = getClient(apiKey);
    const res = await withTimeout(
      ai.models.generateContent({
        model,
        contents: 'Reply with the single word "ready".',
        config: { temperature: 0 },
      }),
      15_000
    );
    return {
      enabled: true,
      model,
      ok: Boolean(res.text),
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      enabled: true,
      model,
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
