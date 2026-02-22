import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function AnalyzingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-center">
          <div className="analyzing-rings" />
        </div>
        <h3 className="text-center text-xl font-bold text-zinc-900">Analyzing your fit</h3>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Parsing resume, mapping skills, and scoring against job requirements.
        </p>
        <div className="mt-6 space-y-3">
          <div className="analyzing-line" />
          <div className="analyzing-line delay" />
          <div className="analyzing-line delay-2" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [resume, setResume] = useState(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!resume || !jdText) {
      alert("Upload resume and enter job description");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jdText", jdText);

    try {
      const res = await API.post("/analysis/analyze", formData);
      await new Promise((resolve) => setTimeout(resolve, 700));
      navigate("/results", {
        state: {
          result: res.data,
          resumeName: resume.name,
          analyzedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await API.get("/analysis/history");
      setHistoryItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("Could not load history");
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const viewInsight = (item) => {
    navigate("/results", {
      state: {
        result: item.result,
        resumeName: item.resumeName,
        analyzedAt: item.createdAt,
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="app-shell page-transition min-h-screen px-4 py-8 sm:px-8">
      {loading && <AnalyzingOverlay />}
      {historyOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setHistoryOpen(false)}>
          <aside
            className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-zinc-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Previous Insights</h2>
              <button
                onClick={() => setHistoryOpen(false)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>
            {historyLoading ? (
              <p className="text-sm text-zinc-600">Loading insights...</p>
            ) : historyItems.length ? (
              <ul className="space-y-3">
                {historyItems.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-bold text-zinc-900">{item.resumeName || "Resume"}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Match score: {item.result?.match_score ?? "-"}% |{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">{item.jdPreview}</p>
                    <button
                      onClick={() => viewInsight(item)}
                      className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                    >
                      View Insight
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-600">No previous insights yet.</p>
            )}
          </aside>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              AI Resume Analyzer
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openHistory}
              className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              View History
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <section className="stagger-item rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-zinc-900">Upload resume</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Add your resume in PDF format to begin candidate-job matching.
            </p>
            <label className="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center hover:border-zinc-500">
              <span className="text-sm font-semibold text-zinc-700">Choose PDF resume</span>
              <span className="mt-1 text-xs text-zinc-500">
                {resume ? resume.name : "No file selected"}
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setResume(e.target.files[0])}
                className="hidden"
              />
            </label>
          </section>

          <section className="stagger-item rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-zinc-900">Paste job description</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Include responsibilities and must-have skills for better scoring.
            </p>
            <textarea
              placeholder="Paste Job Description"
              rows="9"
              className="mt-6 w-full rounded-2xl border border-zinc-300 bg-white p-4 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              onChange={(e) => setJdText(e.target.value)}
              value={jdText}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
            >
              {loading ? "Analyzing..." : "Analyze Match"}
            </button>
          </section>
        </div>

        <section className="stagger-item mt-6 rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white to-amber-50 p-6 shadow-sm sm:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            What You Get
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-bold text-zinc-900">Match Score</p>
              <p className="mt-1 text-xs text-zinc-600">Overall fit percentage based on role requirements.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-bold text-zinc-900">Skill Gap</p>
              <p className="mt-1 text-xs text-zinc-600">Missing and matched skills grouped for fast action.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-bold text-zinc-900">AI Suggestions</p>
              <p className="mt-1 text-xs text-zinc-600">Practical improvements to strengthen your resume.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
