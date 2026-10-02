# RentX - Project Context

## Product Definition
**RentX**: Buy Nothing, Rent Everything
RentX is a general-purpose peer-to-peer rental marketplace for physical goods. It allows owners to monetize underused physical items (tools, cameras, camping equipment, etc.) by renting them to neighbors/locals who only need them temporarily.

## Core Problem Solved
How do strangers safely rent physical objects from one another?

## Key Differentiators
1. **Item Passport**: A digital identity for each item tracking condition and rental history.
2. **Multidimensional Reputation**: Trust metrics derived from real rentals, for both owners and renters.
3. **Need-Based Matching**: Connecting abstract user needs (e.g., "going camping") to specific item categories.
4. **Auditable Deposit State Machine**: An off-chain state machine modeling the flow of collateral during a rental.

## MVP Demo Loop
1. Owner lists item -> Item gets passport hash.
2. User discovers item via search or need-based matching.
3. User requests to rent the item.
4. Owner accepts.
5. Deposit moves from `pending` -> `held`.
6. Item is returned.
7. Deposit moves to `released` (if no dispute).
8. Reputation updates for both parties.
9. Item Passport timeline reflects the completed rental.
