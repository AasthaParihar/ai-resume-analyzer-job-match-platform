import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const renderInlineMarkdown = (text = "") => {
  const tokens = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return tokens.map((token, index) => {
    const isBold = token.startsWith("**") && token.endsWith("**");
    if (isBold) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    return <span key={index}>{token}</span>;
  });
};

export default function Results() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const result = state?.result;
  const resumeName = state?.resumeName || "Uploaded resume";

  useEffect(() => {
    if (!result) {
      navigate("/dashboard");
    }
  }, [result, navigate]);

  if (!result) return null;

  const score = Math.max(0, Math.min(100, Number(result.match_score) || 0));

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="app-shell page-transition min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Candidate Match Insights
            </h1>
            {result.used_cached_embedding ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                Used cached resume embedding
              </p>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              New Analysis
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        </div>

        <section className="stagger-item rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
            <div className="flex items-center justify-center">
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(#18181b ${score * 3.6}deg, #e4e4e7 0deg)`,
                }}
              >
                <div className="score-ring-inner">
                  <p className="text-4xl font-extrabold text-zinc-900">{score}%</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Match Score
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Resume
              </p>
              <p className="mt-1 text-lg font-bold text-zinc-900">{resumeName}</p>
              <div className="mt-5 rounded-2xl bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
                {renderInlineMarkdown(result.why_score || "No explanation returned.")}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="stagger-item rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900">Matched Skills</h2>
            <ul className="mt-4 space-y-2">
              {result.matched_skills?.length ? (
                result.matched_skills.map((skill, i) => (
                  <li key={i} className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {skill}
                  </li>
                ))
              ) : (
                <li className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
                  No matched skills returned
                </li>
              )}
            </ul>
          </section>

          <section className="stagger-item rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900">Missing Skills</h2>
            <ul className="mt-4 space-y-2">
              {result.missing_skills?.length ? (
                result.missing_skills.map((skill, i) => (
                  <li key={i} className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    {skill}
                  </li>
                ))
              ) : (
                <li className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
                  No missing skills returned
                </li>
              )}
            </ul>
          </section>
        </div>

        <section className="stagger-item mt-6 rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white to-amber-50 p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-zinc-900">Improvement Suggestions</h2>
          <ul className="mt-4 space-y-2">
            {result.improvement_suggestions?.length ? (
              result.improvement_suggestions.map((item, i) => (
                <li key={i} className="rounded-xl bg-white/80 px-4 py-3 text-sm leading-7 text-zinc-700">
                  {renderInlineMarkdown(item)}
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-white/80 px-4 py-3 text-sm text-zinc-600">
                No suggestions returned
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
