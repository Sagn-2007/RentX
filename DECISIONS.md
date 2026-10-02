# RentX Decisions Log

## Phase 0
**Decision**: Monorepo-style structure (`frontend/` and `backend/`).
- **Reason**: Simplifies development and allows AI agents to easily read/modify both components in a single session.

**Decision**: PostgreSQL + Prisma for the Data Layer.
- **Reason**: Bookings, rental history, reputation, and state transitions are strongly relational.

## Phase 1
**Decision**: JWT Authentication via local storage and `Bearer` headers.
- **Reason**: Simplest and most direct approach for MVP without introducing cookie-based CSRF complexities for cross-origin setups during dev.

**Decision**: Explicit Booking Status Machine `pending -> accepted -> active -> returned` (with rejected/cancelled exits).
- **Reason**: Ensures bookings are fully tracked and no generic `PATCH /id` is allowed, keeping state transitions strictly validated on the server.

## Phase 2
**Decision**: Passport Hashes are SHA-256 Strings computed in Node (`crypto`).
- **Reason**: Provides a digital signature for items without resorting to blockchain.
- **Note**: The hash is locked to the item's creation properties (`id`, `owner_id`, `created_at`, `serial_number`) to prevent identity drift when mutable fields change.

**Decision**: ItemHistoryEvents are inserted via Prisma `$transaction`.
- **Reason**: Guarantee atomicity between state-machine updates in `Booking` and the append-only `ItemHistoryEvent` audit log.

**Decision**: PII is redacted during `GET /api/items/:id/passport`.
- **Reason**: The passport timeline is public for trust generation, but must preserve privacy by masking non-owner users as "Verified Renter".
