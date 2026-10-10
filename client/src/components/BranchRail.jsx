import { IconPlus, IconLink } from "./Icons.jsx";

// Kolom paling kiri: daftar ikon Branch (seperti server rail Discord)
export default function BranchRail({
  branches,
  activeBranchId,
  unreadBranch,
  onHome,
  onSelect,
  onCreate,
  onJoin,
}) {
  return (
    <nav className="branch-rail">
      <button
        className={"rail-item home" + (activeBranchId === null ? " active" : "")}
        onClick={onHome}
        title="Beranda (Teman & DM)"
      >
        ⌥
      </button>
      <div className="rail-divider" />
      {branches.map((b) => (
        <button
          key={b.id}
          className={"rail-item" + (activeBranchId === b.id ? " active" : "")}
          onClick={() => onSelect(b.id)}
          title={b.name}
        >
          {b.name.slice(0, 2).toUpperCase()}
          {unreadBranch[b.id] > 0 && (
            <span className="rail-badge">{unreadBranch[b.id] > 9 ? "9+" : unreadBranch[b.id]}</span>
          )}
        </button>
      ))}
      <button className="rail-item action" onClick={onCreate} title="Buat Branch baru">
        <IconPlus size={20} />
      </button>
      <button className="rail-item action" onClick={onJoin} title="Gabung via link undangan">
        <IconLink size={20} />
      </button>
    </nav>
  );
}
