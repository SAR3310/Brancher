import { useState } from "react";
import { api } from "../utils";
import { IconCheck, IconClose } from "./Icons.jsx";

// Tampilan utama saat di Beranda: kelola teman
export default function FriendsView({ friends, onlineIds, refresh, onOpenDM }) {
  const [tab, setTab] = useState("all"); // all | pending | add
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState(null); // {ok, text}

  const accepted = friends.filter((f) => f.status === "accepted");
  const pending = friends.filter((f) => f.status === "pending");

  async function sendRequest(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await api("/api/friends/request", "POST", { username: username.trim() });
      setMsg({ ok: true, text: "Permintaan terkirim ke " + username });
      setUsername("");
      refresh();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  async function accept(f) {
    await api(`/api/friends/${f.friendshipId}/accept`, "POST", {});
    refresh();
  }
  async function remove(f) {
    await api(`/api/friends/${f.friendshipId}`, "DELETE");
    refresh();
  }

  return (
    <div className="friends-view">
      <header className="chat-header">
        <span className="chat-title">Teman</span>
        <div className="tabs">
          <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
            Semua ({accepted.length})
          </button>
          <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
            Tertunda ({pending.length})
            {pending.some((f) => f.incoming) && <span className="dot-alert" />}
          </button>
          <button
            className={"add-btn " + (tab === "add" ? "active" : "")}
            onClick={() => setTab("add")}
          >
            Tambah Teman
          </button>
        </div>
      </header>

      <div className="friends-body">
        {tab === "add" && (
          <form className="add-friend" onSubmit={sendRequest}>
            <p>Masukkan username teman yang ingin kamu tambahkan.</p>
            <div className="add-row">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
              <button type="submit" disabled={!username.trim()}>
                Kirim Permintaan
              </button>
            </div>
            {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
          </form>
        )}

        {tab === "all" && (
          <ul className="friend-rows">
            {accepted.length === 0 && (
              <p className="panel-empty">Belum ada teman. Klik "Tambah Teman" untuk memulai.</p>
            )}
            {accepted.map((f) => (
              <li key={f.friendshipId}>
                <span className={onlineIds.includes(f.userId) ? "online-dot" : "offline-dot"} />
                <span className="friend-name" onClick={() => onOpenDM(f)}>
                  {f.username}
                </span>
                <div className="friend-actions">
                  <button onClick={() => onOpenDM(f)}>Kirim DM</button>
                  <button
                    className="danger"
                    onClick={() => confirm(`Hapus ${f.username} dari teman?`) && remove(f)}
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "pending" && (
          <ul className="friend-rows">
            {pending.length === 0 && <p className="panel-empty">Tidak ada permintaan tertunda.</p>}
            {pending.map((f) => (
              <li key={f.friendshipId}>
                <span className="offline-dot" />
                <span className="friend-name">{f.username}</span>
                <span className="pending-label">
                  {f.incoming ? "Permintaan masuk" : "Menunggu persetujuan"}
                </span>
                <div className="friend-actions">
                  {f.incoming && (
                    <button className="ok" onClick={() => accept(f)} title="Terima">
                      <IconCheck size={15} />
                    </button>
                  )}
                  <button
                    className="danger"
                    onClick={() => remove(f)}
                    title={f.incoming ? "Tolak" : "Batalkan"}
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
