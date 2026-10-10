// Helper fetch API dengan error handling
export async function api(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
  return data;
}

export const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

// Escape HTML lalu terapkan markdown sederhana + mention + autolink
export function formatContent(text, myUsername) {
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]+?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  html = html.replace(/~~([^~\n]+)~~/g, "<s>$1</s>");
  html = html.replace(/@(\w+)/g, (m, name) => {
    const cls = name === myUsername ? "mention mention-me" : "mention";
    return `<span class="${cls}">@${name}</span>`;
  });
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>',
  );
  return html;
}

// Deteksi link YouTube/gambar untuk preview
export function extractPreviews(text) {
  if (!text) return [];
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  const previews = [];
  for (const url of urls.slice(0, 2)) {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    if (yt) previews.push({ type: "youtube", id: yt[1] });
    else if (/\.(png|jpe?g|gif|webp)(\?|$)/i.test(url)) previews.push({ type: "image", url });
  }
  return previews;
}

export function timeStr(createdAt) {
  return new Date(createdAt + "Z").toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
