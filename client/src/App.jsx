import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { api } from "./utils";
import AuthScreen from "./components/AuthScreen.jsx";
import BranchRail from "./components/BranchRail.jsx";
import BranchSidebar from "./components/BranchSidebar.jsx";
import HomeSidebar from "./components/HomeSidebar.jsx";
import ChatView from "./components/ChatView.jsx";
import MemberList from "./components/MemberList.jsx";
import FriendsView from "./components/FriendsView.jsx";
import Modal from "./components/Modal.jsx";

export default function App() {
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [socket, setSocket] = useState(null);

  // Navigasi: view "home" (teman/DM) atau sebuah branch
  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(null); // null = home
  const [branchDetail, setBranchDetail] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeDM, setActiveDM] = useState(null); // {userId, username}

  const [friends, setFriends] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [unread, setUnread] = useState({ channel: {}, dm: {}, branch: {} });
  const [modal, setModal] = useState(null); // {type: "createBranch"|"joinBranch"|"invite"|...}

  // Ref agar handler socket selalu tahu obrolan yang aktif
  const activeRef = useRef({});
  activeRef.current = { activeChannel, activeDM, activeBranchId };

  // ---------- cek sesi login ----------
  useEffect(() => {
    api("/api/me").then(setMe).catch(() => {}).finally(() => setChecking(false));
  }, []);

  // ---------- koneksi socket setelah login ----------
  useEffect(() => {
    if (!me) return;
    const s = io();
    setSocket(s);

    s.on("presence", setOnlineIds);
    s.on("friends:changed", () => refreshFriends());
    s.on("activity", ({ type, id, branchId, from, mentions }) => {
      if (from === me.id) return;
      const a = activeRef.current;
      const viewing =
        (type === "channel" && a.activeChannel?.id === id) ||
        (type === "dm" && a.activeDM?.userId === id);
      if (!viewing) {
        setUnread((u) => {
          const next = { ...u, [type]: { ...u[type], [id]: (u[type][id] || 0) + 1 } };
          if (type === "channel" && branchId && a.activeBranchId !== branchId) {
            next.branch = { ...u.branch, [branchId]: (u.branch[branchId] || 0) + 1 };
          }
          return next;
        });
      }
      if (mentions?.includes(me.id) && Notification?.permission === "granted" && document.hidden) {
        new Notification("Brancher", { body: "Kamu disebut di chat!" });
      }
    });
    s.on("branch:deleted", ({ id }) => {
      setBranches((bs) => bs.filter((b) => b.id !== id));
      if (activeRef.current.activeBranchId === id) goHome();
    });

    if (Notification && Notification.permission === "default") Notification.requestPermission();
    refreshBranches();
    refreshFriends();

    // Kalau dibuka lewat link undangan (/invite/kode), buka dialog join
    const inviteMatch = location.pathname.match(/^\/invite\/([\w-]+)/);
    if (inviteMatch) {
      setModal({ type: "joinBranch", code: inviteMatch[1] });
      history.replaceState(null, "", "/");
    }

    return () => s.disconnect();
  }, [me]);

  const refreshBranches = useCallback(() => {
    api("/api/branches").then(setBranches).catch(() => {});
  }, []);
  const refreshFriends = useCallback(() => {
    api("/api/friends").then(setFriends).catch(() => {});
  }, []);

  // ---------- navigasi ----------
  const goHome = useCallback(() => {
    setActiveBranchId(null);
    setBranchDetail(null);
    setActiveChannel(null);
    setActiveDM(null);
  }, []);

  const openBranch = useCallback(async (branchId) => {
    const detail = await api("/api/branches/" + branchId);
    setActiveBranchId(branchId);
    setBranchDetail(detail);
    setActiveDM(null);
    setUnread((u) => ({ ...u, branch: { ...u.branch, [branchId]: 0 } }));
    const firstText = detail.channels.find((c) => c.type !== "voice");
    setActiveChannel(firstText || null);
  }, []);

  const openChannel = useCallback((ch) => {
    setActiveChannel(ch);
    setActiveDM(null);
    setUnread((u) => ({ ...u, channel: { ...u.channel, [ch.id]: 0 } }));
  }, []);

  const openDM = useCallback((friend) => {
    setActiveDM({ userId: friend.userId, username: friend.username });
    setActiveChannel(null);
    setUnread((u) => ({ ...u, dm: { ...u.dm, [friend.userId]: 0 } }));
  }, []);

  const refreshBranchDetail = useCallback(async () => {
    if (!activeBranchId) return;
    const detail = await api("/api/branches/" + activeBranchId);
    setBranchDetail(detail);
    // channel aktif mungkin sudah dihapus
    if (activeChannel && !detail.channels.find((c) => c.id === activeChannel.id)) {
      setActiveChannel(detail.channels.find((c) => c.type !== "voice") || null);
    }
  }, [activeBranchId, activeChannel]);

  // event perubahan struktur branch dari server
  useEffect(() => {
    if (!socket) return;
    const h = () => refreshBranchDetail();
    socket.on("channel:new", h);
    socket.on("channel:deleted", h);
    socket.on("branch:members-changed", h);
    return () => {
      socket.off("channel:new", h);
      socket.off("channel:deleted", h);
      socket.off("branch:members-changed", h);
    };
  }, [socket, refreshBranchDetail]);

  // ---------- render ----------
  if (checking) return <div className="loading-screen">Memuat...</div>;
  if (!me) return <AuthScreen onLogin={setMe} />;

  return (
    <div className="app">
      <BranchRail
        branches={branches}
        activeBranchId={activeBranchId}
        unreadBranch={unread.branch}
        onHome={goHome}
        onSelect={openBranch}
        onCreate={() => setModal({ type: "createBranch" })}
        onJoin={() => setModal({ type: "joinBranch" })}
      />

      {activeBranchId && branchDetail ? (
        <BranchSidebar
          me={me}
          branch={branchDetail}
          activeChannel={activeChannel}
          unreadChannel={unread.channel}
          onSelectChannel={openChannel}
          onShowInvite={() => setModal({ type: "invite", branch: branchDetail })}
          onCreateChannel={() => setModal({ type: "createChannel", branch: branchDetail })}
          onLeave={async () => {
            if (!confirm("Keluar dari branch ini?")) return;
            try { await api(`/api/branches/${activeBranchId}/leave`, "POST", {}); refreshBranches(); goHome(); }
            catch (e) { alert(e.message); }
          }}
          onDelete={async () => {
            if (!confirm(`HAPUS branch "${branchDetail.name}" beserta seluruh isinya?`)) return;
            try { await api("/api/branches/" + activeBranchId, "DELETE"); refreshBranches(); goHome(); }
            catch (e) { alert(e.message); }
          }}
          onLogout={async () => { await api("/api/logout", "POST", {}); location.reload(); }}
        />
      ) : (
        <HomeSidebar
          me={me}
          friends={friends}
          onlineIds={onlineIds}
          activeDM={activeDM}
          unreadDM={unread.dm}
          onSelectDM={openDM}
          onLogout={async () => { await api("/api/logout", "POST", {}); location.reload(); }}
        />
      )}

      <main className="main-area">
        {activeChannel && socket ? (
          <ChatView
            key={"ch-" + activeChannel.id}
            me={me}
            socket={socket}
            target={{ type: "channel", channel: activeChannel, branch: branchDetail }}
          />
        ) : activeDM && socket ? (
          <ChatView
            key={"dm-" + activeDM.userId}
            me={me}
            socket={socket}
            target={{ type: "dm", dm: activeDM }}
          />
        ) : !activeBranchId ? (
          <FriendsView friends={friends} onlineIds={onlineIds} refresh={refreshFriends} onOpenDM={openDM} />
        ) : (
          <div className="empty-state">Pilih channel untuk mulai mengobrol</div>
        )}
      </main>

      {activeBranchId && branchDetail && (
        <MemberList
          me={me}
          branch={branchDetail}
          onlineIds={onlineIds}
          onChanged={refreshBranchDetail}
        />
      )}

      {modal && (
        <Modal
          modal={modal}
          onClose={() => setModal(null)}
          onBranchCreated={(b) => { refreshBranches(); setModal(null); openBranch(b.id); }}
          onBranchJoined={(b) => { refreshBranches(); setModal(null); openBranch(b.id); socket?.emit("branch:subscribe", b.id); }}
          onChannelCreated={() => { setModal(null); refreshBranchDetail(); }}
        />
      )}
    </div>
  );
}
