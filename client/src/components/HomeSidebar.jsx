import { IconLogout } from "./Icons.jsx";

// Sidebar saat di "Beranda": daftar teman untuk DM
export default function HomeSidebar({
  me,
  friends,
  onlineIds,
  activeDM,
  unreadDM,
  onSelectDM,
  onLogout,
}) {
  const accepted = friends.filter((f) => f.status === "accepted");
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Beranda</span>
      </div>
      <div className="section-title">DIRECT MESSAGE</div>
      <ul className="list">
        {accepted.length === 0 && (
          <li className="muted-item">
            Belum ada teman.
            <br />
            Tambahkan lewat tab Teman →
          </li>
        )}
        {accepted.map((f) => (
          <li
            key={f.userId}
            className={activeDM?.userId === f.userId ? "active" : ""}
            onClick={() => onSelectDM(f)}
          >
            <span className={onlineIds.includes(f.userId) ? "online-dot" : "offline-dot"} />
            <span className="ch-name">{f.username}</span>
            {unreadDM[f.userId] > 0 && <span className="badge">{unreadDM[f.userId]}</span>}
          </li>
        ))}
      </ul>
      <div className="me-bar">
        <span className="online-dot" />
        <span className="me-name">{me.username}</span>
        <button onClick={onLogout} title="Keluar akun">
          <IconLogout size={15} />
        </button>
      </div>
    </aside>
  );
}
