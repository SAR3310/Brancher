import { useState, useEffect, useRef, useCallback } from "react";
import { api, EMOJIS } from "../utils";
import Message from "./Message.jsx";
import { IconPin, IconAttach, IconSend, IconClose, IconHash, IconMegaphone } from "./Icons.jsx";

// Tampilan chat untuk channel maupun DM.
// target = {type:"channel", channel, branch} | {type:"dm", dm:{userId,username}}
export default function ChatView({ me, socket, target }) {
  const isChannel = target.type === "channel";
  const channel = target.channel;
  const isStaff =
    isChannel && (target.branch.myRole === "owner" || target.branch.myRole === "admin");
  const readOnly = isChannel && channel.type === "announce" && !isStaff;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUser, setTypingUser] = useState("");
  const [panel, setPanel] = useState(null); // {title, messages}
  const [search, setSearch] = useState("");
  const [picker, setPicker] = useState(null); // {messageId, x, y}

  const boxRef = useRef(null);
  const oldestRef = useRef(null);
  const loadingRef = useRef(false);
  const typingTimer = useRef(null);

  const baseUrl = isChannel
    ? "/api/messages/channel/" + channel.id
    : "/api/messages/dm/" + target.dm.userId;

  // ---------- muat riwayat & join room ----------
  useEffect(() => {
    if (isChannel) socket.emit("channel:join", channel.id);
    api(baseUrl)
      .then((msgs) => {
        setMessages(msgs);
        oldestRef.current = msgs.length ? msgs[0].id : null;
        requestAnimationFrame(scrollBottom);
      })
      .catch((e) => alert(e.message));
  }, []);

  // ---------- event socket ----------
  useEffect(() => {
    const onNew = (msg) => {
      const mine =
        (isChannel && msg.channel_id === channel.id) ||
        (!isChannel &&
          msg.dm_key &&
          msg.dm_key.split("-").map(Number).includes(target.dm.userId) &&
          (msg.user_id === target.dm.userId || msg.user_id === me.id));
      if (!mine) return;
      setMessages((ms) => [...ms, msg]);
      requestAnimationFrame(scrollBottom);
    };
    const onUpdated = (msg) => setMessages((ms) => ms.map((m) => (m.id === msg.id ? msg : m)));
    const onDeleted = ({ id }) => setMessages((ms) => ms.filter((m) => m.id !== id));
    const onTyping = ({ username }) => {
      setTypingUser(username);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(""), 2000);
    };
    socket.on(isChannel ? "message:channel" : "message:dm", onNew);
    socket.on("message:updated", onUpdated);
    socket.on("message:deleted", onDeleted);
    socket.on("typing", onTyping);
    return () => {
      socket.off(isChannel ? "message:channel" : "message:dm", onNew);
      socket.off("message:updated", onUpdated);
      socket.off("message:deleted", onDeleted);
      socket.off("typing", onTyping);
    };
  }, [socket]);

  function scrollBottom() {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ---------- infinite scroll ----------
  const onScroll = useCallback(async () => {
    const el = boxRef.current;
    if (!el || el.scrollTop > 50 || loadingRef.current || !oldestRef.current) return;
    loadingRef.current = true;
    const older = await api(baseUrl + "?before=" + oldestRef.current).catch(() => []);
    if (older.length) {
      oldestRef.current = older[0].id;
      const prevHeight = el.scrollHeight;
      setMessages((ms) => [...older, ...ms]);
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    } else {
      oldestRef.current = null;
    }
    loadingRef.current = false;
  }, [baseUrl]);

  // ---------- kirim ----------
  function send(content, fileUrl, fileName) {
    const payload = { content, fileUrl, fileName, replyTo: replyingTo?.id || null };
    if (isChannel) socket.emit("message:channel", { channelId: channel.id, ...payload });
    else socket.emit("message:dm", { toUserId: target.dm.userId, ...payload });
    setReplyingTo(null);
  }

  function submit() {
    const text = input.trim();
    if (!text) return;
    send(text, null, null);
    setInput("");
  }

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) send(null, data.url, data.name);
    else alert(data.error || "Upload gagal");
    e.target.value = "";
  }

  // ---------- panel pencarian & pin ----------
  async function doSearch(e) {
    if (e.key !== "Enter" || !search.trim() || !isChannel) return;
    const results = await api(`/api/search?q=${encodeURIComponent(search)}&channel=${channel.id}`);
    setPanel({ title: `Hasil pencarian "${search}"`, messages: results });
  }
  async function showPins() {
    if (!isChannel) return;
    const pins = await api("/api/messages/pinned/" + channel.id);
    setPanel({ title: "Pesan dipin di #" + channel.name, messages: pins });
  }

  const HeaderIcon = isChannel ? (channel.type === "announce" ? IconMegaphone : IconHash) : null;

  return (
    <div className="chat">
      <header className="chat-header">
        <span className="chat-title">
          {HeaderIcon && <HeaderIcon size={16} />}
          {isChannel ? channel.name : "@ " + target.dm.username}
        </span>
        {isChannel && (
          <div className="header-actions">
            <button onClick={showPins} title="Pesan yang dipin">
              <IconPin size={16} />
            </button>
            <input
              placeholder="Cari pesan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={doSearch}
            />
          </div>
        )}
      </header>

      {panel && (
        <div className="panel">
          <div className="panel-header">
            <span>{panel.title}</span>
            <button onClick={() => setPanel(null)}>
              <IconClose size={14} />
            </button>
          </div>
          <div className="panel-body">
            {panel.messages.length === 0 && <p className="panel-empty">Tidak ada hasil.</p>}
            {panel.messages.map((m) => (
              <Message key={m.id} msg={m} me={me} readOnlyView />
            ))}
          </div>
        </div>
      )}

      <div className="messages" ref={boxRef} onScroll={onScroll}>
        {messages.map((m) => (
          <Message
            key={m.id}
            msg={m}
            me={me}
            canModerate={isStaff}
            canPin={isStaff && isChannel}
            onReply={() => setReplyingTo(m)}
            onEdit={() => {
              const c = prompt("Edit pesan:", m.content || "");
              if (c && c !== m.content)
                socket.emit("message:edit", { messageId: m.id, content: c });
            }}
            onDelete={() => {
              if (confirm("Hapus pesan ini?")) socket.emit("message:delete", { messageId: m.id });
            }}
            onPin={() => socket.emit("message:pin", { messageId: m.id })}
            onReact={(emoji) => socket.emit("message:react", { messageId: m.id, emoji })}
            onOpenPicker={(x, y) => setPicker({ messageId: m.id, x, y })}
          />
        ))}
      </div>

      <div className="typing">{typingUser && `${typingUser} sedang mengetik...`}</div>

      {replyingTo && (
        <div className="reply-bar">
          <span>
            Membalas <b>{replyingTo.username}</b>: {(replyingTo.content || "[file]").slice(0, 50)}
          </span>
          <button onClick={() => setReplyingTo(null)}>
            <IconClose size={13} />
          </button>
        </div>
      )}

      {readOnly ? (
        <div className="composer readonly">
          Hanya admin branch yang dapat mengirim di channel pengumuman
        </div>
      ) : (
        <div className="composer">
          <label className="attach" title="Kirim file/gambar">
            <IconAttach size={18} />
            <input type="file" hidden onChange={uploadFile} />
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              else if (e.key === "Escape") setReplyingTo(null);
              else if (isChannel) socket.emit("typing", { channelId: channel.id });
            }}
            placeholder={`Kirim pesan... (**tebal** *miring* \`kode\` @nama)`}
          />
          <button onClick={submit} title="Kirim">
            <IconSend size={18} />
          </button>
        </div>
      )}

      {picker && (
        <>
          <div className="picker-overlay" onClick={() => setPicker(null)} />
          <div className="emoji-picker" style={{ top: picker.y, left: picker.x }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  socket.emit("message:react", { messageId: picker.messageId, emoji: e });
                  setPicker(null);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
