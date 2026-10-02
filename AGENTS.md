# RentX - AI Agents Instructions

This file contains permanent instructions for all AI coding sessions working on RentX.

## Project Identity
RentX is a general-purpose peer-to-peer rental marketplace for physical goods (Buy Nothing, Rent Everything). Focus on hyperlocal rentals to facilitate trust and handoff. Do NOT tie the architecture to any specific organization, campus, or group. The MVP centers on trust (Item Passport, Reputation, Need-Based Matching, and Auditable Deposit State Machine).

## Coding Principles
- Prefer small, safe changes.
- Ensure clear modules, reusable components, strong typing, and explicit error handling.
- Avoid premature optimization, overengineering, or giant files.
- Validate on the server side and enforce database constraints.
- Never blindly overwrite existing code. Always inspect the current implementation first.

## Scope Boundaries
- **In Scope (MVP):** Core marketplace, item passport, reputation, deterministic need-based matching, deposit escrow state machine (backend logic only).
- **Out of Scope (MVP):** Blockchain, Web3, real cryptocurrency, real payment processing, social graph traversal, LLM intent parsing.

## Feature Status Rules
- 🟢 BUILT: Implemented with real code and persistent data.
- 🟡 SIMULATED: Application logic is real, external dependency mocked (e.g., deterministic search instead of LLM, simulated escrow).
- 🔵 VISION: Not implemented, only exists in roadmap/documentation.

## Documentation Requirements
- Update `ARCHITECTURE.md` on architectural changes.
- Update `DATABASE.md` on schema changes.
- Update `API.md` on endpoint changes.
- Update `TASKS.md` for task state.
- Update `CHANGELOG.md` with detailed entries after every meaningful change.
- Record decisions in `DECISIONS.md`.

## Testing Requirements
- Run TypeScript/build checks.
- Run linting.
- Ensure all relevant tests pass.
- Never claim a feature is complete unless actually tested.

## Anti-Rewrite Rules
- Do NOT rewrite or refactor large parts of the application unnecessarily. Small, incremental updates only.
