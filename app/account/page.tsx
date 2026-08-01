"use client";

import Link from "next/link";
import { ArrowLeft, Compass, KeyRound, LogIn, LogOut, Pencil, ShieldCheck, Trash2, UserPlus } from "lucide-react";
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [renamingProfileId, setRenamingProfileId] = useState<string | null>(null);
  const [profileTitle, setProfileTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountUpdating, setAccountUpdating] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");

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
      setDisplayName(body.user?.displayName ?? "");

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
      setDisplayName(body.user.displayName);
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
    setDisplayName("");
    setPassword("");
    setCurrentPassword("");
    setNewPassword("");
    setDeletePassword("");
    setAccountMessage("");
  };

  const updateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountUpdating(true);
    setAccountMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });
      const body = await response.json() as { ok?: boolean; user?: AuthUser; error?: string };

      if (!response.ok || !body.ok || !body.user) {
        throw new Error(body.error ?? "Unable to update account.");
      }

      setUser(body.user);
      setDisplayName(body.user.displayName);
      setAccountMessage("Account updated.");
    } catch (updateError) {
      setAccountMessage(updateError instanceof Error ? updateError.message : "Unable to update account.");
    } finally {
      setAccountUpdating(false);
    }
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordUpdating(true);
    setAccountMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setAccountMessage("Password updated. Please log in again.");
      setUser(null);
      setProfiles([]);
    } catch (updateError) {
      setAccountMessage(updateError instanceof Error ? updateError.message : "Unable to update password.");
    } finally {
      setPasswordUpdating(false);
    }
  };

  const deleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountDeleting(true);
    setAccountMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to delete account.");
      }

      setUser(null);
      setProfiles([]);
      setDeletePassword("");
      setAccountMessage("");
    } catch (deleteError) {
      setAccountMessage(deleteError instanceof Error ? deleteError.message : "Unable to delete account.");
    } finally {
      setAccountDeleting(false);
    }
  };

  const startRenamingProfile = (profile: SavedProfile) => {
    setRenamingProfileId(profile.id);
    setProfileTitle(profile.title);
    setAccountMessage("");
  };

  const renameProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!renamingProfileId) {
      return;
    }

    setAccountMessage("");

    try {
      const response = await fetch(`/api/account/profiles/${renamingProfileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: profileTitle }),
      });
      const body = await response.json() as { ok?: boolean; profile?: { id: string; title: string }; error?: string };

      if (!response.ok || !body.ok || !body.profile) {
        throw new Error(body.error ?? "Unable to rename profile.");
      }

      setProfiles((current) => current.map((profile) => (
        profile.id === body.profile?.id ? { ...profile, title: body.profile.title } : profile
      )));
      setRenamingProfileId(null);
      setProfileTitle("");
      setAccountMessage("Profile renamed.");
    } catch (renameError) {
      setAccountMessage(renameError instanceof Error ? renameError.message : "Unable to rename profile.");
    }
  };

  const deleteProfile = async (profileId: string) => {
    setDeletingProfileId(profileId);
    setAccountMessage("");

    try {
      const response = await fetch(`/api/account/profiles/${profileId}`, { method: "DELETE" });
      const body = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Unable to delete profile.");
      }

      setProfiles((current) => current.filter((profile) => profile.id !== profileId));
      setAccountMessage("Profile deleted.");
    } catch (deleteError) {
      setAccountMessage(deleteError instanceof Error ? deleteError.message : "Unable to delete profile.");
    } finally {
      setDeletingProfileId(null);
    }
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
            <form className="account-form account-settings" onSubmit={updateAccount}>
              <label>
                <span>Display name</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
              </label>
              {accountMessage && <small>{accountMessage}</small>}
              <button className="button primary" disabled={accountUpdating}>
                {accountUpdating ? "Saving..." : "Save account"}
              </button>
            </form>
            <form className="account-form account-settings" onSubmit={updatePassword}>
              <div className="account-form-heading"><KeyRound size={16} /> Change password</div>
              <label>
                <span>Current password</span>
                <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
              </label>
              <label>
                <span>New password</span>
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
              </label>
              <button className="button secondary" disabled={passwordUpdating}>
                {passwordUpdating ? "Updating..." : "Update password"}
              </button>
            </form>
            <form className="account-form account-settings danger-zone" onSubmit={deleteAccount}>
              <label>
                <span>Delete account password confirmation</span>
                <input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} autoComplete="current-password" />
              </label>
              <button className="button secondary" disabled={accountDeleting}>
                {accountDeleting ? "Deleting..." : "Delete account"}
              </button>
            </form>
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
                    {renamingProfileId === profile.id ? (
                      <form className="profile-rename" onSubmit={renameProfile}>
                        <input value={profileTitle} onChange={(event) => setProfileTitle(event.target.value)} autoFocus />
                        <div>
                          <button type="button" onClick={() => setRenamingProfileId(null)}>Cancel</button>
                          <button>Save</button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <strong>{profile.title}</strong>
                        <small>{new Date(profile.createdAt).toLocaleDateString()} · {profile.mode} · {profile.answeredCount} answered</small>
                      </div>
                    )}
                    <span>{profile.confidence}%</span>
                    <button
                      className="icon-button"
                      onClick={() => startRenamingProfile(profile)}
                      disabled={renamingProfileId === profile.id}
                      aria-label={`Rename ${profile.title}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => deleteProfile(profile.id)}
                      disabled={deletingProfileId === profile.id}
                      aria-label={`Delete ${profile.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
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
