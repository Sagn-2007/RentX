# RentX Architecture

## Overview
RentX is composed of a decoupled frontend and backend. 

### Frontend
- Next.js (React) App Router
- TypeScript
- Tailwind CSS

### Backend
- Node.js with Express
- TypeScript

### Data Layer
- PostgreSQL
- Prisma ORM

### Authentication Architecture
- Stateless JWT tokens (signed with `jsonwebtoken`).
- Exchanged via `Authorization: Bearer <token>` header.
- Checked via a dedicated Express middleware that assigns `req.user`.

### Booking State Machine
Strict transitions validated in dedicated `/api/bookings/:id/<action>` routes:
- **Pending**: Initial request.
- **Accepted**: Approved by owner (checked against overlap).
- **Rejected**: Denied by owner.
- **Cancelled**: Aborted by either party prior to completion.
- **Returned**: Completed rental lifecycle.

### Item Passport and Audit Logs
Every item possesses an immutable `passport_hash` generated at birth using Node's `crypto` SHA-256 algorithm. The canonical identity properties are deterministically hashed. The timeline of an item (`ItemHistoryEvent`) serves as an append-only audit log tracking changes in possession, status, and condition.

### Transaction Strategy
Any operation modifying booking state and generating a history event (`POST /bookings`, `PATCH /accept`, `PATCH /return`) relies heavily on `Prisma.$transaction` to guarantee database atomicity.

### Availability Strategy
For Phase 1 & 2, `is_available` is a boolean on the Item. Temporal availability is strictly calculated by querying `Booking` models to see if there are overlapping active dates.

### Location Strategy
Uses coarse hyperlocal strings (`city`, `area`) with optional lat/lng. No strict geocoding requirements for the MVP to maintain simplicity and privacy.

### Admin Architecture
- **Roles**: Native Prisma Enum (`USER` | `ADMIN`). Defaults to `USER`.
- **Authorization**: Handled gracefully via `requireAdmin` middleware. The role is strictly enforced from the JWT user database payload, never from client requests.
- **Bootstrapping**: System Administrators must be dynamically seeded/provisioned using server-side execution (`backend/scripts/create-admin.ts`) referencing environment variables. Registration APIs exclusively produce standard users.

### Listing Lifecycle Architecture
- **State**: The visibility of an item is managed by the `is_available` boolean on the `Item` model (`true` = Listed, `false` = Unlisted).
- **Public Visibility**: The primary `GET /items` marketplace query filters out unlisted items (`is_available: false`).
- **Owner Access**: Owners always see their items in their Dashboard regardless of state.
- **Unlisting Mechanism**: Soft-hides the item. Explicitly cancels `pending` rental requests. Strongly rejected if `accepted` or `active` bookings exist. Emits `ITEM_UNLISTED` to the append-only `ItemHistoryEvent` log. Preserves `passport_hash`.
- **Relisting Mechanism**: Restores public visibility and emits `ITEM_RELISTED`.

### Phase 3: Reputation & Trust Architecture
- **Design Principle**: All reputation values are derived from real platform activity (Booking and Review records). No hardcoded, fake, or ML-generated scores.
- **Review Model**: `Review` table keyed on `(booking_id, reviewer_id)` with a DB-level unique constraint preventing duplicates. Reviews are immutable post-submission.
- **Reputation Calculation**: Aggregate queries on `Review` (avg rating, count) and `Booking` (returned/cancelled count). Computed on-request with no cached fields.
- **Role Separation**: `ReviewTargetRole` enum (`OWNER`, `RENTER`) cleanly separates reputation tracks — a user's owner reputation is independent of their renter reputation.
- **Authorization**: Reviewer identity always derived from the server-side JWT (`req.user`). Target role determined by who in the booking the authenticated user is — never trusted from client.
- **Post-Return UX**: `GET /bookings/my` annotates each booking with `my_review_submitted: boolean` so the frontend can show review CTAs without an extra roundtrip.
- **Dispute Integration**: Architecture is extensible — future dispute resolution can write a `DISPUTE_FILED` event to `ItemHistoryEvent` and add dispute-related fields to `Review` or a new `Dispute` model without schema breakage.
