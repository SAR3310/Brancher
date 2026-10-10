# Changelog

Semua perubahan penting pada project ini dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan project ini mengikuti [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Validasi input dengan Zod untuk endpoint auth, branch, dan pesan (`server/validation.js`)
- Structured logging dengan Winston (`server/logger.js`) + Socket.io event logging
- Branch templates: `GET /api/branch-templates`, opsi `template` (`empty`/`default`/`dev`/`gaming`) saat membuat branch (`server/templates.js`)
- ESLint configuration untuk client JSX linting (`eslint.config.js`) — server & client coverage
- Prettier formatter configuration (`prettierrc.json`) — konsisten formatting semua files

### Changed

- Pembuatan branch kini memakai channel dari template, bukan lagi 3 channel hardcode
- ESLint scripts: server/ dan client/src/ keduanya di-lint
- Dependency versions: root & client package.json sudah synchronized (socket.io alignment)
- Code formatting: semua server/**/*.js, client/src/**/*.{js,jsx}, *.md formatted dengan Prettier

### Fixed

- ESLint: client JSX files now properly linted (P0-1)
- Dependencies: no version conflicts between root and client (P0-2)
- Formatting: consistent Prettier style across codebase (P0-3)

## [0.1.0] - 2026-09-30

### Added

- Rilis awal: Express.js + Socket.io backend, React + Vite frontend, SQLite
- Auth (register/login/logout, session 30 hari, rate limit), branch + invite code,
  channel (text/announce/voice), pesan + file attachment, reaksi, pin, reply,
  DM + pertemanan, presence & typing indicator real-time
- Dokumentasi: README, DEVELOPMENT, NETWORK, TAILSCALE, TROUBLESHOOTING, `docs/`
