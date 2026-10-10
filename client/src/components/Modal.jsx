import { useState } from "react";
import { api } from "../utils";
import { IconClose } from "./Icons.jsx";

// Modal serbaguna: buat branch, join via kode, tampilkan invite, buat channel
export default function Modal({ modal, onClose, onBranchCreated, onBranchJoined, onChannelCreated }) {
  const [form, setForm] = useState({ name: "", description: "", code: modal.code || "", chName: "", chType: "text" });
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // preview info undangan
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function createBranch(e) {
    e.preventDefault();
    try { onBranchCreated(await api("/api/branches", "POST", { name: form.name, description: form.description })); }
    catch (err) { setError(err.message); }
  }

  // Kode bisa berupa kode saja atau link lengkap — ambil bagian akhirnya
  function parseCode(v) {
    return v.trim().split("/").filter(Boolean).pop() || "";
  }

  async function checkInvite(e) {
    e.preventDefault();
    setError("");
    try { setPreview(await api("/api/invite/" + parseCode(form.code))); }
    catch (err) { setError(err.message); }
  }

  async function joinBranch() {
    try { onBranchJoined(await api(`/api/invite/${parseCode(form.code)}/join`, "POST", {})); }
    catch (err) { setError(err.message); }
  }

  async function createChannel(e) {
    e.preventDefault();
    try {
      await api(`/api/branches/${modal.branch.id}/channels`, "POST", { name: form.chName, type: form.chType });
      onChannelCreated();
    } catch (err) { setError(err.message); }
  }

  const inviteLink = modal.type === "invite"
    ? `${location.origin}/invite/${modal.branch.invite_code}`
    : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><IconClose size={15} /></button>

        {modal.type === "createBranch" && (
          <form onSubmit={createBranch}>
            <h2>Buat Branch Baru</h2>
            <p className="modal-sub">Branch adalah rumah untuk komunitasmu.</p>
            <input placeholder="Nama branch (mis. Cynera KG2)" value={form.name} onChange={set("name")} autoFocus />
            <textarea placeholder="Deskripsi singkat (opsional)" value={form.description} onChange={set("description")} rows={2} />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={form.name.trim().length < 2}>Buat Branch</button>
          </form>
        )}

        {modal.type === "joinBranch" && (
          <form onSubmit={checkInvite}>
            <h2>Gabung Branch</h2>
            <p className="modal-sub">Tempelkan link atau kode undangan.</p>
            <input placeholder="https://.../invite/xK9mP2ab atau xK9mP2ab" value={form.code} onChange={set("code")} autoFocus />
            {error && <p className="error">{error}</p>}
            {!preview ? (
              <button type="submit" disabled={!form.code.trim()}>Cek Undangan</button>
            ) : (
              <div className="invite-preview">
                <h3>{preview.name}</h3>
                {preview.description && <p>{preview.description}</p>}
                <p className="muted">{preview.members} anggota</p>
                {preview.joined
                  ? <p className="success">Kamu sudah bergabung di branch ini.</p>
                  : <button type="button" onClick={joinBranch}>Gabung Sekarang</button>}
              </div>
            )}
          </form>
        )}

        {modal.type === "invite" && (
          <div>
            <h2>Undang Teman</h2>
            <p className="modal-sub">Bagikan link ini agar orang lain bisa bergabung ke <b>{modal.branch.name}</b>.</p>
            <div className="invite-link-row">
              <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
              <button onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}>{copied ? "Tersalin!" : "Salin"}</button>
            </div>
          </div>
        )}

        {modal.type === "createChannel" && (
          <form onSubmit={createChannel}>
            <h2>Buat Channel</h2>
            <input placeholder="nama-channel" value={form.chName} onChange={set("chName")} autoFocus />
            <div className="type-options">
              {[
                ["text", "Text", "Obrolan biasa untuk semua anggota"],
                ["announce", "Announce", "Hanya admin yang bisa mengirim"],
                ["voice", "Voice", "Obrolan suara (segera hadir)"],
              ].map(([val, label, desc]) => (
                <label key={val} className={"type-option" + (form.chType === val ? " selected" : "")}>
                  <input type="radio" name="chType" value={val} checked={form.chType === val}
                    onChange={() => setForm((f) => ({ ...f, chType: val }))} />
                  <span><b>{label}</b><small>{desc}</small></span>
                </label>
              ))}
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={!form.chName.trim()}>Buat Channel</button>
          </form>
        )}
      </div>
    </div>
  );
}
