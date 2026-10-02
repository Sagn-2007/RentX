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
- **Tests Performed**: Validated `pending -> accepted -> returned` flow along with `pending -> rejected`, `pending -> cancelled` flows.
- **Test Results**: All transitions work seamlessly in both the backend and frontend.
