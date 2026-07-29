"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
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
import { useState } from "react";
import { QUESTIONS } from "../data";

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

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Overview");
  const visible = QUESTIONS.filter((q) => q.statement.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

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
              <p>Here’s how Civic Compass is performing this assessment cycle.</p>
            </div>
            <div className="release-state">
              <CheckCircle2 />
              <div><strong>Version 2026.2 is live</strong><small>Published July 18 · 40 questions</small></div>
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

          <section className="admin-chart-grid">
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
          </section>

          <section className="admin-table-panel">
            <div className="table-title">
              <div><span>Question governance</span><h3>Question health</h3><p>Monitor skip rates, polarization, and editorial status.</p></div>
              <div className="table-tools">
                <label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions" /></label>
                <button><Filter /> Filter</button>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>Question</th><th>Category</th><th>Status</th><th>Skip rate</th><th>Polarization</th><th /></tr></thead>
                <tbody>
                  {visible.map((question, index) => {
                    const status = statusCycle[index % statusCycle.length];
                    return (
                      <tr key={question.id}>
                        <td><span className="question-id">Q{question.id.toString().padStart(2, "0")}</span><p>{question.statement}</p></td>
                        <td><span className={`category-tag ${categoryColors[question.category]}`}>{question.category}</span></td>
                        <td><span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`}><i />{status}</span></td>
                        <td>{(2.4 + (index * 1.7) % 8).toFixed(1)}%</td>
                        <td><div className="polar"><span style={{ width: `${38 + index * 7}%` }} /><b>{38 + index * 7}</b></div></td>
                        <td><button className="row-more"><MoreHorizontal /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing {visible.length} of {QUESTIONS.length} questions</span><button>View all questions <ArrowLeft /></button></div>
          </section>

          <section className="admin-bottom-grid">
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
          </section>
        </div>
      </main>
    </div>
  );
}
