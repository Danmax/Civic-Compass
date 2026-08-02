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
import { useEffect, useState } from "react";
import { CATEGORIES, DIMENSIONS, QUESTIONS, type CategoryKey, type DimensionKey } from "../data";

const categoryColors: Record<string, string> = {
  institutions: "violet",
  economy: "blue",
  immigration: "gold",
  justice: "red",
  equal: "teal",
  family: "green",
  rights: "rose",
};

type AdminMetrics = {
  users: number;
  accountProfiles: number;
  anonymousProfiles: number;
  totalProfiles: number;
  recentUsers: number;
  recentAccountProfiles: number;
  recentAnonymousProfiles: number;
  savedResponses: number;
  anonymousResponses: number;
  totalResponses: number;
  questionCount: number;
  averageConfidence: number | null;
  biasReviewItems: number;
  openBiasReviewItems: number;
  highSeverityBiasReviewItems: number;
  biasReviewByStatus: Record<string, number>;
  accountProfilesByMode: Record<string, number>;
  accuracyRatings: { rating: string; count: number }[];
  questionStats: {
    questionNumber: number;
    total: number;
    skipped: number;
    skipRate: number;
    averageStrength: number | null;
  }[];
};

type BiasReviewItem = {
  id: string;
  status: "open" | "in_review" | "approved" | "needs_revision" | "resolved";
  severity: "low" | "medium" | "high";
  triggerSource: string;
  triggerSummary: string;
  question: {
    id: string;
    number: number;
    statement: string;
    context: string;
    category: {
      key: CategoryKey;
      name: string;
    };
  };
  assignedTo: string | null;
  createdBy: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

type AdminQuestion = {
  id: string;
  number: number;
  statement: string;
  context: string;
  value: string;
  active: boolean;
  status: "draft" | "in_review" | "approved" | "published" | "archived" | "rejected";
  category: {
    key: CategoryKey;
    name: string;
  };
  health: {
    responseCount: number;
    skippedCount: number;
    skipRate: number;
    averageStrength: number | null;
    polarization: number;
  };
  biasReviewStatus: string | null;
  commentCount: number;
  updatedAt: string;
};

type QuestionForm = {
  statement: string;
  context: string;
  category: CategoryKey;
  value: string;
};

const emptyMetrics: AdminMetrics = {
  users: 0,
  accountProfiles: 0,
  anonymousProfiles: 0,
  totalProfiles: 0,
  recentUsers: 0,
  recentAccountProfiles: 0,
  recentAnonymousProfiles: 0,
  savedResponses: 0,
  anonymousResponses: 0,
  totalResponses: 0,
  questionCount: QUESTIONS.length,
  averageConfidence: null,
  biasReviewItems: 0,
  openBiasReviewItems: 0,
  highSeverityBiasReviewItems: 0,
  biasReviewByStatus: {},
  accountProfilesByMode: {},
  accuracyRatings: [],
  questionStats: [],
};

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

const staticQuestionRows = QUESTIONS.map((question) => ({
  id: `static-${question.id}`,
  number: question.id,
  statement: question.statement,
  context: question.context,
  value: question.value,
  active: true,
  status: "published" as const,
  category: {
    key: question.category,
    name: CATEGORIES[question.category].name,
  },
  health: {
    responseCount: 0,
    skippedCount: 0,
    skipRate: 0,
    averageStrength: null,
    polarization: 0,
  },
  biasReviewStatus: null,
  commentCount: 0,
  updatedAt: "",
}));

const healthScore = (statement: string, health?: AdminQuestion["health"]) => {
  const wordCount = statement.split(/\s+/).length;
  const clarity = Math.max(72, Math.min(99, 104 - wordCount - (statement.includes(",") ? 4 : 0)));
  const responseCount = health?.responseCount ?? 0;
  const skipRate = health?.skipRate ?? 0;
  const polarization = health?.polarization ?? 0;
  const risk = responseCount === 0 ? "No data" : skipRate > 9 || polarization > 82 || clarity < 82 ? "Watch" : "Healthy";
  const flags = [
    responseCount === 0 && "Awaiting responses",
    clarity < 84 && "Simplify wording",
    skipRate > 8.5 && "High skip rate",
    polarization > 80 && "Polarizing",
  ].filter(Boolean) as string[];

  return { clarity, skipRate, polarization, responseCount, risk, flags };
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
  const [adminQuestions, setAdminQuestions] = useState<AdminQuestion[]>(staticQuestionRows);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [questionSaving, setQuestionSaving] = useState(false);
  const [questionComment, setQuestionComment] = useState("");
  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    statement: "",
    context: "",
    category: "institutions",
    value: "",
  });
  const [metrics, setMetrics] = useState<AdminMetrics>(emptyMetrics);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState("");
  const [reviewItems, setReviewItems] = useState<BiasReviewItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [reviewComment, setReviewComment] = useState<Record<string, string>>({});
  const [testAnswers, setTestAnswers] = useState<Record<string, number>>({
    economic: 0,
    social: 0,
    liberty: 0,
    global: 0,
    justice: 0,
  });
  const healthRows = adminQuestions.map((question, index) => ({
    question,
    index,
    status: question.status,
    ...healthScore(question.statement, question.health),
  }));
  const visible = healthRows
    .filter(({ question, risk, status }) => {
      const matchesQuery = question.statement.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = healthFilter === "All" || risk === healthFilter || status === healthFilter;
      return matchesQuery && matchesFilter;
    })
    .slice(0, 10);
  const selectedQuestion = adminQuestions.find((q) => q.number === selectedQuestionId) ?? adminQuestions[0] ?? staticQuestionRows[0];
  const dimensionEntries = Object.entries(DIMENSIONS) as [DimensionKey, typeof DIMENSIONS[DimensionKey]][];
  const watchedQuestions = healthRows.filter((row) => row.risk === "Watch").slice(0, 6);
  const sectionLabel = active === "Overview" ? "Live MySQL counts for Civic Compass activity." : "Manage assessment content, scoring, and quality controls.";
  const publishedCount = adminQuestions.filter((question) => question.status === "published").length;
  const draftCount = adminQuestions.filter((question) => question.status === "draft").length;
  const reviewQuestionCount = adminQuestions.filter((question) => question.status === "in_review").length;
  const watchCount = healthRows.filter((row) => row.risk === "Watch").length;
  const noDataCount = healthRows.filter((row) => row.risk === "No data").length;
  const averageClarity = Math.round(healthRows.reduce((sum, row) => sum + row.clarity, 0) / healthRows.length);
  const respondedRows = healthRows.filter((row) => row.responseCount > 0);
  const averageSkip = respondedRows.length
    ? (respondedRows.reduce((sum, row) => sum + row.skipRate, 0) / respondedRows.length).toFixed(1)
    : "0.0";
  const ratingTotal = metrics.accuracyRatings.reduce((sum, row) => sum + row.count, 0);

  const loadReviewItems = async () => {
    setReviewLoading(true);
    setReviewError("");

    try {
      const response = await fetch("/api/admin/bias-review");
      const body = await response.json() as { ok?: boolean; items?: BiasReviewItem[]; error?: string };

      if (!response.ok || !body.ok || !body.items) {
        throw new Error(body.error ?? "Unable to load bias review items.");
      }

      setReviewItems(body.items);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to load bias review items.");
    } finally {
      setReviewLoading(false);
    }
  };

  const loadQuestions = async () => {
    setQuestionsLoading(true);
    setQuestionsError("");

    try {
      const response = await fetch("/api/admin/questions");
      const body = await response.json() as { ok?: boolean; questions?: AdminQuestion[]; error?: string };

      if (!response.ok || !body.ok || !body.questions) {
        throw new Error(body.error ?? "Unable to load questions.");
      }

      const questions = body.questions;
      setAdminQuestions(questions);
      setSelectedQuestionId((current) => questions.some((question) => question.number === current) ? current : questions[0]?.number ?? current);
    } catch (error) {
      setQuestionsError(error instanceof Error ? error.message : "Unable to load questions.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const updateQuestion = async (payload: Partial<QuestionForm>) => {
    if (!selectedQuestion?.id) return;

    setQuestionSaving(true);
    setQuestionsError("");

    try {
      const response = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to update question.");
      }

      await loadQuestions();
    } catch (error) {
      setQuestionsError(error instanceof Error ? error.message : "Unable to update question.");
    } finally {
      setQuestionSaving(false);
    }
  };

  const updateQuestionStatus = async (status: AdminQuestion["status"], note: string) => {
    if (!selectedQuestion?.id) return;

    setQuestionSaving(true);
    setQuestionsError("");

    try {
      const response = await fetch(`/api/admin/questions/${selectedQuestion.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to update question status.");
      }

      await loadQuestions();
    } catch (error) {
      setQuestionsError(error instanceof Error ? error.message : "Unable to update question status.");
    } finally {
      setQuestionSaving(false);
    }
  };

  const createQuestion = async () => {
    setQuestionSaving(true);
    setQuestionsError("");

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionForm),
      });
      const body = await response.json() as { ok?: boolean; id?: string; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to create question.");
      }

      setQuestionForm({ statement: "", context: "", category: "institutions", value: "" });
      await loadQuestions();
    } catch (error) {
      setQuestionsError(error instanceof Error ? error.message : "Unable to create question.");
    } finally {
      setQuestionSaving(false);
    }
  };

  const addQuestionComment = async () => {
    if (!selectedQuestion?.id || !questionComment.trim()) return;

    setQuestionSaving(true);
    setQuestionsError("");

    try {
      const response = await fetch(`/api/admin/questions/${selectedQuestion.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: questionComment }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to add question comment.");
      }

      setQuestionComment("");
      await loadQuestions();
    } catch (error) {
      setQuestionsError(error instanceof Error ? error.message : "Unable to add question comment.");
    } finally {
      setQuestionSaving(false);
    }
  };

  const updateReviewItem = async (id: string, payload: Record<string, unknown>) => {
    setReviewError("");

    try {
      const response = await fetch(`/api/admin/bias-review/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to update review item.");
      }

      await loadReviewItems();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to update review item.");
    }
  };

  const createReviewItem = async (questionNumber: number, triggerSummary: string, severity: "low" | "medium" | "high" = "medium") => {
    setReviewError("");

    try {
      const response = await fetch("/api/admin/bias-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionNumber,
          severity,
          triggerSource: "response_signal",
          triggerSummary,
        }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to create review item.");
      }

      await loadReviewItems();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to create review item.");
    }
  };

  const addReviewComment = async (id: string) => {
    const comment = reviewComment[id]?.trim();

    if (!comment) return;

    setReviewError("");

    try {
      const response = await fetch(`/api/admin/bias-review/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to add comment.");
      }

      setReviewComment((current) => ({ ...current, [id]: "" }));
      await loadReviewItems();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to add comment.");
    }
  };

  useEffect(() => {
    let activeRequest = true;

    const loadMetrics = async () => {
      setMetricsLoading(true);
      setMetricsError("");

      try {
        const response = await fetch("/api/admin/metrics");
        const body = await response.json() as { ok?: boolean; metrics?: AdminMetrics; error?: string };

        if (!response.ok || !body.ok || !body.metrics) {
          throw new Error(body.error ?? "Unable to load admin metrics.");
        }

        if (activeRequest) {
          setMetrics(body.metrics);
        }
      } catch (error) {
        if (activeRequest) {
          setMetricsError(error instanceof Error ? error.message : "Unable to load admin metrics.");
        }
      } finally {
        if (activeRequest) {
          setMetricsLoading(false);
        }
      }
    };

    void loadMetrics();
    void loadReviewItems();
    void loadQuestions();

    return () => {
      activeRequest = false;
    };
  }, []);

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
              {label === "Bias review" && metrics.openBiasReviewItems > 0 && <i>{metrics.openBiasReviewItems}</i>}
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
              <div><strong>Version 2026.2 is live</strong><small>{metrics.questionCount || QUESTIONS.length} questions · {metricsLoading ? "loading counts" : `${formatNumber(metrics.totalProfiles)} profiles`}</small></div>
              <button>View release</button>
            </div>
          </section>

          {metricsError && (
            <section className="admin-panel admin-empty">
              <AlertTriangle />
              <div><strong>Live metrics unavailable</strong><p>{metricsError}</p></div>
            </section>
          )}

          <section className="admin-metrics">
            {[
              { label: "Profiles saved", value: formatNumber(metrics.totalProfiles), delta: `+${formatNumber(metrics.recentAccountProfiles + metrics.recentAnonymousProfiles)}`, icon: CheckCircle2, note: "last 7 days" },
              { label: "Registered users", value: formatNumber(metrics.users), delta: `+${formatNumber(metrics.recentUsers)}`, icon: Users, note: "last 7 days" },
              { label: "Question responses", value: formatNumber(metrics.totalResponses), delta: formatNumber(metrics.questionStats.length), icon: Activity, note: "questions with response data" },
              { label: "Avg. confidence", value: metrics.averageConfidence === null ? "No data" : `${metrics.averageConfidence}%`, delta: formatNumber(ratingTotal), icon: Gauge, note: "accuracy ratings submitted" },
            ].map((metric) => (
              <article key={metric.label}>
                <div><span>{metric.label}</span><metric.icon /></div>
                <strong>{metricsLoading ? "..." : metric.value}</strong>
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
                  ["Awaiting data", `${noDataCount}`, "Questions with no saved responses yet", ClipboardList],
                  ["Avg. skip rate", `${averageSkip}%`, "Based on saved response rows", Activity],
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
                    <button onClick={loadQuestions}><Settings2 /> Refresh</button>
                    <button onClick={createQuestion} disabled={questionSaving}><Plus /> Create draft</button>
                  </div>
                </div>
                {questionsError && <div className="admin-empty inline"><AlertTriangle /><p>{questionsError}</p></div>}
                <div className="editor-grid">
                  <div className="question-picker">
                    {adminQuestions.slice(0, 18).map((question) => (
                      <button
                        key={question.id}
                        className={selectedQuestion.number === question.number ? "active" : ""}
                        onClick={() => setSelectedQuestionId(question.number)}
                      >
                        <span>Q{question.number.toString().padStart(2, "0")} · {question.status}</span>
                        <p>{question.statement}</p>
                      </button>
                    ))}
                  </div>
                  <div className="editor-form">
                    <label><span>Statement</span><textarea key={`${selectedQuestion.id}-statement`} defaultValue={selectedQuestion.statement} onBlur={(event) => event.target.value !== selectedQuestion.statement && updateQuestion({ statement: event.target.value })} readOnly={questionSaving} /></label>
                    <label><span>Context note</span><textarea key={`${selectedQuestion.id}-context`} defaultValue={selectedQuestion.context} onBlur={(event) => event.target.value !== selectedQuestion.context && updateQuestion({ context: event.target.value })} readOnly={questionSaving} /></label>
                    <div className="editor-meta">
                      <label><span>Category</span><input value={selectedQuestion.category.name} readOnly /></label>
                      <label><span>Editorial status</span><input value={selectedQuestion.status} readOnly /></label>
                    </div>
                    <div className="weight-preview">
                      <h4>Health metrics</h4>
                      <div><span>Responses</span><b>{selectedQuestion.health.responseCount}</b></div>
                      <div><span>Skipped</span><b>{selectedQuestion.health.skippedCount}</b></div>
                      <div><span>Skip rate</span><b>{selectedQuestion.health.skipRate.toFixed(1)}%</b></div>
                      <div><span>Polarization</span><b>{selectedQuestion.health.polarization}</b></div>
                    </div>
                    <div className="governance-checklist">
                      <h4>Question workflow</h4>
                      {[
                        ["Submit review", "in_review"],
                        ["Approve", "approved"],
                        ["Publish", "published"],
                        ["Archive", "archived"],
                      ].map(([item, status]) => (
                        <button key={item} disabled={questionSaving} onClick={() => updateQuestionStatus(status as AdminQuestion["status"], item)}><CheckCircle2 /> {item}</button>
                      ))}
                    </div>
                    <div className="question-create-box">
                      <h4>Create draft question</h4>
                      <input value={questionForm.statement} onChange={(event) => setQuestionForm((current) => ({ ...current, statement: event.target.value }))} placeholder="Statement" />
                      <input value={questionForm.context} onChange={(event) => setQuestionForm((current) => ({ ...current, context: event.target.value }))} placeholder="Context note" />
                      <input value={questionForm.value} onChange={(event) => setQuestionForm((current) => ({ ...current, value: event.target.value }))} placeholder="Value label" />
                      <select value={questionForm.category} onChange={(event) => setQuestionForm((current) => ({ ...current, category: event.target.value as CategoryKey }))}>
                        {Object.entries(CATEGORIES).map(([key, category]) => <option key={key} value={key}>{category.name}</option>)}
                      </select>
                    </div>
                    <div className="review-comment-box question-comment-box">
                      <input value={questionComment} onChange={(event) => setQuestionComment(event.target.value)} placeholder="Add review comment" />
                      <button onClick={addQuestionComment} disabled={questionSaving}>Comment</button>
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
                  ["2026.2 live", `${metrics.questionCount || QUESTIONS.length} questions · current production version`, "View release notes"],
                ].map(([title, note, action]) => (
                  <article className="admin-panel version-card" key={title}>
                    <span>Live</span>
                    <h3>{title}</h3>
                    <p>{note}</p>
                    <button>{action}</button>
                  </article>
                ))}
              </div>
              <article className="admin-panel publish-gates">
                <div className="panel-header"><div><span>Publish readiness</span><h3>Release gates</h3></div><b>Live data only</b></div>
                {[
                  ["Question health review", `${watchCount} watch-list items from saved responses`, watchCount === 0],
                  ["Response coverage", `${noDataCount} questions still awaiting saved responses`, noDataCount === 0],
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
                <div className="panel-header">
                  <div><span>Review queue</span><h3>Bias review items</h3></div>
                  <b>{metrics.openBiasReviewItems} open</b>
                </div>
                <div className="bias-summary">
                  {[
                    ["Open", metrics.biasReviewByStatus.open ?? 0],
                    ["In review", metrics.biasReviewByStatus.in_review ?? 0],
                    ["Needs revision", metrics.biasReviewByStatus.needs_revision ?? 0],
                    ["Approved", metrics.biasReviewByStatus.approved ?? 0],
                    ["Resolved", metrics.biasReviewByStatus.resolved ?? 0],
                  ].map(([label, value]) => (
                    <span key={label as string}><strong>{value as number}</strong>{label as string}</span>
                  ))}
                </div>

                {reviewError && <div className="admin-empty inline"><AlertTriangle /><p>{reviewError}</p></div>}

                {reviewItems.length ? reviewItems.map((item) => (
                  <div className="review-item bias-review-item" key={item.id}>
                    <span>Q{item.question.number.toString().padStart(2, "0")}</span>
                    <div>
                      <div className="bias-review-meta">
                        <i className={`severity ${item.severity}`}>{item.severity}</i>
                        <i>{item.status.replace("_", " ")}</i>
                        <i>{item.commentCount} comments</i>
                        {item.assignedTo && <i>Assigned to {item.assignedTo}</i>}
                      </div>
                      <strong>{item.question.statement}</strong>
                      <p>{item.triggerSummary}</p>
                      <label className="review-comment-box">
                        <input
                          value={reviewComment[item.id] ?? ""}
                          onChange={(event) => setReviewComment((current) => ({ ...current, [item.id]: event.target.value }))}
                          placeholder="Add review note"
                        />
                        <button onClick={() => addReviewComment(item.id)}>Comment</button>
                      </label>
                    </div>
                    <div className="review-actions">
                      <button onClick={() => updateReviewItem(item.id, { assignToSelf: true, status: "in_review", note: "Assigned to self" })}>Assign</button>
                      <button onClick={() => updateReviewItem(item.id, { status: "approved", note: "Approved in bias review" })}>Approve</button>
                      <button onClick={() => updateReviewItem(item.id, { status: "needs_revision", note: "Needs revision" })}>Revise</button>
                      <button onClick={() => updateReviewItem(item.id, { status: "resolved", note: "Resolved" })}>Resolve</button>
                    </div>
                  </div>
                )) : (
                  <div className="admin-empty inline"><CheckCircle2 /><p>{reviewLoading ? "Loading review items..." : "No persisted bias review items yet."}</p></div>
                )}
              </article>

              <article className="admin-panel">
                <div className="panel-header"><div><span>Response signals</span><h3>Create review items from live data</h3></div><button onClick={loadReviewItems}>Refresh</button></div>
                {watchedQuestions.length ? watchedQuestions.map(({ question, flags, skipRate, polarization }) => (
                  <div className="review-item" key={question.id}>
                    <span>Q{question.number.toString().padStart(2, "0")}</span>
                    <div><strong>{question.statement}</strong><p>{flags.join(", ")} · {skipRate.toFixed(1)}% skipped · {polarization} response strength</p></div>
                    <button onClick={() => createReviewItem(question.number, flags.join(", "), polarization > 82 ? "high" : "medium")}>Create</button>
                  </div>
                )) : (
                  <div className="admin-empty inline"><CheckCircle2 /><p>No live response signals currently exceed the review threshold.</p></div>
                )}
              </article>
            </section>
          )}

          {active === "User feedback" && (
            <section className="admin-workbench feedback-feed">
              {metrics.accuracyRatings.length ? metrics.accuracyRatings.map(({ rating, count }) => (
                <article className="admin-panel feedback-note" key={rating}>
                  <span>{rating}</span>
                  <p>{formatNumber(count)} submitted ratings</p>
                  <button>View profiles</button>
                </article>
              )) : (
                <article className="admin-panel feedback-note">
                  <span>No feedback yet</span>
                  <p>Accuracy ratings will appear here after users submit anonymous research copies.</p>
                </article>
              )}
            </section>
          )}

          {active === "Analytics" && (
            <section className="admin-workbench analytics-grid">
              {[
                ["Saved account profiles", formatNumber(metrics.accountProfiles), `${formatNumber(metrics.recentAccountProfiles)} in the last 7 days`],
                ["Anonymous submissions", formatNumber(metrics.anonymousProfiles), `${formatNumber(metrics.recentAnonymousProfiles)} in the last 7 days`],
                ["Quick profiles", formatNumber(metrics.accountProfilesByMode.quick ?? 0), "account-saved quick assessments"],
                ["Full profiles", formatNumber(metrics.accountProfilesByMode.full ?? 0), "account-saved full assessments"],
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
                <div><span>Assessment activity</span><h3>Live profile totals</h3></div>
                <button>MySQL counts <ChevronDown /></button>
              </div>
              <div className="live-count-grid">
                <div><span>Anonymous research copies</span><strong>{formatNumber(metrics.anonymousProfiles)}</strong></div>
                <div><span>Account-saved profiles</span><strong>{formatNumber(metrics.accountProfiles)}</strong></div>
                <div><span>Normalized response rows</span><strong>{formatNumber(metrics.totalResponses)}</strong></div>
                <div><span>Registered users</span><strong>{formatNumber(metrics.users)}</strong></div>
              </div>
            </article>

            <article className="admin-panel confidence-panel">
              <div className="panel-header"><div><span>Result quality</span><h3>Confidence distribution</h3></div><button aria-label="More"><MoreHorizontal /></button></div>
              <div className="confidence-donut">
                <div><strong>{metrics.averageConfidence === null ? "0%" : `${metrics.averageConfidence}%`}</strong><small>average</small></div>
              </div>
              <div className="donut-legend">
                <span><i className="high" /> Profiles counted <b>{formatNumber(metrics.totalProfiles)}</b></span>
                <span><i className="medium" /> Ratings submitted <b>{formatNumber(ratingTotal)}</b></span>
                <span><i className="low" /> Questions with data <b>{formatNumber(metrics.questionStats.length)}</b></span>
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
                        <td><span className="question-id">Q{question.number.toString().padStart(2, "0")}</span><p>{question.statement}</p></td>
                        <td><span className={`category-tag ${categoryColors[question.category.key]}`}>{question.category.key}</span></td>
                        <td><span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`}><i />{status}</span></td>
                        <td><span className={`health-pill ${risk.toLowerCase()}`}>{clarity}%</span></td>
                        <td>{skipRate.toFixed(1)}%</td>
                        <td><div className="polar"><span style={{ width: `${polarization}%` }} /><b>{polarization}</b></div></td>
                        <td>
                          <div className="flag-list">
                            {(flags.length ? flags : ["No active flags"]).map((flag) => <span key={flag}>{flag}</span>)}
                          </div>
                        </td>
                        <td><button className="row-more" onClick={() => setSelectedQuestionId(question.number)}><MoreHorizontal /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing {visible.length} of {adminQuestions.length} questions · {watchCount} on watch list · {noDataCount} awaiting responses</span><button>Export health report <ArrowLeft /></button></div>
          </section>}

          {(active === "Overview" || active === "Analytics") && <section className="admin-bottom-grid">
            <article className="admin-panel attention-panel">
              <div className="panel-header"><div><span>Editorial workflow</span><h3>Needs attention</h3></div><b>{watchCount + noDataCount} items</b></div>
              {[
                [`${watchCount} questions on watch list`, "Based on live skip-rate and response-strength data", "Investigate"],
                [`${noDataCount} questions awaiting responses`, "Saved user data has not reached these questions yet", "Monitor"],
                [`${ratingTotal} accuracy ratings submitted`, "User feedback count from anonymous research copies", "Review"],
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
              {metrics.accuracyRatings.length ? (
                <>
                  <div className="feedback-bars">
                    {metrics.accuracyRatings.map(({ rating, count }) => {
                      const percent = ratingTotal ? Math.round((count / ratingTotal) * 100) : 0;

                      return <div key={rating}><span>{rating}</span><i><b style={{ width: `${percent}%` }} /></i><strong>{percent}%</strong></div>;
                    })}
                  </div>
                  <p><b>{formatNumber(ratingTotal)}</b> submitted ratings</p>
                </>
              ) : (
                <div className="admin-empty inline"><HelpCircle /> <p>No accuracy feedback has been submitted yet.</p></div>
              )}
            </article>
          </section>}
        </div>
      </main>
    </div>
  );
}
