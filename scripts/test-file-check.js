// Tes unit pengecekan isi file upload (tanpa server, tanpa browser).
// Jalankan: node scripts/test-file-check.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("assert");
const { checkFileContent } = require("../server/fileCheck");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brancher-fc-"));
const put = (name, bytes) => {
  const p = path.join(dir, name);
  fs.writeFileSync(p, Buffer.from(bytes));
  return p;
};

const cases = [
  ["PNG asli", put("ok.png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]), "image/png", true],
  ["skrip diberi label PNG", put("fake.png", Buffer.from("#!/bin/sh\nrm -rf x")), "image/png", false],
  ["PDF asli", put("ok.pdf", Buffer.from("%PDF-1.4 x")), "application/pdf", true],
  ["EXE diberi label PDF", put("fake.pdf", [0x4d, 0x5a, 0, 0]), "application/pdf", false],
  ["teks biasa", put("ok.txt", Buffer.from("halo teks biasa")), "text/plain", true],
  ["teks berisi byte NUL", put("bin.txt", [0x61, 0x00, 0x62]), "text/plain", false],
];

let pass = 0;
for (const [label, file, mime, expected] of cases) {
  const r = checkFileContent(file, mime);
  try {
    assert.strictEqual(r.ok, expected);
    pass++;
    console.log(`PASS  ${label}`);
  } catch (e) {
    console.log(`FAIL  ${label} -> ${r.ok ? "diterima" : r.reason}`);
  }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${pass}/${cases.length} lulus`);
if (pass !== cases.length) process.exit(1);
