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

## Admin (`/api/admin`)
Requires JWT authentication AND the `ADMIN` role.
- `GET /stats`: Aggregated database statistics across items, users, and booking states.
- `GET /users`: List of all users including usage volume.
- `GET /items`: List of all platform items.
- `GET /bookings`: List of all historical and active bookings.

## Listing Lifecycle (`/api/items`)
- `POST /:id/unlist`: (Owner) Soft-removes an item from the public marketplace. Cancels any pending requests. Fails if active rentals exist.
- `POST /:id/relist`: (Owner) Restores an unlisted item to the public marketplace.

## Reputation & Reviews (`/api/users`, `/api/bookings`)
- `GET /api/users/:id/reputation`: Returns renter and owner reputation metrics (avg rating, total ratings, completed_rentals, cancelled_rentals). **Public**.
- `GET /api/users/:id/reviews?role=OWNER|RENTER`: Returns received reviews for a user, optionally filtered by role. **Public**.
- `POST /api/bookings/:id/reviews`: Submit a review for a completed (returned) booking. **Authenticated** (JWT required). Reviewer identity derived server-side. Body: `{ rating: 1-5, comment?: string }`.
- `GET /api/bookings/my`: Now includes `my_review_submitted: boolean` on each booking to indicate whether the authenticated user has already reviewed it.

### Review Rules (enforced server-side)
1. Booking must be `returned`
2. Reviewer must be the booking's renter or the item's owner
3. One review per reviewer per booking (`(booking_id, reviewer_id)` unique)
4. Rating must be integer 1–5
5. Comment max 500 chars (truncated server-side)
6. Reviews are immutable post-submission
