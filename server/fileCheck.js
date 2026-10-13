// Cek isi file upload (magic bytes), bukan hanya label mimetype dari browser.
// Jenis yang punya signature tetap dicek ketat. Teks/dokumen Office tidak punya
// signature tunggal, jadi hanya dicek bukan biner berbahaya (tanpa byte NUL).

const fs = require("fs");

const SIGNATURES = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
  "image/webp": [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], also: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] } }],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // Office modern (docx/xlsx) adalah ZIP
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [[0x50, 0x4b, 0x03, 0x04]],
  // Office lama (doc/xls) pakai OLE2
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  "application/vnd.ms-excel": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
};

const TEXT_TYPES = new Set(["text/plain"]);

function matchAt(buf, offset, bytes) {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buf[offset + i] === b);
}

function matchesSignature(buf, sig) {
  if (Array.isArray(sig)) return matchAt(buf, 0, sig);
  if (!matchAt(buf, sig.offset, sig.bytes)) return false;
  return sig.also ? matchAt(buf, sig.also.offset, sig.also.bytes) : true;
}

// Mengembalikan { ok: true } atau { ok: false, reason }.
// Membaca 512 byte pertama saja.
function checkFileContent(filePath, declaredMime) {
  let head;
  try {
    const fd = fs.openSync(filePath, "r");
    head = Buffer.alloc(512);
    const n = fs.readSync(fd, head, 0, 512, 0);
    fs.closeSync(fd);
    head = head.subarray(0, n);
  } catch (e) {
    return { ok: false, reason: "File tidak bisa dibaca" };
  }

  const sigs = SIGNATURES[declaredMime];
  if (sigs) {
    const ok = sigs.some((s) => matchesSignature(head, s));
    return ok ? { ok: true } : { ok: false, reason: "Isi file tidak sesuai jenisnya" };
  }

  if (TEXT_TYPES.has(declaredMime)) {
    // Teks tidak boleh mengandung byte NUL (tanda biner/program)
    const hasNul = head.includes(0x00);
    return hasNul ? { ok: false, reason: "Isi file bukan teks biasa" } : { ok: true };
  }

  return { ok: false, reason: "Tipe file tidak didukung" };
}

module.exports = { checkFileContent, SIGNATURES };
