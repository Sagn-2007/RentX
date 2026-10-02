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
