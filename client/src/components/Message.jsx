import { formatContent, extractPreviews, timeStr } from "../utils";
import { IconSmile, IconReply, IconEdit, IconTrash, IconPin, IconAttach } from "./Icons.jsx";

// Satu bubble pesan dengan toolbar aksi, reaksi, reply quote, link preview
export default function Message({
  msg,
  me,
  canModerate,
  canPin,
  readOnlyView,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onOpenPicker,
}) {
  const mine = msg.user_id === me.id;
  const previews = extractPreviews(msg.content);

  return (
    <div className={"msg" + (msg.pinned ? " pinned-msg" : "")}>
      {msg.reply_to &&
        (msg.reply_username ? (
          <div className="reply-quote">
            ↪ <b>{msg.reply_username}</b>: {(msg.reply_content || "[file]").slice(0, 60)}
          </div>
        ) : (
          <div className="reply-quote reply-deleted">↪ Pesan asal sudah dihapus</div>
        ))}

      <div className="meta">
        {msg.pinned === 1 && <IconPin size={12} />}
        <span className="author">{msg.username}</span>
        <span className="time">{timeStr(msg.created_at)}</span>
        {msg.edited === 1 && <span className="edited-tag">(diedit)</span>}
      </div>

      <div className="content">
        {msg.content && (
          <span dangerouslySetInnerHTML={{ __html: formatContent(msg.content, me.username) }} />
        )}
        {msg.file_url &&
          (/\.(png|jpe?g|gif|webp)$/i.test(msg.file_url) ? (
            <img className="attachment" src={msg.file_url} alt="gambar" />
          ) : (
            <a className="file-link" href={msg.file_url} target="_blank" rel="noopener noreferrer">
              <IconAttach size={13} /> {msg.file_name || "file"}
            </a>
          ))}
        {previews.map((p, i) =>
          p.type === "youtube" ? (
            <iframe
              key={i}
              className="yt-embed"
              src={`https://www.youtube.com/embed/${p.id}`}
              allowFullScreen
            />
          ) : (
            <img key={i} className="attachment" src={p.url} alt="preview" loading="lazy" />
          ),
        )}
      </div>

      {Object.keys(msg.reactions || {}).length > 0 && (
        <div className="reactions">
          {Object.entries(msg.reactions).map(([emoji, userIds]) => (
            <button
              key={emoji}
              className={"react-chip" + (userIds.includes(me.id) ? " my-react" : "")}
              onClick={() => !readOnlyView && onReact(emoji)}
            >
              {emoji} {userIds.length}
            </button>
          ))}
        </div>
      )}

      {!readOnlyView && (
        <div className="msg-actions">
          <button
            title="Reaksi"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onOpenPicker(Math.min(r.left, window.innerWidth - 280), Math.max(8, r.top - 48));
            }}
          >
            <IconSmile size={15} />
          </button>
          <button title="Balas" onClick={onReply}>
            <IconReply size={15} />
          </button>
          {mine && (
            <button title="Edit" onClick={onEdit}>
              <IconEdit size={15} />
            </button>
          )}
          {(mine || canModerate) && (
            <button title="Hapus" onClick={onDelete}>
              <IconTrash size={15} />
            </button>
          )}
          {canPin && (
            <button title={msg.pinned ? "Lepas pin" : "Pin"} onClick={onPin}>
              <IconPin size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
