# Technical Context & Roadmap

Deep reference for architecture rationale and future plans. Linked from CLAUDE.md.

---

## Build Order (completed phases + roadmap)

1. Monorepo scaffolding, build script, reference app shell ✓
2. `AppElement` base class, Shadow DOM, CSS token system, `adoptedStyleSheets` ✓
3. Router (`<app-router>`, `navigate()`, SW navigation intercept) ✓
4. Store + IDB layer (event sourcing schema, migrations, IDB wrapper) ✓
5. SW lifecycle + `version.json` update flow (`<sw-manager>`, `<update-banner>`) ✓
6. Gesture library ✓
7. Reference app features (YourYear) ✓
8. CLI scaffolding tool ✓
9. Scaffolded app — `modal-dialog`, `app-header`, `toast`, `images` modules; full scaffold home page; CLI `add`/`remove`/`manage`; `_modules/` per-module scaffold pages ✓
10. Simple library webpage
11. Simple store (state-only, not log-based)
12. P2P module (V2)
13. List components, additional UI primitives

---

## P2P Module — V2 Full Design

Two modes, both should be elegant:

- **Peer-to-peer mode** (team apps, 3-6 users): QR-based WebRTC signaling for connection establishment only. Device A displays a QR code, Device B scans it to establish the connection. Data flows over the P2P connection once established, not via QR.
- **Hub mode** (competition apps): one dedicated collector device, others are reporters. QR-based connection establishment. The hub is a log aggregator and read model — it collects domain logs, merges them, and broadcasts the consolidated state back to all connected devices so every reporter gets a live view of the full competition, not just their own domain slice.
- **Domain ownership (competition):** each reporter owns a data domain (a court, a match, a category) and is the only contributor to it. This makes log consolidation a simple union — no conflicts possible by design, no merge logic needed. The social contract of the competition replaces technical enforcement. No hard scoping required.
- **Log consolidation (team/sharing):** event order is a convenience not a correctness requirement in non-competition scenarios. Union of logs is sufficient.
- **Concurrent editing** is handled by user patterns, not technical locks. Domain handover (judge submits/closes a match, server user can then edit) is enforced by UI convention. A "domain closed" event in the log is sufficient. Technical conflict resolution is V5+.
- **No user identity or authentication in V1.** `deviceId` provides implicit identity — one device per person is sufficient. No accounts, no login, no auth infrastructure.
- **V3/V4 — score signing:** a mutual confirmation protocol where both parties append a "result confirmed" event with their `deviceId`. The digital equivalent of signing a match sheet. No cryptography or accounts required — social confirmation recorded in the log.
- **Clock integrity:** `deviceId` as secondary sort key ensures determinism but does not fix bad device clocks. In V2, a simple clock drift check on P2P connection establishment (compare to hub time, warn if above threshold) is the appropriate response. Not before it is a real observed problem.

The data model (append-only event log with `deviceId`) is designed for this from V1. The P2P module is not scaffolded unless selected in the CLI, but the data structure never changes.

---

## IDB V2 — Snapshot Strategy

**V2 note:** snapshots are the confirmed approach for large logs — a periodic frozen state tagged with a log position, with only subsequent events replayed on top. Materialised views are not suitable for out-of-order multi-device streams.

The boot sequence must remain isolated behind a single function so the V1→V2 transition is a one-line swap.

---

## Second Reference App — Fencing Competition Scorer

Built after P2P is implemented:
- P2P sync (judges relay scores to a head scorer)
- Domain ownership (one judge per piste)
- Long session stability (competition days, 8am–8pm, 12 hours)
- Hub mode: any device can become the competition hub via a UI state switch — not a separate application

---

## Multilingual — V4 Deferred Items

- `Intl.DateTimeFormat` / `Intl.NumberFormat` wrappers so dates and numbers respond to locale changes
- More sophisticated fallback chains (current: active → en → key is sufficient for now)

---

## Core API Stability Policy

**Before 1.0:** breaking changes are acceptable with a migration note in the changelog.

**After 1.0:** the core API (AppElement interface, Store API, Router, IDB conventions) is frozen. All new capabilities are additive. A breaking change requires a new major version and a written migration guide. This is a discipline decision, not a tooling one — enforce it through deliberate review, not automation.

### What types of changes are safe vs risky

- **New modules or components** — safe. New files in `_lib/`, developer opts in by using them.
- **Additive changes to existing core** — safe. New methods, new hooks, new gesture types. Existing code is unaffected.
- **Changes to core API signatures** — risky before 1.0, forbidden after 1.0 without a major version bump.
- **IDB schema changes** — always require a migration function. Never change the event log schema shape — only add new object stores or indexes.

---

## Distribution

One git repository — this monorepo. No separate repo for the library or the reference app. When the CLI generates a user project, that project starts its own fresh independent git repo with no link back here.

The CLI is distributed via GitHub. Users run it with `npx socle`. No npm publishing required unless explicitly decided later.
