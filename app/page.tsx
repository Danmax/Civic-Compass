"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Compass,
  Download,
  Eye,
  Flag,
  HeartHandshake,
  Info,
  Leaf,
  LockKeyhole,
  Menu,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ANSWERS,
  CATEGORIES,
  DIMENSIONS,
  IMPORTANCE,
  QUESTIONS,
  type CategoryKey,
  type DimensionKey,
} from "./data";

type AnswerMap = Record<number, number | null>;
type ImportanceMap = Record<number, number>;
type Screen = "home" | "quiz" | "results";
type ResultTab = "overview" | "issues" | "scoring";

const DIMENSION_ORDER = Object.keys(DIMENSIONS) as DimensionKey[];
const CATEGORY_ORDER = Object.keys(CATEGORIES) as CategoryKey[];

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <Compass size={21} strokeWidth={1.8} />
      </span>
      <span>Civic Compass</span>
    </span>
  );
}

function Header({
  screen,
  onHome,
}: {
  screen: Screen;
  onHome: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <button className="brand-button" onClick={onHome} aria-label="Civic Compass home">
        <Brand />
      </button>
      <nav className={`nav-links ${open ? "is-open" : ""}`} aria-label="Main navigation">
        <button onClick={onHome}>How it works</button>
        <button onClick={onHome}>Our methodology</button>
        <Link href="/admin">For researchers</Link>
        {screen !== "quiz" && (
          <button className="nav-cta" onClick={() => document.getElementById("privacy")?.scrollIntoView()}>
            <LockKeyhole size={15} /> Privacy promise
          </button>
        )}
      </nav>
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Brand />
        <p>Built for reflection, not persuasion.</p>
      </div>
      <div className="footer-links">
        <a href="#method">Methodology</a>
        <a href="#privacy">Privacy</a>
        <Link href="/admin">Research portal</Link>
        <a href="mailto:hello@civiccompass.org">Contact</a>
      </div>
      <p className="footer-note">Nonpartisan · Anonymous by default · Open scoring</p>
    </footer>
  );
}

function Home({
  onStart,
  onSample,
}: {
  onStart: () => void;
  onSample: () => void;
}) {
  return (
    <>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            A private, nonpartisan assessment
          </div>
          <h1>
            Politics is more than
            <br />
            <em>left</em> or <em>right.</em>
          </h1>
          <p className="hero-copy">
            Discover how your values, priorities, and policy views fit together—with nuance, context, and
            no party labels.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={onStart}>
              Begin the assessment <ArrowRight size={18} />
            </button>
            <button className="button secondary" onClick={onSample}>
              Explore a sample profile
            </button>
          </div>
          <div className="hero-meta">
            <span><span>40</span> balanced questions</span>
            <i />
            <span><span>6–7</span> minutes</span>
            <i />
            <span><LockKeyhole size={15} /> No account needed</span>
          </div>
          <div className="compass-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="needle">
              <span />
            </div>
            <span className="direction north">N</span>
            <span className="direction east">E</span>
            <span className="direction south">S</span>
            <span className="direction west">W</span>
          </div>
        </section>

        <section className="intro-strip">
          <p>
            Most people hold views that cross political traditions. This assessment is designed to find
            those intersections—not flatten them.
          </p>
        </section>

        <section className="section dimensions-section" id="method">
          <div className="section-kicker">A fuller picture</div>
          <div className="section-heading">
            <h2>Ten dimensions. One nuanced profile.</h2>
            <p>
              Your answers are measured independently across distinct civic dimensions. Supporting public
              healthcare doesn’t predetermine your views on family, borders, speech, or criminal justice.
            </p>
          </div>
          <div className="dimension-preview">
            <div className="preview-card large">
              <div className="preview-icon"><Scale /></div>
              <span>Economic approach</span>
              <div className="mini-axis"><b style={{ left: "58%" }} /><i /></div>
              <div className="axis-ends"><small>Public investment</small><small>Economic freedom</small></div>
            </div>
            <div className="preview-card">
              <div className="preview-icon"><HeartHandshake /></div>
              <span>Social outlook</span>
              <p>Progressive ↔ Traditional</p>
            </div>
            <div className="preview-card">
              <div className="preview-icon"><Leaf /></div>
              <span>Liberty & authority</span>
              <p>Individual choice ↔ Public order</p>
            </div>
            <div className="preview-card">
              <div className="preview-icon"><Users /></div>
              <span>Equal treatment</span>
              <p>Identity-conscious ↔ Individual</p>
            </div>
          </div>
          <div className="dimension-more">+ six more independent dimensions in your full profile</div>
        </section>

        <section className="section process-section">
          <div className="section-kicker">How it works</div>
          <div className="process-grid">
            <article>
              <span className="step-number">01</span>
              <h3>Consider the statement</h3>
              <p>Respond to clear, balanced prompts spanning values and current public policy.</p>
            </article>
            <article>
              <span className="step-number">02</span>
              <h3>Tell us what matters</h3>
              <p>Rate importance so we can distinguish a passing opinion from a core conviction.</p>
            </article>
            <article>
              <span className="step-number">03</span>
              <h3>Explore your profile</h3>
              <p>See each score, what shaped it, and balanced context for further learning.</p>
            </article>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div className="privacy-card">
            <div className="privacy-seal"><ShieldCheck /></div>
            <div>
              <div className="section-kicker">Your views belong to you</div>
              <h2>Private by design. Anonymous by default.</h2>
              <p>
                Your assessment stays in this browser unless you explicitly choose to save it. We never
                sell, share, or use political profiles for advertising—full stop.
              </p>
              <div className="privacy-points">
                <span><Check /> No name or email required</span>
                <span><Check /> No precise location collected</span>
                <span><Check /> Delete your results anytime</span>
                <span><Check /> Transparent, inspectable scoring</span>
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <span className="section-kicker">Find your bearings</span>
          <h2>Understand your views.<br />In your own terms.</h2>
          <button className="button primary light" onClick={onStart}>
            Begin the assessment <ArrowRight size={18} />
          </button>
          <p>Free · Anonymous · About 7 minutes</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Quiz({
  answers,
  importance,
  setAnswers,
  setImportance,
  onComplete,
  onExit,
}: {
  answers: AnswerMap;
  importance: ImportanceMap;
  setAnswers: React.Dispatch<React.SetStateAction<AnswerMap>>;
  setImportance: React.Dispatch<React.SetStateAction<ImportanceMap>>;
  onComplete: () => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const question = QUESTIONS[index];
  const answer = answers[question.id];
  const important = importance[question.id] ?? 1;
  const answered = Object.keys(answers).length;

  const next = () => {
    if (index === QUESTIONS.length - 1) onComplete();
    else {
      setIndex(index + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const skip = () => {
    setAnswers((current) => ({ ...current, [question.id]: null }));
    next();
  };

  return (
    <main className="quiz-shell">
      <div className="quiz-topline">
        <button className="text-button" onClick={onExit}><ArrowLeft size={16} /> Save & exit</button>
        <span>{answered} of {QUESTIONS.length} answered</span>
      </div>
      <div className="quiz-progress" aria-label={`Question ${index + 1} of ${QUESTIONS.length}`}>
        <span style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <div className="quiz-layout">
        <aside className="quiz-aside">
          <span className="topic-count">Current focus</span>
          <h2>{CATEGORIES[question.category].name}</h2>
          <p>{CATEGORIES[question.category].description}</p>
          <div className="topic-list">
            {CATEGORY_ORDER.map((key, i) => {
              const complete = QUESTIONS.filter((item) => item.category === key).every((item) => item.id in answers);
              return (
                <span key={key} className={key === question.category ? "active" : complete ? "done" : ""}>
                  <i>{complete ? <Check size={12} /> : i + 1}</i>
                  {CATEGORIES[key].short}
                </span>
              );
            })}
          </div>
        </aside>
        <section className="question-card">
          <div className="question-label">Question {index + 1}</div>
          <h1>{question.statement}</h1>
          <div className="context-note"><Info size={16} /><span>{question.context}</span></div>
          <fieldset className="answer-fieldset">
            <legend>Your response</legend>
            <div className="answer-grid">
              {ANSWERS.map((choice) => (
                <button
                  key={choice.value}
                  className={`answer-choice ${answer === choice.value ? "selected" : ""}`}
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: choice.value }))}
                  aria-pressed={answer === choice.value}
                >
                  <span className="radio">{answer === choice.value && <i />}</span>
                  {choice.label}
                </button>
              ))}
            </div>
          </fieldset>
          {answer !== undefined && answer !== null && (
            <fieldset className="importance-fieldset">
              <legend>How important is this issue to you?</legend>
              <p>This helps distinguish a preference from a core value.</p>
              <div className="importance-grid">
                {IMPORTANCE.map((choice) => (
                  <button
                    key={choice.value}
                    className={important === choice.value ? "selected" : ""}
                    onClick={() => setImportance((current) => ({ ...current, [question.id]: choice.value }))}
                    aria-pressed={important === choice.value}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div className="question-actions">
            <button className="button ghost" onClick={skip}>Skip this question</button>
            <div>
              <button
                className="icon-button"
                disabled={index === 0}
                onClick={() => setIndex(Math.max(0, index - 1))}
                aria-label="Previous question"
              >
                <ArrowLeft size={18} />
              </button>
              <button className="button primary" disabled={answer === undefined} onClick={next}>
                {index === QUESTIONS.length - 1 ? "See my profile" : "Continue"} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
      <p className="quiz-privacy"><LockKeyhole size={14} /> Responses are stored only in this browser unless you choose to save them.</p>
    </main>
  );
}

function scoreAnswers(answers: AnswerMap, importance: ImportanceMap) {
  const totals = Object.fromEntries(DIMENSION_ORDER.map((key) => [key, 0])) as Record<DimensionKey, number>;
  const maximums = Object.fromEntries(DIMENSION_ORDER.map((key) => [key, 0])) as Record<DimensionKey, number>;
  const counts = Object.fromEntries(DIMENSION_ORDER.map((key) => [key, 0])) as Record<DimensionKey, number>;

  QUESTIONS.forEach((question) => {
    const answer = answers[question.id];
    if (answer === undefined || answer === null) return;
    question.weights.forEach(({ dimension, weight }) => {
      const multiplier = importance[question.id] ?? 1;
      totals[dimension] += answer * weight * multiplier;
      maximums[dimension] += 3 * Math.abs(weight) * multiplier;
      counts[dimension] += 1;
    });
  });

  const scores = Object.fromEntries(
    DIMENSION_ORDER.map((key) => [key, maximums[key] ? Math.round((totals[key] / maximums[key]) * 100) : 0]),
  ) as Record<DimensionKey, number>;

  return { scores, counts };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function encryptProfile(payload: object, passphrase: string) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );

  return {
    version: 1,
    algorithm: "AES-GCM",
    keyDerivation: "PBKDF2-SHA256",
    iterations: 250_000,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

function strengthLabel(score: number) {
  const abs = Math.abs(score);
  if (abs < 12) return "Balanced";
  if (abs < 30) return "Leans";
  if (abs < 55) return "Moderate";
  return "Strong";
}

function dimensionPosition(key: DimensionKey, score: number) {
  const dim = DIMENSIONS[key];
  if (Math.abs(score) < 12) return `Balanced between ${dim.low.toLowerCase()} and ${dim.high.toLowerCase()}`;
  return `${strengthLabel(score)} ${score < 0 ? dim.low.toLowerCase() : dim.high.toLowerCase()}`;
}

function Radar({ scores }: { scores: Record<DimensionKey, number> }) {
  const keys = DIMENSION_ORDER.slice(0, 8);
  const center = 150;
  const radius = 92;
  const point = (i: number, r: number) => {
    const angle = -Math.PI / 2 + (i / keys.length) * Math.PI * 2;
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  };
  const polygon = (r: number) => keys.map((_, i) => point(i, r).join(",")).join(" ");
  const valuePoints = keys
    .map((key, i) => point(i, radius * (0.5 + Math.abs(scores[key]) / 200)).join(","))
    .join(" ");

  return (
    <svg className="radar-chart" viewBox="0 0 300 300" role="img" aria-label="Eight-axis political profile chart">
      {[0.25, 0.5, 0.75, 1].map((n) => <polygon key={n} points={polygon(radius * n)} className="radar-grid" />)}
      {keys.map((key, i) => {
        const [x, y] = point(i, radius);
        const [tx, ty] = point(i, radius + 30);
        return (
          <g key={key}>
            <line x1={center} y1={center} x2={x} y2={y} className="radar-line" />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle">{DIMENSIONS[key].name.split(" ")[0]}</text>
          </g>
        );
      })}
      <polygon points={valuePoints} className="radar-value" />
      {keys.map((key, i) => {
        const [x, y] = point(i, radius * (0.5 + Math.abs(scores[key]) / 200));
        return <circle key={key} cx={x} cy={y} r="4" className="radar-dot" />;
      })}
    </svg>
  );
}

function CompassMap({ scores }: { scores: Record<DimensionKey, number> }) {
  const x = 50 + scores.economic * 0.42;
  const y = 50 + scores.social * 0.42;
  return (
    <div className="political-map" role="img" aria-label="Political compass showing economic and social position">
      <div className="map-label top">Traditional</div>
      <div className="map-label bottom">Progressive</div>
      <div className="map-label left">Public investment</div>
      <div className="map-label right">Economic freedom</div>
      <div className="map-cross horizontal" />
      <div className="map-cross vertical" />
      <div className="map-ring" />
      <div className="map-point" style={{ left: `${x}%`, top: `${y}%` }}>
        <span>You</span>
      </div>
    </div>
  );
}

function Results({
  answers,
  importance,
  onRetake,
}: {
  answers: AnswerMap;
  importance: ImportanceMap;
  onRetake: () => void;
}) {
  const [tab, setTab] = useState<ResultTab>("overview");
  const [expandedDimension, setExpandedDimension] = useState<DimensionKey | null>("economic");
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>("economy");
  const [saved, setSaved] = useState(false);
  const [savePrompt, setSavePrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [saveError, setSaveError] = useState("");
  const [rating, setRating] = useState<string | null>(null);
  const { scores, counts } = useMemo(() => scoreAnswers(answers, importance), [answers, importance]);
  const answeredValues = Object.values(answers);
  const answeredCount = answeredValues.filter((v) => v !== null && v !== undefined).length;
  const uncertainCount = answeredValues.filter((v) => v === 0 || v === null).length;
  const confidence = Math.round(72 + (answeredCount / QUESTIONS.length) * 23 - uncertainCount * 0.35);

  const rankedValues = useMemo(() => {
    return QUESTIONS.filter((question) => answers[question.id] !== null && answers[question.id] !== undefined)
      .map((question) => ({
        value: question.value,
        strength: Math.abs(answers[question.id] ?? 0) * (importance[question.id] ?? 1),
      }))
      .sort((a, b) => b.strength - a.strength)
      .filter((item, index, all) => all.findIndex((other) => other.value === item.value) === index)
      .slice(0, 5);
  }, [answers, importance]);

  const categoryScore = (key: CategoryKey) => {
    const qs = QUESTIONS.filter((item) => item.category === key && typeof answers[item.id] === "number");
    if (!qs.length) return 0;
    return Math.round(
      qs.reduce((sum, item) => sum + Math.abs(answers[item.id] ?? 0) * (importance[item.id] ?? 1), 0) /
        qs.length /
        4.2 *
        100,
    );
  };

  const leaningEconomic = scores.economic > 12 ? "economically market-oriented" : scores.economic < -12 ? "supportive of public investment" : "economically balanced";
  const leaningSocial = scores.social > 12 ? "cautious about rapid social change" : scores.social < -12 ? "open to social reform" : "moderate on social questions";

  useEffect(() => {
    setSaved(Boolean(localStorage.getItem("civic-compass-profile")));
  }, []);

  return (
    <main className="results-shell">
      <section className="results-hero">
        <div className="eyebrow light"><Sparkles size={14} /> Your civic profile</div>
        <h1>Pragmatic pluralist</h1>
        <p>
          You tend to be <strong>{leaningEconomic}</strong> while remaining <strong>{leaningSocial}</strong>.
          Your answers favor practical tradeoffs over a single ideological position.
        </p>
        <div className="result-caveat">
          <Info size={17} />
          This is an estimate based only on your responses—not a label, diagnosis, or endorsement.
        </div>
      </section>

      <div className="results-nav">
        <div className="tab-list" role="tablist">
          {([
            ["overview", "Profile overview"],
            ["issues", "Issue breakdown"],
            ["scoring", "Your answers & scoring"],
          ] as [ResultTab, string][]).map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)} role="tab">
              {label}
            </button>
          ))}
        </div>
        <button className="button export" onClick={() => window.print()}><Download size={16} /> Export report</button>
      </div>

      {tab === "overview" && (
        <div className="results-content">
          <section className="result-summary-grid">
            <article className="result-card compass-card">
              <div className="card-heading">
                <div><span className="card-kicker">Political spectrum</span><h2>Your position</h2></div>
                <span className="confidence-pill"><i /> {confidence}% confidence</span>
              </div>
              <CompassMap scores={scores} />
              <p className="chart-caption">
                This map shows two dimensions at once. The full profile below keeps all ten dimensions
                independent.
              </p>
            </article>
            <article className="result-card radar-card">
              <div className="card-heading">
                <div><span className="card-kicker">Multi-axis view</span><h2>Your civic shape</h2></div>
              </div>
              <Radar scores={scores} />
            </article>
          </section>

          <section className="result-section">
            <div className="result-section-heading">
              <div><span className="card-kicker">Dimension scores</span><h2>How your views balance out</h2></div>
              <p>Select any score to see exactly what shaped it.</p>
            </div>
            <div className="score-grid">
              {DIMENSION_ORDER.map((key, index) => {
                const dim = DIMENSIONS[key];
                const score = scores[key];
                const percentile = Math.max(4, Math.min(96, Math.round(50 + score * 0.42)));
                const open = expandedDimension === key;
                return (
                  <article className={`score-card ${open ? "open" : ""}`} key={key}>
                    <button onClick={() => setExpandedDimension(open ? null : key)}>
                      <div className="score-icon">{index + 1}</div>
                      <div className="score-main">
                        <span>{dim.name}</span>
                        <strong>{dimensionPosition(key, score)}</strong>
                      </div>
                      <span className="score-number">{score > 0 ? "+" : ""}{score}</span>
                      <ChevronDown className="score-chevron" size={18} />
                    </button>
                    <div className="axis-bar">
                      <i /><b style={{ left: `${50 + score * 0.46}%` }} />
                    </div>
                    <div className="axis-ends"><small>{dim.low}</small><small>{dim.high}</small></div>
                    {open && (
                      <div className="score-detail">
                        <p>{dim.explanation}</p>
                        <div>
                          <span><strong>{percentile}th</strong> approximate percentile</span>
                          <span><strong>{counts[key]}</strong> answers contributed</span>
                        </div>
                        <small>Percentiles are illustrative population estimates in this prototype and are not demographic predictions.</small>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="values-grid">
            <article className="result-card core-values">
              <span className="card-kicker">What guides you</span>
              <h2>Your core values</h2>
              <p>The priorities most strongly expressed across your answers.</p>
              <ol>
                {rankedValues.map((item, i) => (
                  <li key={item.value}>
                    <span>{i + 1}</span>
                    <div><strong>{item.value}</strong><i style={{ width: `${86 - i * 11}%` }} /></div>
                  </li>
                ))}
              </ol>
            </article>
            <article className="result-card belief-strength">
              <span className="card-kicker">Strength of beliefs</span>
              <h2>Conviction & nuance</h2>
              <div className="strength-row">
                <span className="strength-icon strong"><Flag /></span>
                <div><strong>Strong convictions</strong><p>Free expression, public safety, individual fairness</p></div>
              </div>
              <div className="strength-row">
                <span className="strength-icon moderate"><Scale /></span>
                <div><strong>Moderate opinions</strong><p>Public services, border policy, pace of reform</p></div>
              </div>
              <div className="strength-row">
                <span className="strength-icon mixed"><HeartHandshake /></span>
                <div><strong>Mixed viewpoints</strong><p>Institutional trust, market regulation, family policy</p></div>
              </div>
              <div className="strength-row">
                <span className="strength-icon uncertain"><Info /></span>
                <div><strong>Uncertain or skipped</strong><p>{uncertainCount} responses lowered confidence slightly</p></div>
              </div>
            </article>
          </section>

          <section className="interpretation">
            <span className="card-kicker">Overall summary</span>
            <h2>Your views cross several political traditions.</h2>
            <p>
              Your responses currently align most closely with a pragmatic, politically mixed outlook.
              You place importance on {rankedValues.slice(0, 3).map((v) => v.value.toLowerCase()).join(", ")}
              , while allowing context to shape how those values apply. You appear comfortable combining
              ideas associated with different traditions rather than treating any platform as a complete package.
            </p>
            <p>
              Results can change as your experiences and priorities change. Political labels also mean different
              things in different places, so this summary is best used as a starting point for reflection.
            </p>
          </section>
        </div>
      )}

      {tab === "issues" && (
        <div className="results-content narrow">
          <section className="result-section">
            <div className="result-section-heading">
              <div><span className="card-kicker">Issue breakdown</span><h2>Seven topics, with context</h2></div>
              <p>Each section connects your score to the answers that influenced it and offers neutral reading.</p>
            </div>
            <div className="issue-list">
              {CATEGORY_ORDER.map((key) => {
                const category = CATEGORIES[key];
                const score = categoryScore(key);
                const open = expandedCategory === key;
                const related = QUESTIONS.filter((question) => question.category === key);
                return (
                  <article className={`issue-card ${open ? "open" : ""}`} key={key}>
                    <button className="issue-toggle" onClick={() => setExpandedCategory(open ? null : key)}>
                      <span className="issue-score">{score}<small>/100</small></span>
                      <div><h3>{category.name}</h3><p>{category.description}</p></div>
                      <ChevronDown />
                    </button>
                    {open && (
                      <div className="issue-detail">
                        <div className="education-grid">
                          <div><span>What it means</span><p>{category.description}</p></div>
                          <div><span>Historical context</span><p>{category.history}</p></div>
                          <div><span>Common viewpoints</span><p>{category.viewpoints}</p></div>
                          <div><span>Key policy debates</span><p>{category.debate}</p></div>
                        </div>
                        <div className="influencing">
                          <h4>Questions influencing this score</h4>
                          {related.map((question) => (
                            <div key={question.id}>
                              <span>{answers[question.id] === null || answers[question.id] === undefined
                                ? "Skipped"
                                : ANSWERS.find((a) => a.value === answers[question.id])?.short}</span>
                              <p>{question.statement}</p>
                            </div>
                          ))}
                        </div>
                        <div className="reading">
                          <h4><BookOpen size={17} /> Additional reading</h4>
                          {category.reading.map((item) => <a href="#" key={item}>{item} <ArrowRight size={14} /></a>)}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {tab === "scoring" && (
        <div className="results-content narrow">
          <section className="result-section">
            <div className="result-section-heading">
              <div><span className="card-kicker">Full transparency</span><h2>Every answer. Every weight.</h2></div>
              <p>No hidden scoring. Positive and negative values indicate direction—not right or wrong.</p>
            </div>
            <div className="scoring-note">
              <Eye />
              <div><strong>How the score works</strong><p>Response value (−3 to +3) × importance multiplier × dimension weight. Scores are then normalized to −100–+100.</p></div>
            </div>
            <div className="answer-ledger">
              {QUESTIONS.map((question) => {
                const answer = answers[question.id];
                return (
                  <details key={question.id}>
                    <summary>
                      <span className="ledger-number">{question.id.toString().padStart(2, "0")}</span>
                      <div><strong>{question.statement}</strong><small>{answer === null || answer === undefined ? "Skipped" : ANSWERS.find((a) => a.value === answer)?.label}</small></div>
                      <ChevronDown />
                    </summary>
                    <div className="ledger-detail">
                      <p><strong>Why it matters:</strong> This question measures {question.value.toLowerCase()} and may contribute independently to more than one dimension.</p>
                      <div className="weight-table">
                        <span>Dimension</span><span>Weight</span><span>Contribution</span>
                        {question.weights.map(({ dimension, weight }) => (
                          <div className="weight-row" key={dimension}>
                            <span>{DIMENSIONS[dimension].name}</span>
                            <span>{weight > 0 ? "+" : ""}{weight.toFixed(2)} {weight < 0 && "· reverse direction"}</span>
                            <span>{typeof answer === "number" ? (answer * weight * (importance[question.id] ?? 1)).toFixed(2) : "—"}</span>
                          </div>
                        ))}
                      </div>
                      {answer === null && <small>A skipped answer adds no directional score and lowers confidence for the affected dimensions.</small>}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <section className="result-followup">
        <article className="save-result-card">
          <div className="save-icon"><LockKeyhole /></div>
          <div>
            <span className="card-kicker">Your choice</span>
            <h2>{saved ? "Encrypted on this device" : savePrompt ? "Protect your saved profile" : "Keep this snapshot?"}</h2>
            <p>
              {saved
                ? "Your answers are encrypted with AES-256-GCM and stored only in this browser."
                : savePrompt
                  ? "Choose a passphrase of at least 8 characters. We never store it and cannot recover it."
                  : "Saving is optional. Nothing leaves this browser and no account is required."}
            </p>
          </div>
          {saved ? (
            <button
              className="button secondary"
              onClick={() => {
                localStorage.removeItem("civic-compass-profile");
                setSaved(false);
                setSavePrompt(false);
              }}
            >
              Delete saved result
            </button>
          ) : savePrompt ? (
            <div className="save-form">
              <label>
                <span>Encryption passphrase</span>
                <input
                  type="password"
                  value={passphrase}
                  minLength={8}
                  autoComplete="new-password"
                  onChange={(event) => {
                    setPassphrase(event.target.value);
                    setSaveError("");
                  }}
                  placeholder="At least 8 characters"
                />
              </label>
              {saveError && <small role="alert">{saveError}</small>}
              <div>
                <button
                  className="button ghost"
                  onClick={() => {
                    setSavePrompt(false);
                    setPassphrase("");
                    setSaveError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  disabled={saving}
                  onClick={async () => {
                    if (passphrase.length < 8) {
                      setSaveError("Use at least 8 characters.");
                      return;
                    }
                    setSaving(true);
                    try {
                      const encrypted = await encryptProfile(
                        { answers, importance, savedAt: new Date().toISOString() },
                        passphrase,
                      );
                      localStorage.setItem("civic-compass-profile", JSON.stringify(encrypted));
                      setPassphrase("");
                      setSavePrompt(false);
                      setSaved(true);
                    } catch {
                      setSaveError("This browser could not encrypt the profile.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Encrypting…" : "Encrypt & save"}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="button primary"
              onClick={() => setSavePrompt(true)}
            >
              Save on this device
            </button>
          )}
        </article>
        <article className="accuracy-card">
          <span className="card-kicker">Help us improve</span>
          <h2>How accurately does this profile represent your beliefs?</h2>
          {rating ? (
            <div className="thanks-message"><CheckCircle2 /> Thank you. Your feedback helps improve question quality.</div>
          ) : (
            <div className="rating-options">
              {["Very accurately", "Mostly accurately", "Somewhat accurately", "Not very accurately", "Not accurately at all"].map((option) => (
                <button key={option} onClick={() => setRating(option)}>{option}</button>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="results-actions">
        <div><h2>Your profile is a snapshot, not a verdict.</h2><p>Views evolve. Retake anytime to see what changed.</p></div>
        <button className="button secondary" onClick={onRetake}><RotateCcw size={16} /> Retake assessment</button>
      </section>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [importance, setImportance] = useState<ImportanceMap>({});

  const start = () => {
    setAnswers({});
    setImportance({});
    setScreen("quiz");
    window.scrollTo(0, 0);
  };

  const sample = () => {
    const sampleAnswers = Object.fromEntries(
      QUESTIONS.map((question, index) => [question.id, [-2, 2, 1, 3, 2, 1, 2, -1, 1, 2, 3, -1, 2, 1, 3][index % 15]]),
    );
    const sampleImportance = Object.fromEntries(
      QUESTIONS.map((question, index) => [question.id, [1, 1.2, 1.4, 1][index % 4]]),
    );
    setAnswers(sampleAnswers);
    setImportance(sampleImportance);
    setScreen("results");
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview === "results") sample();
    if (preview === "quiz") {
      setScreen("quiz");
      window.scrollTo(0, 0);
    }
    // Preview URLs are intentionally read once on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const home = () => {
    setScreen("home");
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Header screen={screen} onHome={home} />
      {screen === "home" && <Home onStart={start} onSample={sample} />}
      {screen === "quiz" && (
        <Quiz
          answers={answers}
          importance={importance}
          setAnswers={setAnswers}
          setImportance={setImportance}
          onComplete={() => { setScreen("results"); window.scrollTo(0, 0); }}
          onExit={home}
        />
      )}
      {screen === "results" && <Results answers={answers} importance={importance} onRetake={start} />}
    </>
  );
}
