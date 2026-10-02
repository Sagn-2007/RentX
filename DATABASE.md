# RentX Database Schema

## Models (Implemented)

### User
Users of the platform (owners and renters).
- **id**: UUID
- **email**: Unique String
- **password_hash**: bcrypt hash
- **name**: String

### Item
Physical goods listed for rent.
- **id**: UUID
- **owner_id**: Foreign Key to User
- **title**: String
- **description**: String
- **category**: String
- **price_per_day**: Float
- **deposit_amount**: Float
- **city, area**: Hyperlocal targeting properties.

### Booking
Rental agreements between users for specific items.
- **id**: UUID
- **item_id**: FK to Item
- **renter_id**: FK to User
- **start_date, end_date**: Dates (start must be < end)
- **status**: String (`pending`, `accepted`, `rejected`, `active`, `returned`, `cancelled`).

## Integrity Rules Enforced Server-Side
- A user cannot rent their own item.
- An item cannot be deleted if there are overlapping pending/accepted/active bookings.
- New bookings cannot overlap in time with existing `pending`, `accepted`, or `active` bookings. Overlap queries are strictly run before state changes.

## Conceptual Models (Upcoming in Phase 2+)
- **ItemHistoryEvent**: Append-only log of events for an item.
- **Rating**: Multidimensional reviews.
- **DepositTransition**: State machine logs tracking the collateral status.
