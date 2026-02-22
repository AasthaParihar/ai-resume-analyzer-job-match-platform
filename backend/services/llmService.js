import { GoogleGenerativeAI } from "@google/generative-ai";

let client;
let clientApiKey;

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL?.trim(),
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
].filter(Boolean);

const EMBEDDING_MODEL_CANDIDATES = [
  process.env.GEMINI_EMBEDDING_MODEL?.trim(),
  "text-embedding-004",
  "embedding-001",
].filter(Boolean);

const getGeminiClient = () => {
  const provider = process.env.LLM_PROVIDER || "gemini";
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (provider !== "gemini" || !apiKey) {
    return null;
  }

  if (!client || clientApiKey !== apiKey) {
    client = new GoogleGenerativeAI(apiKey);
    clientApiKey = apiKey;
  }

  return client;
};

const extractJsonText = (raw) => {
  if (!raw) return "";

  const trimmed = raw.trim();

  if (trimmed.startsWith("```")) {
    const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, "");
    const withoutFenceEnd = withoutFenceStart.replace(/\s*```$/, "");
    return withoutFenceEnd.trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

export const generateGapAnalysis = async ({ resume, jd, score }) => {
  const gemini = getGeminiClient();

  if (!gemini) {
    throw new Error("GEMINI_API_KEY missing or LLM_PROVIDER not set to gemini");
  }

  const prompt = `
Return ONLY valid JSON. No explanation outside JSON.

Resume:
${resume}

Job Description:
${jd}

Match Score: ${score}%

Return:
{
  "why_score": "",
  "matched_skills": [],
  "missing_skills": [],
  "improvement_suggestions": []
}
`;

  let text = "";
  let lastError;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent(prompt);
      text = result.response.text();
      break;
    } catch (error) {
      lastError = error;
      const message = error?.message || "";
      const notFound = message.includes("404") || message.includes("not found");
      if (!notFound) {
        throw error;
      }
    }
  }

  if (!text) {
    throw new Error(
      `No compatible Gemini model found. Set GEMINI_MODEL in backend/.env. Last error: ${lastError?.message || "unknown error"}`
    );
  }

  let parsed = {};

  try {
    parsed = JSON.parse(extractJsonText(text));
  } catch (err) {
    throw new Error(`LLM returned non-JSON output: ${err.message}`);
  }

  return {
    why_score: parsed.why_score || `Estimated match score is ${score}%.`,
    matched_skills: Array.isArray(parsed.matched_skills) ? parsed.matched_skills : [],
    missing_skills: Array.isArray(parsed.missing_skills) ? parsed.missing_skills : [],
    improvement_suggestions: Array.isArray(parsed.improvement_suggestions)
      ? parsed.improvement_suggestions
      : [],
  };
};

export const generateTextEmbedding = async (text) => {
  const gemini = getGeminiClient();

  if (!gemini) {
    return null;
  }

  let lastError;

  for (const modelName of EMBEDDING_MODEL_CANDIDATES) {
    try {
      const model = gemini.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      const values = result?.embedding?.values;
      if (Array.isArray(values) && values.length) {
        return values;
      }
    } catch (error) {
      lastError = error;
      const message = (error?.message || "").toLowerCase();
      const notFound = message.includes("404") || message.includes("not found");
      if (!notFound) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw new Error(
      `No compatible Gemini embedding model found. Set GEMINI_EMBEDDING_MODEL in backend/.env. Last error: ${lastError?.message || "unknown error"}`
    );
  }

  return null;
};
