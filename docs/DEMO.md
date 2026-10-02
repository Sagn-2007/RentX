# RentX Demo Plan

The eventual demo of RentX should show an end-to-end flow of the product:

1. User A lists a tool.
2. User A's item gets a digital passport hash.
3. User B searches for the item (or uses need-based matching).
4. User B requests to rent the item.
5. User A accepts the request.
6. The deposit enters the `held` state.
7. User B returns the item.
8. The deposit transitions to `released`.
9. Reputation is updated for both users.
10. The Item Passport displays the completed rental.
