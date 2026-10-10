import { api } from "../utils";

// Kolom kanan: daftar anggota branch
export default function MemberList({ me, branch, onlineIds, onChanged }) {
  const isOwner = branch.myRole === "owner";

  async function toggleRole(m, e) {
    e.preventDefault();
    if (!isOwner || m.id === me.id || m.role === "owner") return;
    const newRole = m.role === "admin" ? "member" : "admin";
    if (confirm(`Jadikan ${m.username} sebagai ${newRole}?`)) {
      try {
        await api(`/api/branches/${branch.id}/members/${m.id}/role`, "POST", { role: newRole });
        onChanged();
      } catch (err) {
        alert(err.message);
      }
    }
  }

  const online = branch.members.filter((m) => onlineIds.includes(m.id));
  const offline = branch.members.filter((m) => !onlineIds.includes(m.id));

  const row = (m) => (
    <li
      key={m.id}
      onContextMenu={(e) => toggleRole(m, e)}
      title={isOwner && m.id !== me.id && m.role !== "owner" ? "Klik kanan: ubah role" : ""}
    >
      <span className={onlineIds.includes(m.id) ? "online-dot" : "offline-dot"} />
      <span className="ch-name">{m.username}</span>
      {m.role !== "member" && (
        <span className={"role-badge " + m.role}>{m.role.toUpperCase()}</span>
      )}
    </li>
  );

  return (
    <aside className="member-list">
      <div className="section-title">ONLINE — {online.length}</div>
      <ul className="list">{online.map(row)}</ul>
      <div className="section-title">OFFLINE — {offline.length}</div>
      <ul className="list offline-names">{offline.map(row)}</ul>
    </aside>
  );
}
