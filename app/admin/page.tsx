"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Compass,
  Eye,
  FileCheck2,
  Filter,
  Gauge,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES, DIMENSIONS, QUESTIONS, type CategoryKey, type DimensionKey } from "../data";

const statusCycle = ["Published", "Bias review", "Editorial review", "Draft"];
const categoryColors: Record<string, string> = {
  institutions: "violet",
  economy: "blue",
  immigration: "gold",
  justice: "red",
  equal: "teal",
  family: "green",
  rights: "rose",
};

const healthScore = (statement: string, index: number) => {
  const wordCount = statement.split(/\s+/).length;
  const clarity = Math.max(72, Math.min(99, 104 - wordCount - (statement.includes(",") ? 4 : 0)));
  const skipRate = Number((1.8 + ((index * 1.45) % 9.6)).toFixed(1));
  const polarization = Math.min(96, 34 + ((index * 9) % 59));
  const risk = skipRate > 9 || polarization > 82 || clarity < 82 ? "Watch" : "Healthy";
  const flags = [
    clarity < 84 && "Simplify wording",
    skipRate > 8.5 && "High skip rate",
    polarization > 80 && "Polarizing",
  ].filter(Boolean) as string[];

  return { clarity, skipRate, polarization, risk, flags };
};

const categoryCounts = QUESTIONS.reduce((counts, question) => {
  counts[question.category] = (counts[question.category] ?? 0) + 1;
  return counts;
}, {} as Record<CategoryKey, number>);

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Overview");
  const [selectedQuestionId, setSelectedQuestionId] = useState(QUESTIONS[0].id);
  const [healthFilter, setHealthFilter] = useState("All");
  const [testAnswers, setTestAnswers] = useState<Record<string, number>>({
    economic: 24,
    social: -16,
    liberty: -22,
    global: 12,
    justice: 8,
  });
  const healthRows = QUESTIONS.map((question, index) => ({
    question,
    index,
    status: statusCycle[index % statusCycle.length],
    ...healthScore(question.statement, index),
  }));
  const visible = healthRows
    .filter(({ question, risk, status }) => {
      const matchesQuery = question.statement.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = healthFilter === "All" || risk === healthFilter || status === healthFilter;
      return matchesQuery && matchesFilter;
    })
    .slice(0, 10);
  const selectedQuestion = QUESTIONS.find((q) => q.id === selectedQuestionId) ?? QUESTIONS[0];
  const dimensionEntries = Object.entries(DIMENSIONS) as [DimensionKey, typeof DIMENSIONS[DimensionKey]][];
  const pendingReview = useMemo(() => QUESTIONS.filter((_, index) => index % 9 === 0).slice(0, 6), []);
  const sectionLabel = active === "Overview" ? "Here’s how Civic Compass is performing this assessment cycle." : "Manage assessment content, scoring, and quality controls.";
  const watchCount = healthRows.filter((row) => row.risk === "Watch").length;
  const reviewCount = healthRows.filter((row) => row.status.includes("review")).length;
  const averageClarity = Math.round(healthRows.reduce((sum, row) => sum + row.clarity, 0) / healthRows.length);
  const averageSkip = (healthRows.reduce((sum, row) => sum + row.skipRate, 0) / healthRows.length).toFixed(1);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <span><Compass /></span>
          <div><strong>Civic Compass</strong><small>Research portal</small></div>
        </Link>
        <nav>
          <span>Workspace</span>
          {[
            ["Overview", Gauge],
            ["Questions", HelpCircle],
            ["Assessment versions", FileCheck2],
            ["Dimensions & scoring", SlidersHorizontal],
            ["Educational content", Eye],
          ].map(([label, Icon]) => (
            <button key={label as string} onClick={() => setActive(label as string)} className={active === label ? "active" : ""}>
              <Icon /> {label as string}
            </button>
          ))}
          <span>Insights</span>
          {[
            ["Analytics", BarChart3],
            ["User feedback", Users],
            ["Bias review", ShieldCheck],
          ].map(([label, Icon]) => (
            <button key={label as string} onClick={() => setActive(label as string)} className={active === label ? "active" : ""}>
              <Icon /> {label as string}
              {label === "Bias review" && <i>3</i>}
            </button>
          ))}
        </nav>
        <div className="admin-user">
          <span>DM</span>
          <div><strong>Daniel M.</strong><small>Administrator</small></div>
          <MoreHorizontal />
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <Link href="/"><ArrowLeft /> Back to assessment</Link>
            <h1>{active}</h1>
          </div>
          <div className="version-control">
            <span>Live version</span>
            <button>2026.2 <ChevronDown /></button>
            <button className="admin-primary"><Plus /> New question</button>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-welcome">
            <div>
              <span>Tuesday, July 28</span>
              <h2>Good evening, Daniel.</h2>
              <p>{sectionLabel}</p>
            </div>
            <div className="release-state">
              <CheckCircle2 />
              <div><strong>Version 2026.2 is live</strong><small>Published July 18 · 62 questions</small></div>
              <button>View release</button>
            </div>
          </section>

          <section className="admin-metrics">
            {[
              { label: "Completion rate", value: "82.4%", delta: "+3.1%", icon: CheckCircle2, note: "vs. previous version" },
              { label: "Avg. completion time", value: "6m 18s", delta: "−22s", icon: Clock3, note: "within 7 min target" },
              { label: "Profiles completed", value: "12,842", delta: "+18.6%", icon: Users, note: "anonymous sessions" },
              { label: "Accuracy rating", value: "4.3 / 5", delta: "+0.2", icon: Gauge, note: "2,109 responses" },
            ].map((metric) => (
              <article key={metric.label}>
                <div><span>{metric.label}</span><metric.icon /></div>
                <strong>{metric.value}</strong>
                <p><b>{metric.delta}</b> {metric.note}</p>
              </article>
            ))}
          </section>

          {active === "Questions" && (
            <section className="admin-workbench">
              <div className="governance-grid">
                {[
                  ["Average clarity", `${averageClarity}%`, "Plain-language score across active prompts", CheckCircle2],
                  ["Watch list", `${watchCount}`, "Questions needing review before release", AlertTriangle],
                  ["In review", `${reviewCount}`, "Bias or editorial review statuses", ClipboardList],
                  ["Avg. skip rate", `${averageSkip}%`, "Anonymous completion signal", Activity],
                ].map(([label, value, note, Icon]) => (
                  <article className="governance-card" key={label as string}>
                    <div><span>{label as string}</span><Icon /></div>
                    <strong>{value as string}</strong>
                    <p>{note as string}</p>
                  </article>
                ))}
              </div>

              <article className="admin-panel question-editor">
                <div className="panel-header">
                  <div><span>Question editor</span><h3>Draft and review prompts</h3></div>
                  <div className="panel-actions">
                    <button><Settings2 /> Bulk actions</button>
                    <button><Plus /> Create draft</button>
                  </div>
                </div>
                <div className="editor-grid">
                  <div className="question-picker">
                    {QUESTIONS.slice(0, 12).map((question) => (
                      <button
                        key={question.id}
                        className={selectedQuestion.id === question.id ? "active" : ""}
                        onClick={() => setSelectedQuestionId(question.id)}
                      >
                        <span>Q{question.id.toString().padStart(2, "0")}</span>
                        <p>{question.statement}</p>
                      </button>
                    ))}
                  </div>
                  <div className="editor-form">
                    <label><span>Statement</span><textarea value={selectedQuestion.statement} readOnly /></label>
                    <label><span>Context note</span><textarea value={selectedQuestion.context} readOnly /></label>
                    <div className="editor-meta">
                      <label><span>Category</span><input value={CATEGORIES[selectedQuestion.category].name} readOnly /></label>
                      <label><span>Editorial status</span><input value="Editorial review" readOnly /></label>
                    </div>
                    <div className="weight-preview">
                      <h4>Dimension weights</h4>
                      {selectedQuestion.weights.map((weight) => (
                        <div key={weight.dimension}>
                          <span>{DIMENSIONS[weight.dimension].name}</span>
                          <b>{weight.weight > 0 ? "+" : ""}{weight.weight.toFixed(2)}</b>
                        </div>
                      ))}
                    </div>
                    <div className="governance-checklist">
                      <h4>Release checks</h4>
                      {[
                        "Plain-language wording reviewed",
                        "Sensitive-topic neutrality checked",
                        "Dimension weights tested",
                        "Educational context attached",
                      ].map((item, index) => (
                        <span key={item} className={index < 3 ? "done" : ""}><CheckCircle2 /> {item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </section>
          )}

          {active === "Assessment versions" && (
            <section className="admin-workbench version-management">
              <div className="version-board">
                {[
                  ["2026.3 draft", "22 edits · 5 questions added · scoring unchanged", "Run final bias review"],
                  ["2026.2 live", "Published July 18 · 62 questions · current production version", "View release notes"],
                  ["2026.1 archived", "Original neutral profile release · 40 questions", "Compare results"],
                ].map(([title, note, action], index) => (
                  <article className="admin-panel version-card" key={title}>
                    <span>{index === 1 ? "Live" : index === 0 ? "Draft" : "Archived"}</span>
                    <h3>{title}</h3>
                    <p>{note}</p>
                    <button>{action}</button>
                  </article>
                ))}
              </div>
              <article className="admin-panel publish-gates">
                <div className="panel-header"><div><span>Publish readiness</span><h3>Release gates</h3></div><b>3 / 5 passed</b></div>
                {[
                  ["Question health review", "2 watch-list items still open", false],
                  ["Bias review", "3 sensitive prompts need reviewer signoff", false],
                  ["Scoring regression test", "All dimension scores within expected range", true],
                  ["Privacy copy", "Anonymous storage language reviewed", true],
                  ["Educational content", "All categories have reading sources", true],
                ].map(([title, note, passed]) => (
                  <div className="gate-row" key={title as string}>
                    <span className={passed ? "passed" : "blocked"}>{passed ? <CheckCircle2 /> : <AlertTriangle />}</span>
                    <div><strong>{title as string}</strong><p>{note as string}</p></div>
                  </div>
                ))}
              </article>
            </section>
          )}

          {active === "Dimensions & scoring" && (
            <section className="admin-workbench scoring-lab">
              <article className="admin-panel">
                <div className="panel-header"><div><span>Scoring sandbox</span><h3>Test result behavior before release</h3></div><button>Reset test</button></div>
                <div className="test-sliders">
                  {(Object.keys(testAnswers) as DimensionKey[]).map((key) => (
                    <label key={key}>
                      <span>{DIMENSIONS[key].name}</span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={testAnswers[key]}
                        onChange={(event) => setTestAnswers((current) => ({ ...current, [key]: Number(event.target.value) }))}
                      />
                      <b>{testAnswers[key] > 0 ? "+" : ""}{testAnswers[key]}</b>
                    </label>
                  ))}
                </div>
              </article>
              <article className="admin-panel dimension-rules">
                <div className="panel-header"><div><span>Dimensions</span><h3>Active scoring axes</h3></div></div>
                {dimensionEntries.slice(0, 10).map(([key, dim]) => (
                  <div key={key}>
                    <strong>{dim.name}</strong>
                    <p>{dim.low} ↔ {dim.high}</p>
                  </div>
                ))}
              </article>
              <article className="admin-panel weight-matrix">
                <div className="panel-header"><div><span>Coverage</span><h3>Question coverage by category</h3></div></div>
                {Object.entries(categoryCounts).map(([key, count]) => (
                  <div key={key}>
                    <span className={`category-tag ${categoryColors[key]}`}>{CATEGORIES[key as CategoryKey].short}</span>
                    <i><b style={{ width: `${Math.min(100, count * 12)}%` }} /></i>
                    <strong>{count}</strong>
                  </div>
                ))}
              </article>
            </section>
          )}

          {active === "Educational content" && (
            <section className="admin-workbench education-board">
              {Object.entries(CATEGORIES).map(([key, category]) => (
                <article className="admin-panel education-card" key={key}>
                  <span>{category.short}</span>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <small>{category.reading.length} reading sources · Last reviewed July 24</small>
                  <button>Review content</button>
                </article>
              ))}
            </section>
          )}

          {active === "Bias review" && (
            <section className="admin-workbench review-queue">
              <article className="admin-panel">
                <div className="panel-header"><div><span>Review queue</span><h3>Questions needing human review</h3></div><button>Assign reviewers</button></div>
                {pendingReview.map((question, index) => (
                  <div className="review-item" key={question.id}>
                    <span>Q{question.id.toString().padStart(2, "0")}</span>
                    <div><strong>{question.statement}</strong><p>{index % 2 === 0 ? "Sensitive-topic wording" : "High skip-rate watch"}</p></div>
                    <button>{index % 2 === 0 ? "Review" : "Test"}</button>
                  </div>
                ))}
              </article>
            </section>
          )}

          {active === "User feedback" && (
            <section className="admin-workbench feedback-feed">
              {[
                ["Mostly accurately", "The spectrum view was useful, but I wanted simpler wording on social issues."],
                ["Very accurately", "The profile felt nuanced and did not force a party label."],
                ["Somewhat accurately", "Some questions covered more than one idea and were hard to answer."],
              ].map(([rating, note]) => (
                <article className="admin-panel feedback-note" key={note}>
                  <span>{rating}</span>
                  <p>{note}</p>
                  <button>Create editorial task</button>
                </article>
              ))}
            </section>
          )}

          {active === "Analytics" && (
            <section className="admin-workbench analytics-grid">
              {[
                ["Most skipped category", "Rights, sex & gender policy", "11.2% skipped"],
                ["Most polarizing prompt", "Voting rules should prioritize preventing fraud...", "92 polarization"],
                ["Retake frequency", "18.4%", "users returning within 30 days"],
                ["Quick-to-full conversion", "41.7%", "preview users starting full assessment"],
              ].map(([label, value, note]) => (
                <article className="admin-panel analytics-card" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <p>{note}</p>
                </article>
              ))}
            </section>
          )}

          {(active === "Overview" || active === "Analytics") && <section className="admin-chart-grid">
            <article className="admin-panel performance-chart">
              <div className="panel-header">
                <div><span>Assessment activity</span><h3>Completions over time</h3></div>
                <button>Last 30 days <ChevronDown /></button>
              </div>
              <div className="chart-legend"><span><i /> Started</span><span><i /> Completed</span></div>
              <div className="line-chart">
                <div className="chart-y"><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div>
                <svg viewBox="0 0 700 190" preserveAspectRatio="none" aria-label="Assessment completions over 30 days">
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#27644c" stopOpacity=".18" />
                      <stop offset="1" stopColor="#27644c" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 60, 100, 140, 180].map((y) => <line key={y} x1="0" x2="700" y1={y} y2={y} />)}
                  <path className="chart-area" d="M0,150 C60,144 70,118 125,124 S210,86 270,103 S348,56 410,77 S493,43 548,61 S632,24 700,39 L700,190 L0,190 Z" />
                  <path className="chart-start" d="M0,120 C60,126 70,92 125,100 S210,60 270,75 S348,40 410,50 S493,30 548,39 S632,13 700,25" />
                  <path className="chart-complete" d="M0,150 C60,144 70,118 125,124 S210,86 270,103 S348,56 410,77 S493,43 548,61 S632,24 700,39" />
                </svg>
                <div className="chart-x"><span>Jul 1</span><span>Jul 8</span><span>Jul 15</span><span>Jul 22</span><span>Jul 28</span></div>
              </div>
            </article>

            <article className="admin-panel confidence-panel">
              <div className="panel-header"><div><span>Result quality</span><h3>Confidence distribution</h3></div><button aria-label="More"><MoreHorizontal /></button></div>
              <div className="confidence-donut">
                <div><strong>86%</strong><small>average</small></div>
              </div>
              <div className="donut-legend">
                <span><i className="high" /> High confidence <b>64%</b></span>
                <span><i className="medium" /> Moderate <b>28%</b></span>
                <span><i className="low" /> Low <b>8%</b></span>
              </div>
            </article>
          </section>}

          {(active === "Overview" || active === "Questions" || active === "Analytics") && <section className="admin-table-panel">
            <div className="table-title">
              <div><span>Question governance</span><h3>Question health</h3><p>Monitor skip rates, polarization, and editorial status.</p></div>
              <div className="table-tools">
                <label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions" /></label>
                <button onClick={() => setHealthFilter(healthFilter === "All" ? "Watch" : "All")}><Filter /> {healthFilter}</button>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>Question</th><th>Category</th><th>Status</th><th>Clarity</th><th>Skip rate</th><th>Polarization</th><th>Flags</th><th /></tr></thead>
                <tbody>
                  {visible.map(({ question, status, clarity, skipRate, polarization, flags, risk }) => {
                    return (
                      <tr key={question.id}>
                        <td><span className="question-id">Q{question.id.toString().padStart(2, "0")}</span><p>{question.statement}</p></td>
                        <td><span className={`category-tag ${categoryColors[question.category]}`}>{question.category}</span></td>
                        <td><span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`}><i />{status}</span></td>
                        <td><span className={`health-pill ${risk.toLowerCase()}`}>{clarity}%</span></td>
                        <td>{skipRate.toFixed(1)}%</td>
                        <td><div className="polar"><span style={{ width: `${polarization}%` }} /><b>{polarization}</b></div></td>
                        <td>
                          <div className="flag-list">
                            {(flags.length ? flags : ["No active flags"]).map((flag) => <span key={flag}>{flag}</span>)}
                          </div>
                        </td>
                        <td><button className="row-more" onClick={() => setSelectedQuestionId(question.id)}><MoreHorizontal /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing {visible.length} of {QUESTIONS.length} questions · {watchCount} on watch list</span><button>Export health report <ArrowLeft /></button></div>
          </section>}

          {(active === "Overview" || active === "Analytics") && <section className="admin-bottom-grid">
            <article className="admin-panel attention-panel">
              <div className="panel-header"><div><span>Editorial workflow</span><h3>Needs attention</h3></div><b>5 items</b></div>
              {[
                ["3 questions awaiting bias review", "Sensitive topics · assigned to 4 reviewers", "Review now"],
                ["Version 2026.3 has unpublished changes", "12 edits since last release", "Open draft"],
                ["2 questions exceed skip-rate threshold", "Flagged automatically · >10% skipped", "Investigate"],
              ].map(([title, note, action], i) => (
                <div className="attention-row" key={title}>
                  <span className={`attention-icon a${i}`}><Activity /></span>
                  <div><strong>{title}</strong><small>{note}</small></div>
                  <button>{action}</button>
                </div>
              ))}
            </article>
            <article className="admin-panel feedback-panel">
              <div className="panel-header"><div><span>User feedback</span><h3>Perceived accuracy</h3></div><button>View all</button></div>
              <div className="feedback-bars">
                {[
                  ["Very accurately", 42],
                  ["Mostly accurately", 38],
                  ["Somewhat accurately", 15],
                  ["Not very accurately", 4],
                  ["Not accurately at all", 1],
                ].map(([label, value]) => (
                  <div key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></div>
                ))}
              </div>
              <p><b>4.3 / 5</b> average across 2,109 responses</p>
            </article>
          </section>}
        </div>
      </main>
    </div>
  );
}
