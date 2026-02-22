import axios from "axios";
import crypto from "crypto";
import { PDFParse } from "pdf-parse";
import ResumeEmbedding from "../models/ResumeEmbedding.js";
import AnalysisInsight from "../models/AnalysisInsight.js";
import { generateGapAnalysis, generateTextEmbedding } from "../services/llmService.js";

const tokenize = (text) => {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "from", "have", "has", "your",
    "you", "are", "our", "will", "can", "into", "about", "than", "their", "they",
    "them", "not", "but", "all", "any", "was", "were", "been", "being", "job",
    "work", "role", "team", "years", "year", "experience", "skills", "skill",
  ]);

  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
};

const computeFallbackScore = (resumeText, jdText) => {
  const jdTokens = new Set(tokenize(jdText));
  const resumeTokens = new Set(tokenize(resumeText));

  if (!jdTokens.size) return 0;

  let overlap = 0;
  for (const token of jdTokens) {
    if (resumeTokens.has(token)) overlap += 1;
  }

  const ratio = (overlap / jdTokens.size) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
};

const hashText = (text) =>
  crypto.createHash("sha256").update((text || "").trim().toLowerCase()).digest("hex");

const cosineSimilarity = (a = [], b = []) => {
  if (!a.length || !b.length || a.length !== b.length) return null;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (!magA || !magB) return null;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

const trimJdPreview = (text = "") => text.replace(/\s+/g, " ").trim().slice(0, 220);

const clampScore = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num));
};

const buildSkillsEvidence = (matchedSkills = [], missingSkills = []) => {
  const matchedCount = Array.isArray(matchedSkills) ? matchedSkills.filter(Boolean).length : 0;
  const missingCount = Array.isArray(missingSkills) ? missingSkills.filter(Boolean).length : 0;
  const total = matchedCount + missingCount;

  if (!total) return null;

  return {
    matchedCount,
    missingCount,
    total,
    score: (matchedCount / total) * 100,
  };
};

const calibrateScore = (baseScore, skillsEvidence) => {
  let finalScore = clampScore(baseScore);

  if (!skillsEvidence) {
    return Math.round(finalScore * 100) / 100;
  }

  const evidenceWeight = skillsEvidence.total >= 6 ? 0.38 : skillsEvidence.total >= 3 ? 0.28 : 0.18;
  finalScore = finalScore * (1 - evidenceWeight) + skillsEvidence.score * evidenceWeight;

  if (skillsEvidence.matchedCount >= 8 && skillsEvidence.missingCount <= 1) {
    finalScore = Math.max(finalScore, 78);
  } else if (skillsEvidence.matchedCount >= 6 && skillsEvidence.missingCount <= 2) {
    finalScore = Math.max(finalScore, 72);
  }

  return Math.round(clampScore(finalScore) * 100) / 100;
};

export const analyzeResume = async (req, res) => {
  let parser;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume file required" });
    }

    const { jdText } = req.body;
    if (!jdText?.trim()) {
      return res.status(400).json({ message: "Job description required" });
    }

    parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    const resumeText = pdfData?.text || "";

    if (!resumeText.trim()) {
      return res.status(400).json({ message: "Could not extract text from resume PDF" });
    }

    const userId = req.user.id;
    const resumeHash = hashText(resumeText);
    const resumeName = req.file.originalname || "resume.pdf";

    let usedCachedEmbedding = false;
    let resumeEmbedding = null;
    let jdEmbedding = null;

    let embeddingDoc = await ResumeEmbedding.findOne({ userId, resumeHash });
    if (embeddingDoc) {
      usedCachedEmbedding = true;
      resumeEmbedding = embeddingDoc.embedding;
    } else {
      try {
        resumeEmbedding = await generateTextEmbedding(resumeText.substring(0, 8000));
        if (resumeEmbedding?.length) {
          embeddingDoc = await ResumeEmbedding.create({
            userId,
            resumeHash,
            resumeName,
            embedding: resumeEmbedding,
          });
        }
      } catch (embeddingError) {
        console.warn("resume embedding generation failed:", embeddingError.message);
      }
    }

    if (resumeEmbedding?.length) {
      try {
        jdEmbedding = await generateTextEmbedding(jdText.substring(0, 8000));
      } catch (embeddingError) {
        console.warn("jd embedding generation failed:", embeddingError.message);
      }
    }

    let matchScore;
    if (process.env.AI_SERVICE_URL) {
      try {
        const scoreResponse = await axios.post(
          process.env.AI_SERVICE_URL,
          {
            resume: resumeText,
            jd: jdText,
          },
          { timeout: 12000 }
        );

        matchScore = scoreResponse?.data?.match_score;
      } catch (scorerError) {
        console.warn("scorer service unavailable, using fallback:", scorerError.message);
      }
    }

    const lexicalScore = computeFallbackScore(resumeText, jdText);

    if (typeof matchScore !== "number" || Number.isNaN(matchScore)) {
      const similarity = cosineSimilarity(resumeEmbedding, jdEmbedding);
      if (typeof similarity === "number") {
        const semanticScore = Math.round(((similarity + 1) / 2) * 100);
        matchScore = Math.round(semanticScore * 0.65 + lexicalScore * 0.35);
      } else {
        matchScore = lexicalScore;
      }
    }

    const aiFeedback = await generateGapAnalysis({
      resume: resumeText.substring(0, 2000),
      jd: jdText.substring(0, 2000),
      score: matchScore,
    });

    const skillsEvidence = buildSkillsEvidence(aiFeedback.matched_skills, aiFeedback.missing_skills);
    const finalScore = calibrateScore(matchScore, skillsEvidence);

    const payload = {
      match_score: finalScore,
      ...aiFeedback,
      used_cached_embedding: usedCachedEmbedding,
      score_breakdown: {
        base_score: Math.round(clampScore(matchScore) * 100) / 100,
        skills_evidence_score: skillsEvidence ? Math.round(skillsEvidence.score * 100) / 100 : null,
      },
    };

    await AnalysisInsight.create({
      userId,
      resumeName,
      resumeHash,
      jdPreview: trimJdPreview(jdText),
      match_score: payload.match_score,
      why_score: payload.why_score,
      matched_skills: payload.matched_skills,
      missing_skills: payload.missing_skills,
      improvement_suggestions: payload.improvement_suggestions,
      usedCachedEmbedding,
    });

    res.json(payload);
  } catch (error) {
    console.error("analysis error:", error?.response?.data || error.message);
    res.status(500).json({
      message: "Analysis failed",
      detail: error?.response?.data?.message || error.message,
    });
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await AnalysisInsight.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json(
      history.map((item) => ({
        id: item._id,
        createdAt: item.createdAt,
        resumeName: item.resumeName,
        jdPreview: item.jdPreview,
        usedCachedEmbedding: item.usedCachedEmbedding,
        result: {
          match_score: item.match_score,
          why_score: item.why_score,
          matched_skills: item.matched_skills,
          missing_skills: item.missing_skills,
          improvement_suggestions: item.improvement_suggestions,
        },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Could not load history", detail: error.message });
  }
};
