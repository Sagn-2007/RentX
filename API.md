# RentX API Contracts

## Auth (`/api/auth`)
- `POST /signup`: Creates a user with `name`, `email`, `password`.
- `POST /login`: Validates credentials, returns JWT.
- `GET /me`: Returns authenticated user info.

## Items (`/api/items`)
- `GET /`: Lists available items. Queries: `search`, `category`, `area`.
- `POST /`: Create an item. Requires auth. Generates a SHA-256 Passport hash and creates `ITEM_LISTED` event.
- `GET /:id`: Public item detail.
- `GET /:id/passport`: Public item passport details including chronological history. Automatically redacts PII for unauthenticated/unrelated users.
- `PATCH /:id`: Edit an item (owner only).
- `PATCH /:id/condition`: Owner-only update of the formal `condition_checklist`. Generates a `CONDITION_UPDATED` history event.
- `DELETE /:id`: Delete an item (owner only, prevented if active bookings exist).

## Bookings (`/api/bookings`)
- `GET /my`: Returns `{ asRenter, asOwner }` listing the user's relevant bookings.
- `POST /`: Requests a booking. Requires `item_id`, `start_date`, `end_date`. Validates overlap and ownership. Sets status to `pending`.
- `PATCH /:id/accept`: (Owner) Transitions `pending -> accepted`. Revalidates time overlap.
- `PATCH /:id/reject`: (Owner) Transitions `pending -> rejected`.
- `PATCH /:id/cancel`: (Renter/Owner) Cancels a `pending` or `accepted` booking.
- `PATCH /:id/return`: (Renter/Owner) Transitions `accepted` or `active` -> `returned`.
