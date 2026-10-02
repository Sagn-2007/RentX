# RentX Tasks

## Phase 0: Scaffolding (Current)
- [x] Create project structure
- [x] Create persistent project memory files
- [x] Initialize Backend (Node/Express/TS/Prisma)
- [x] Create `/api/health` endpoint
- [x] Initialize Frontend (Next.js/React/TS/Tailwind)
- [x] Connect Frontend to Backend health endpoint
- [x] Verify Phase 0 completion

## Phase 1: Authentication + Marketplace
- [x] User signup/login
- [x] Item listing and browse
- [x] Booking requests and basic flow
- [x] Setup Prisma schemas

## Phase 2: Item Passport
- [x] Item Passport Identity & SHA-256 Hashing
- [x] Item History / Audit Log via `ItemHistoryEvent`
- [x] Integrate history events into booking lifecycle via transactions
- [x] Public Passport endpoint with PII redaction
- [x] Condition updating interface for owners
- [x] Phase 1 Data Migration

## Phase 2.5: Admin Dashboard & Authorization
- [x] `Role` enum added to Prisma (`USER`, `ADMIN`)
- [x] Backend `requireAdmin` authorization middleware
- [x] Secure `create-admin.ts` bootstrapping script
- [x] Admin API endpoints (`/stats`, `/users`, `/items`, `/bookings`)
- [x] Frontend `/admin` dashboard with UI tabs and access control

## Phase 2.6: Listing Lifecycle
- [x] Unlist functionality (`POST /api/items/:id/unlist`)
- [x] Relist functionality (`POST /api/items/:id/relist`)
- [x] Prevent active rental unlisting and auto-cancel pending requests
- [x] Dashboard unlist/relist buttons and confirmation dialogs

## Phase 4: Need-Based Matching
- [ ] ...

## Phase 5: Deposit State Machine
- [ ] ...

## Phase 6: Demo Polish
- [ ] ...
