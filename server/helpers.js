// ============================================================
// Brancher - Helper bersama (query pesan, permission, dll)
// ============================================================
const { db } = require("./db");

const MSG_SELECT = `
  SELECT m.*, u.username,
    r.content AS reply_content, ru.username AS reply_username
  FROM messages m
  JOIN users u ON u.id = m.user_id
  LEFT JOIN messages r ON r.id = m.reply_to
  LEFT JOIN users ru ON ru.id = r.user_id
`;

function attachReactions(msgs) {
  const stmt = db.prepare("SELECT emoji, user_id FROM reactions WHERE message_id = ?");
  for (const m of msgs) {
    const grouped = {};
    for (const r of stmt.all(m.id)) {
      (grouped[r.emoji] = grouped[r.emoji] || []).push(r.user_id);
    }
    m.reactions = grouped;
  }
  return msgs;
}

function getMessage(id) {
  const m = db.prepare(MSG_SELECT + " WHERE m.id = ?").get(id);
  return m ? attachReactions([m])[0] : null;
}

function dmKey(a, b) {
  return [Math.min(a, b), Math.max(a, b)].join("-");
}

// Role user di sebuah branch ("owner"|"admin"|"member"|null jika bukan anggota)
function branchRole(userId, branchId) {
  const row = db
    .prepare("SELECT role FROM memberships WHERE user_id = ? AND branch_id = ?")
    .get(userId, branchId);
  return row ? row.role : null;
}

function isBranchStaff(userId, branchId) {
  const role = branchRole(userId, branchId);
  return role === "owner" || role === "admin";
}

// Ambil channel + pastikan user anggota branch-nya
function channelForMember(channelId, userId) {
  const ch = db.prepare("SELECT * FROM channels WHERE id = ?").get(channelId);
  if (!ch) return null;
  if (!branchRole(userId, ch.branch_id)) return null;
  return ch;
}

// Apakah dua user berteman (status accepted)?
function areFriends(a, b) {
  return !!db
    .prepare(
      `
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))
  `,
    )
    .get(a, b, b, a);
}

module.exports = {
  MSG_SELECT,
  attachReactions,
  getMessage,
  dmKey,
  branchRole,
  isBranchStaff,
  channelForMember,
  areFriends,
};
