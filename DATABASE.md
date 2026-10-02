# RentX Database Schema

## Models (Implemented)

### User
Users of the platform (owners and renters).
- **id**: UUID
- **email**: Unique String
- **password_hash**: bcrypt hash
- **name**: String
- **role**: Enum (`USER`, `ADMIN`) - defaults to `USER`.

### Item
Physical goods listed for rent.
- **id**: UUID
- **owner_id**: Foreign Key to User
- **title**: String
- **description**: String
- **category**: String
- **price_per_day**: Float
- **deposit_amount**: Float
- **passport_hash**: String (Unique, SHA-256 fingerprint generated at birth)
- **serial_number**: String (Optional)
- **condition_checklist**: Json (Structured condition snapshot containing overall, exterior, functional, accessories, notes)
- **city, area**: Hyperlocal targeting properties.

### Booking
Rental agreements between users for specific items.
- **id**: UUID
- **item_id**: FK to Item
- **renter_id**: FK to User
- **start_date, end_date**: Dates (start must be < end)
- **status**: String (`pending`, `accepted`, `rejected`, `active`, `returned`, `cancelled`).

### ItemHistoryEvent
Append-only log of events for an item.
- **id**: UUID
- **item_id**: FK to Item
- **booking_id**: FK to Booking (Optional)
- **actor_id**: FK to User (Optional)
- **event_type**: Enum (`ITEM_LISTED`, `ITEM_UNLISTED`, `ITEM_RELISTED`, `RENTAL_REQUESTED`, `RENTAL_ACCEPTED`, `RENTAL_RETURNED`, `CONDITION_UPDATED`)
- **condition_snapshot**: Json (Snapshot of the condition at the time of event)
- **metadata**: Json (Flexible context, e.g. for migrations)
- **created_at**: DateTime

## Integrity Rules Enforced Server-Side
- A user cannot rent their own item.
- An item cannot be deleted if there are overlapping pending/accepted/active bookings.
- New bookings cannot overlap in time with existing `accepted` or `active` bookings. Overlap queries are strictly run before state changes. `pending` requests do NOT reserve the item.
- State-changing operations (Booking creation, updates, Condition edits) strictly wrap their respective `ItemHistoryEvent` inserts inside a Prisma transaction.
- Passport Hashes are completely immutable.

## Conceptual Models (Upcoming in Phase 3+)
- **Rating**: Multidimensional reviews.
- **DepositTransition**: State machine logs tracking the collateral status.

### Review
Post-rental ratings between booking participants.
- **id**: UUID
- **booking_id**: FK to Booking
- **reviewer_id**: FK to User (derived from JWT server-side, never trusted from client)
- **target_id**: FK to User (the reviewed party)
- **target_role**: Enum (`OWNER`, `RENTER`) — separates reputation tracks
- **rating**: Int, 1–5 (enforced by backend validation + DB range)
- **comment**: String? (max 500 chars)
- **created_at**: DateTime
- **Unique constraint**: `(booking_id, reviewer_id)` — one review per participant per booking

### enum ReviewTargetRole
- `OWNER` — review targets the item owner
- `RENTER` — review targets the renter
