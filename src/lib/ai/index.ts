import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiAnalysisOutput } from "@/types";
import { getDbAiKeys } from "@/lib/admin/keys";

/* =============================================================
 *  Shared system prompt
 * ============================================================= */
const SYSTEM_PROMPT = `You are an expert CV reviewer and career coach. You analyze Curriculum Vitae documents and provide detailed, actionable feedback.

Your task is to evaluate the given CV text and return a JSON object with the following structure:

{
  "overallScore": <number 0-100>,
  "aspectScores": {
    "structure": <number 0-100>,
    "content": <number 0-100>,
    "relevance": <number 0-100>,
    "language": <number 0-100>,
    "completeness": <number 0-100>
  },
  "highlights": ["<string: a strong point of the CV>", ...],
  "issues": ["<string: a weakness or problem found>", ...],
  "recommendations": [
    {
      "sectionName": "<string: which CV section this applies to>",
      "issue": "<string: what the problem is>",
      "suggestion": "<string: specific actionable advice to fix it>",
      "priority": "<high|medium|low>"
    },
    ...
  ],
  "summary": "<string: 2-3 sentence overall assessment>"
}

Evaluation criteria:
- **structure** (0-100): Is the CV well-organized with clear sections (contact info, education, experience, skills)? Is the layout logical?
- **content** (0-100): Is the information relevant, specific, and quantified where possible? Are achievements described with metrics?
- **relevance** (0-100): Does the content demonstrate relevance to potential job positions? Are keywords and industry terms used?
- **language** (0-100): Is the language professional, concise, and free of errors? Are action verbs used?
- **completeness** (0-100): Does the CV include all essential sections? Is any critical information missing?

Guidelines:
- Be honest but constructive. The target audience is students and fresh graduates.
- Provide at least 3 highlights and 3 issues.
- Provide at least 4 recommendations with varying priorities.
- Keep the summary encouraging but realistic.
- If the CV text is very short or incomplete, note that in the scores and summary.
- Score generously for effort but penalize for missing critical sections.

Return ONLY valid JSON. No markdown, no code blocks, no extra text.`;

/* =============================================================
 *  Helpers
 * ============================================================= */
function cleanJson(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeOutput(raw: unknown): AiAnalysisOutput {
  const parsed = raw as AiAnalysisOutput;

  if (typeof parsed.overallScore !== "number") {
    throw new Error("Response missing overallScore.");
  }
  if (!parsed.aspectScores || typeof parsed.aspectScores !== "object") {
    throw new Error("Response missing aspectScores.");
  }

  // Clamp scores to 0-100
  parsed.overallScore = Math.max(0, Math.min(100, parsed.overallScore));
  for (const key of Object.keys(parsed.aspectScores) as Array<
    keyof typeof parsed.aspectScores
  >) {
    parsed.aspectScores[key] = Math.max(
      0,
      Math.min(100, parsed.aspectScores[key] || 0)
    );
  }

  // Ensure arrays exist
  parsed.highlights = parsed.highlights || [];
  parsed.issues = parsed.issues || [];
  parsed.recommendations = parsed.recommendations || [];
  parsed.summary = parsed.summary || "No summary provided.";

  return parsed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =============================================================
 *  OpenAI provider
 * ============================================================= */
async function analyzeWithOpenAI(
  parsedText: string,
  model: string,
  apiKey?: string
): Promise<AiAnalysisOutput> {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const client = new OpenAI({ apiKey: key, timeout: 30_000 });
  const userPrompt = `Please analyze the following CV text:\n\n---\n${parsedText}\n---`;

  const MAX_RETRIES = 2;
  const BASE_DELAY_MS = 1000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const parsed = JSON.parse(cleanJson(content));
      return normalizeOutput(parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof OpenAI.APIError) {
        const status = error.status;
        const code = error.code || "";

        if (status === 401 || status === 403 || status === 404) {
          throw new Error(`OpenAI ${status}: ${code || error.message}`);
        }
        if (status === 429) {
          if (attempt < MAX_RETRIES) {
            await sleep(BASE_DELAY_MS * 2);
            continue;
          }
          throw new Error(`OpenAI rate limit (429). ${error.message}`);
        }
        if (status && status >= 500 && attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
          continue;
        }
      }

      const msg = lastError.message.toLowerCase();
      if (
        (msg.includes("network") ||
          msg.includes("timeout") ||
          msg.includes("econnreset") ||
          msg.includes("fetch")) &&
        attempt < MAX_RETRIES
      ) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
        continue;
      }

      break;
    }
  }

  throw lastError || new Error("OpenAI analysis failed.");
}

/* =============================================================
 *  Gemini provider
 * ============================================================= */
async function analyzeWithGemini(
  parsedText: string,
  model: string,
  apiKey?: string
): Promise<AiAnalysisOutput> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(key);
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  });
  const userPrompt = `Please analyze the following CV text:\n\n---\n${parsedText}\n---`;

  const GEMINI_TIMEOUT_MS = 30_000;
  const MAX_RETRIES = 2;
  const BASE_DELAY_MS = 1000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms`
              )
            ),
          GEMINI_TIMEOUT_MS
        )
      );
      const result = await Promise.race([
        genModel.generateContent(userPrompt),
        timeoutPromise,
      ]);
      const text = result.response.text().trim();

      const parsed = JSON.parse(cleanJson(text));
      return normalizeOutput(parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message;
      const msgLower = msg.toLowerCase();

      if (
        msgLower.includes("401") ||
        msgLower.includes("403") ||
        msgLower.includes("api key not valid") ||
        msgLower.includes("api key invalid")
      ) {
        throw new Error(`Gemini auth error: ${msg}`);
      }
      if (msgLower.includes("quota exceeded")) {
        throw new Error(`Gemini quota exceeded: ${msg}`);
      }
      if (msgLower.includes("429") || msgLower.includes("too many requests")) {
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * 2);
          continue;
        }
        throw new Error(`Gemini rate limit: ${msg}`);
      }
      if (
        (msgLower.includes("500") ||
          msgLower.includes("502") ||
          msgLower.includes("503") ||
          msgLower.includes("504") ||
          msgLower.includes("fetch") ||
          msgLower.includes("network") ||
          msgLower.includes("timeout")) &&
        attempt < MAX_RETRIES
      ) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
        continue;
      }

      break;
    }
  }

  throw lastError || new Error("Gemini analysis failed.");
}

/* =============================================================
 *  NVIDIA NIM provider (OpenAI-compatible)
 * ============================================================= */
async function analyzeWithNvidia(
  parsedText: string,
  model: string,
  apiKey?: string,
  baseUrl?: string | null
): Promise<AiAnalysisOutput> {
  const key = apiKey || process.env.NVIDIA_API_KEY;
  if (!key) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const client = new OpenAI({
    apiKey: key,
    baseURL: baseUrl || process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  });

  const userPrompt = `Please analyze the following CV text:\n\n---\n${parsedText}\n---`;

  const MAX_RETRIES = 2;
  const BASE_DELAY_MS = 1000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        top_p: 0.95,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Empty response from NVIDIA API");
      }

      const parsed = JSON.parse(cleanJson(content));
      return normalizeOutput(parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message.toLowerCase();

      if (
        msg.includes("401") ||
        msg.includes("403") ||
        msg.includes("api key not valid") ||
        msg.includes("api key invalid")
      ) {
        throw new Error(`NVIDIA auth error: ${lastError.message}`);
      }
      if (msg.includes("quota exceeded")) {
        throw new Error(`NVIDIA quota exceeded: ${lastError.message}`);
      }
      if (msg.includes("429") || msg.includes("rate limit")) {
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * 2);
          continue;
        }
        throw new Error(`NVIDIA rate limit: ${lastError.message}`);
      }
      if (
        (msg.includes("500") ||
          msg.includes("502") ||
          msg.includes("503") ||
          msg.includes("504") ||
          msg.includes("fetch") ||
          msg.includes("network") ||
          msg.includes("timeout")) &&
        attempt < MAX_RETRIES
      ) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
        continue;
      }

      break;
    }
  }

  throw lastError || new Error("NVIDIA analysis failed.");
}

/* =============================================================
 *  Fallback orchestrator
 * ============================================================= */
interface ProviderSpec {
  name: string;
  try: () => Promise<AiAnalysisOutput>;
}

export type AiAnalysisResult = {
  result: AiAnalysisOutput;
  provider: string;
};

export async function analyzeCvWithAi(
  parsedText: string
): Promise<AiAnalysisResult> {
  // 1. Try database keys first (managed by superadmin)
  let dbKeys: Awaited<ReturnType<typeof getDbAiKeys>> = null;
  try {
    dbKeys = await getDbAiKeys();
    if (dbKeys) {
      console.log("[AI] Using API keys from database");
    }
  } catch (dbErr) {
    console.warn("[AI] Failed to fetch keys from DB:", dbErr);
  }

  // 2. Resolve keys: DB first, then .env fallback
  const openaiKey = dbKeys?.openai?.key || process.env.OPENAI_API_KEY;
  const openaiModel =
    dbKeys?.openai?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openaiFallbackModel =
    process.env.OPENAI_FALLBACK_MODEL || "gpt-4o";

  const geminiKey = dbKeys?.gemini?.key || process.env.GEMINI_API_KEY;
  const geminiModel =
    dbKeys?.gemini?.model || process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const nvidiaKey = dbKeys?.nvidia?.key || process.env.NVIDIA_API_KEY;
  const nvidiaModel =
    dbKeys?.nvidia?.model ||
    process.env.NVIDIA_MODEL ||
    "nvidia/nemotron-3-ultra-550b-a55b";
  const nvidiaBaseUrl =
    dbKeys?.nvidia?.baseUrl || process.env.NVIDIA_BASE_URL || null;

  const providers: ProviderSpec[] = [];

  // 1. Primary: OpenAI
  if (openaiKey) {
    providers.push({
      name: "OpenAI",
      try: () => analyzeWithOpenAI(parsedText, openaiModel, openaiKey),
    });
  }

  // 2. Fallback 1: Gemini
  if (geminiKey) {
    providers.push({
      name: "Gemini",
      try: () => analyzeWithGemini(parsedText, geminiModel, geminiKey),
    });
  }

  // 3. Fallback 2: NVIDIA NIM
  if (nvidiaKey) {
    providers.push({
      name: "NVIDIA NIM",
      try: () => analyzeWithNvidia(parsedText, nvidiaModel, nvidiaKey, nvidiaBaseUrl),
    });
  }

  // 4. Fallback 3: OpenAI with different model
  if (openaiKey) {
    providers.push({
      name: "OpenAI (fallback model)",
      try: () => analyzeWithOpenAI(parsedText, openaiFallbackModel, openaiKey),
    });
  }

  if (providers.length === 0) {
    throw new Error(
      "No AI providers are configured. Please set API keys in the admin panel or in .env.local"
    );
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[AI] Trying provider: ${provider.name}`);
      const result = await provider.try();
      console.log(`[AI] Success with provider: ${provider.name}`);
      return { result, provider: provider.name };
    } catch (error) {
      const friendly = error instanceof Error ? error.message : String(error);
      console.error(`[AI Fallback] ${provider.name} failed:`, friendly);
      errors.push(`${provider.name}: ${friendly}`);
    }
  }

  throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
}
