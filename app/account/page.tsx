"use client";

import Link from "next/link";
import { ArrowLeft, Compass, LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type AuthUser = {
  publicId: string;
  email: string;
  displayName: string;
  role: "user" | "researcher" | "admin";
};

type SavedProfile = {
  id: string;
  title: string;
  mode: "quick" | "full";
  answeredCount: number;
  skippedCount: number;
  confidence: number;
  createdAt: string;
};

type AuthMode = "login" | "signup";

export default function AccountPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadProfiles = async () => {
    const response = await fetch("/api/account/profiles");

    if (response.ok) {
      const body = await response.json() as { profiles?: SavedProfile[] };
      setProfiles(body.profiles ?? []);
    }
  };

  const loadSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me");
      const body = await response.json() as { user?: AuthUser | null };
      setUser(body.user ?? null);

      if (body.user) {
        await loadProfiles();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
  }, []);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          email,
          password,
        }),
      });
      const body = await response.json() as { ok?: boolean; user?: AuthUser; error?: string };

      if (!response.ok || !body.ok || !body.user) {
        throw new Error(body.error ?? "Authentication failed.");
      }

      setUser(body.user);
      setPassword("");
      await loadProfiles();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProfiles([]);
  };

  return (
    <main className="account-shell">
      <section className="account-header">
        <Link href="/" className="text-button"><ArrowLeft size={16} /> Back to assessment</Link>
        <div>
          <span className="brand">
            <span className="brand-mark" aria-hidden="true"><Compass size={21} strokeWidth={1.8} /></span>
            <span>Civic Compass</span>
          </span>
          <h1>Your account</h1>
          <p>Save assessment snapshots to your profile and return to them later.</p>
        </div>
      </section>

      {loading ? (
        <section className="account-panel">
          <p>Loading account...</p>
        </section>
      ) : user ? (
        <section className="account-grid">
          <article className="account-panel account-profile">
            <div className="save-icon"><ShieldCheck /></div>
            <div>
              <span className="card-kicker">Signed in</span>
              <h2>{user.displayName}</h2>
              <p>{user.email}</p>
              <small>Role: {user.role}</small>
            </div>
            <button className="button secondary" onClick={logout}><LogOut size={16} /> Log out</button>
          </article>

          <article className="account-panel account-history">
            <div>
              <span className="card-kicker">Saved profiles</span>
              <h2>Assessment history</h2>
            </div>
            {profiles.length ? (
              <div className="profile-list">
                {profiles.map((profile) => (
                  <div key={profile.id}>
                    <div>
                      <strong>{profile.title}</strong>
                      <small>{new Date(profile.createdAt).toLocaleDateString()} · {profile.mode} · {profile.answeredCount} answered</small>
                    </div>
                    <span>{profile.confidence}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No account-saved profiles yet. Complete an assessment, then choose the account save option on your results.</p>
            )}
          </article>
        </section>
      ) : (
        <section className="account-auth">
          <article className="account-panel">
            <div className="auth-tabs" role="tablist">
              <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")} type="button">
                <LogIn size={16} /> Log in
              </button>
              <button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")} type="button">
                <UserPlus size={16} /> Sign up
              </button>
            </div>
            <form className="account-form" onSubmit={submitAuth}>
              {authMode === "signup" && (
                <label>
                  <span>Display name</span>
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
                </label>
              )}
              <label>
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={authMode === "login" ? "current-password" : "new-password"} />
              </label>
              {error && <small role="alert">{error}</small>}
              <button className="button primary" disabled={submitting}>
                {submitting ? "Working..." : authMode === "login" ? "Log in" : "Create account"}
              </button>
            </form>
          </article>
        </section>
      )}
    </main>
  );
}
