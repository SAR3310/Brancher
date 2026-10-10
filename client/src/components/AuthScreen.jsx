import { useState } from "react";
import { api } from "../utils";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ identifier: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user =
        mode === "login"
          ? await api("/api/login", "POST", { identifier: form.identifier, password: form.password })
          : await api("/api/register", "POST", { username: form.username, email: form.email, password: form.password });
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider) {
    try { await api("/api/auth/" + provider); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="auth-screen">
      <form className="auth-box" onSubmit={submit}>
        <div className="brand">
          <span className="brand-logo">⌥</span>
          <h1>Brancher</h1>
        </div>
        <p className="subtitle">
          {mode === "login" ? "Selamat datang kembali!" : "Buat akun barumu"}
        </p>

        {mode === "login" ? (
          <input placeholder="Email atau username" value={form.identifier} onChange={set("identifier")} autoFocus />
        ) : (
          <>
            <input placeholder="Username" value={form.username} onChange={set("username")} autoFocus />
            <input type="email" placeholder="Email" value={form.email} onChange={set("email")} />
          </>
        )}
        <input type="password" placeholder="Password" value={form.password} onChange={set("password")} />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? "..." : mode === "login" ? "Masuk" : "Daftar"}
        </button>

        <div className="oauth-row">
          <button type="button" className="oauth-btn" onClick={() => oauth("google")}>Google</button>
          <button type="button" className="oauth-btn" onClick={() => oauth("github")}>GitHub</button>
        </div>

        <p className="switch-mode">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <a onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Daftar" : "Masuk"}
          </a>
        </p>
      </form>
    </div>
  );
}
