import { IconHash, IconMegaphone, IconSpeaker, IconPlus, IconLink, IconLogout, IconLeave, IconTrash } from "./Icons.jsx";
import { api } from "../utils";

const CH_ICON = { text: IconHash, announce: IconMegaphone, voice: IconSpeaker };

export default function BranchSidebar({ me, branch, activeChannel, unreadChannel, onSelectChannel, onShowInvite, onCreateChannel, onLeave, onDelete, onLogout }) {
  const isStaff = branch.myRole === "owner" || branch.myRole === "admin";

  async function deleteChannel(ch, e) {
    e.preventDefault();
    if (!isStaff) return;
    if (confirm(`Hapus channel #${ch.name}? Semua pesannya ikut terhapus.`)) {
      try { await api("/api/channels/" + ch.id, "DELETE"); }
      catch (err) { alert(err.message); }
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{branch.name}</span>
        <div className="sidebar-header-actions">
          <button onClick={onShowInvite} title="Link undangan"><IconLink size={15} /></button>
          {branch.myRole === "owner"
            ? <button onClick={onDelete} title="Hapus branch" className="danger"><IconTrash size={15} /></button>
            : <button onClick={onLeave} title="Keluar dari branch" className="danger"><IconLeave size={15} /></button>}
        </div>
      </div>

      <div className="section-title">
        CHANNEL
        {isStaff && <button onClick={onCreateChannel} title="Buat channel"><IconPlus size={15} /></button>}
      </div>
      <ul className="list">
        {branch.channels.map((ch) => {
          const Icon = CH_ICON[ch.type] || IconHash;
          const isVoice = ch.type === "voice";
          return (
            <li
              key={ch.id}
              className={(activeChannel?.id === ch.id ? "active" : "") + (isVoice ? " voice-disabled" : "")}
              onClick={() => !isVoice && onSelectChannel(ch)}
              onContextMenu={(e) => deleteChannel(ch, e)}
              title={isVoice ? "Voice channel segera hadir" : ch.name}
            >
              <Icon size={14} />
              <span className="ch-name">{ch.name}</span>
              {isVoice && <span className="soon-tag">SOON</span>}
              {unreadChannel[ch.id] > 0 && <span className="badge">{unreadChannel[ch.id]}</span>}
            </li>
          );
        })}
      </ul>

      <div className="me-bar">
        <span className="online-dot" />
        <span className="me-name">{me.username}</span>
        <span className="role-badge">{branch.myRole.toUpperCase()}</span>
        <button onClick={onLogout} title="Keluar akun"><IconLogout size={15} /></button>
      </div>
    </aside>
  );
}
