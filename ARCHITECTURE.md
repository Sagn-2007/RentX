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
