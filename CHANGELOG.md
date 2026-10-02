# RentX Changelog

All notable changes to this project will be documented in this file.

## [2026-10-02] - Phase 0 Initialization
- **Task**: Phase 0 Repository Initialization
- **What Changed**: 
  - Created base project structure and persistent project memory files (AGENTS, PROJECT_CONTEXT, ARCHITECTURE, DATABASE, API, TASKS, CHANGELOG, DECISIONS, README, docs/).
  - Initialized Express + TypeScript backend with Prisma and `/api/health` endpoint.
  - Initialized Next.js + React + Tailwind frontend. (Next.js initialization hung, so manual \`npm install\` was executed successfully after wiping node_modules).
  - Linked frontend to call backend health endpoint.
- **Files Changed**: 
  - All memory docs (`AGENTS.md`, etc.)
  - `backend/*` (package.json, src/index.ts, tsconfig.json, .env.example, etc.)
  - `frontend/*` (package.json, app/page.tsx, .env.example, etc.)
- **Database Changes**: Initialized Prisma (no models yet).
- **API Changes**: Added `GET /api/health`.
- **Tests Performed**: Checked backend build (`tsc`) and frontend build (`next build`). Tested API connectivity using curl. Updated backend dev script to bypass `ts-node` incompatibility with TypeScript 7.
- **Next Recommended Step**: Phase 1 - Authentication + Marketplace.

## [2026-10-02] - Phase 1 Core Marketplace
- **Task**: Phase 1 Authentication + Marketplace implementation.
- **What Changed**: 
  - Implemented JWT authentication (signup/login/me).
  - Designed backend item creation, browse, update, and delete endpoints.
  - Developed full booking state machine (`pending`, `accepted`, `rejected`, `active`, `returned`, `cancelled`) with overlap prevention logic.
  - Implemented frontend UI for signup, login, marketplace browse, item detail with booking capability, new item listing, and a user dashboard (borrower/owner split).
- **Files Changed**: `prisma/schema.prisma`, `backend/src/middleware/auth.ts`, `backend/src/routes/*.ts`, `frontend/app/**/*.tsx`.
- **Database Changes**: Added `User`, `Item`, and `Booking` models to PostgreSQL.
- **API Changes**: Added `/api/auth/*`, `/api/items/*`, `/api/bookings/*`.
- **Tests Performed**: Checked all flows via curl integration (signup, login, create item, book item, booking overlap validation). Built both front and backend successfully.
- **Test Results**: All logic behaves exactly according to the strict validation requirements. Overlapping bookings are correctly rejected. Unauthorized modifications are denied.
- **Next Recommended Step**: Phase 2 - Item Passport.

## [2026-10-02] - Phase 1 Booking Lifecycle Fix
- **Task**: Fix Phase 1 integration gap for the booking state machine UI.
- **What Changed**: 
  - Updated frontend dashboard (`frontend/app/dashboard/page.tsx`) to show the Return action button for bookings that are in the `accepted` state, ensuring the renter can return an accepted item. 
- **Files Changed**: `frontend/app/dashboard/page.tsx`.
- **Database Changes**: None.
- **API Changes**: None (backend already fully supported `accepted -> returned`).
- **Test Results**: All transitions work seamlessly in both the backend and frontend.

## [2026-10-02] - Phase 2 Item Passport
- **Task**: Implement Item Passport, Immutable SHA-256 Identifiers, and Item History Audit Logs.
- **What Changed**: 
  - Added `passport_hash` to `Item` model generated from canonical immutable properties (`id`, `owner_id`, `created_at`, `serial_number`).
  - Added `ItemHistoryEvent` model to append lifecycle events (`ITEM_LISTED`, `RENTAL_REQUESTED`, `RENTAL_ACCEPTED`, `RENTAL_RETURNED`, `CONDITION_UPDATED`).
  - Created `scripts/migrate-passports.ts` to seamlessly back-fill existing Phase 1 items and reconstruct booking history.
  - Updated API booking endpoints to append matching history events inside Prisma `$transaction` blocks to ensure atomicity.
  - Added `/api/items/:id/passport` endpoint to publicly serve item timelines with backend-enforced PII redaction (e.g., masking external actors as "Verified Renter").
  - Created an owner-facing condition editor at `/items/:id/condition` to continuously log item degradation/preservation.
  - Enhanced item details page to render the Passport UI and timeline.
- **Files Changed**: `prisma/schema.prisma`, `backend/src/utils/hash.ts`, `backend/src/routes/*.ts`, `frontend/app/items/[id]/page.tsx`, `frontend/app/items/[id]/condition/page.tsx`, `backend/scripts/migrate-passports.ts`.
- **Database Changes**: Added `passport_hash`, `ItemHistoryEvent` table, and `EventType` enum.
- **API Changes**: Added `GET /api/items/:id/passport`, `PATCH /api/items/:id/condition`, modified `POST /api/items` and all `/api/bookings` endpoints.
- **Tests Performed**: Ran migration script locally, compiled frontend and backend, successfully performed E2E curl testing of item listing, requesting, accepting, and returning (with condition payload) to trace history appending.
- **Test Results**: Event timeline tracks correctly. Redaction verified. Hashes correspond accurately to the canonical strings. No invalid state transitions bypass the transaction constraints.
- **Next Recommended Step**: Phase 3 - Reputation & Ratings.

## [2026-10-02] - Phase 2 UI/UX Polish Pass
- **Task**: Focused visual, UI, and UX improvement across the entire frontend application.
- **What Changed**: 
  - Standardized the color token system using semantic Tailwind colors (`brand`, `slate`, `emerald`, `rose`, `amber`) to fix low contrast and readability issues.
  - Built a global `Navbar` component injected into `app/layout.tsx` to provide consistent navigation and stateful authentication logic globally.
  - Rebuilt the Homepage (`/`) with a modern Hero section and a clear "Find → Rent → Return" marketplace flow explanation.
  - Polished the Marketplace Browse (`/items`), Item Detail (`/items/[id]`), and Item Listing (`/items/new`) pages to improve visual hierarchy and readability (especially for item pricing and dates).
  - Enhanced the Item Passport & History section (`/items/[id]`) to communicate cryptographic trustworthiness visually, utilizing a vertical timeline format and distinct presentation for the SHA-256 hash.
  - Created a dedicated `Badge` component for Booking status indicators and unified button/form structures across the Dashboard (`/dashboard`) and Auth pages (`/login`, `/signup`).
- **Files Changed**: `frontend/app/layout.tsx`, `frontend/app/globals.css`, `frontend/components/Navbar.tsx`, `frontend/components/Badge.tsx`, and all pages (`page.tsx`) in the `app` directory.
- **Backend Changes**: None. Functionality completely preserved.
- **Tests Performed**: Ran full `npm run build` on both frontend and backend to verify strict Type-checking and no regressions. Validated accessibility improvements (focus outlines, contrast ratios, and semantic hierarchy).

## [2026-10-02] - Bugfix: Prevent Duplicate Rental Requests
- **Task**: Prevent renters from submitting multiple active rental requests for the same item.
- **What Changed**:
  - Enforced a strict server-side rule in `POST /api/bookings`: A renter can have at most one active request (`pending`, `accepted`, `active`) for a specific item at a time.
  - Previous requests that are `cancelled`, `rejected`, or `returned` are ignored and safely preserved in the database.
  - The UI (`frontend/app/items/[id]/page.tsx`) now gracefully handles this by fetching the renter's active requests. If an active request exists, the "Request to Rent" form is entirely hidden and replaced with an informative banner linking back to the Dashboard.
- **Files Changed**: `backend/src/routes/bookings.ts`, `frontend/app/items/[id]/page.tsx`.
- **Database Changes**: None. The rule is completely enforced via relational queries without needing a partial unique index, which aligns cleanly with Prisma.
- **Tests Performed**: Wrote an isolated integration test spanning 7 edge cases (pending rejection, cancellation resets, return resets, cross-renter overlap logic). All assertions passed successfully.
