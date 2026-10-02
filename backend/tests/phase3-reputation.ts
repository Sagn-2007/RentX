/**
 * Phase 3 – Reputation & Trust: Deterministic Integration Tests
 *
 * Uses unique-per-run test accounts so accumulated dev data can NEVER interfere
 * with the expected reputation values. Each rating submitted by this test is
 * known in advance, so expected averages are computed from first principles.
 */
import { execSync } from 'child_process';

const BASE = 'http://localhost:3001/api';

function curl(method: string, path: string, token?: string, body?: any): { status: number; data: any } {
  let cmd = `curl -s -w "\\n%{http_code}" -X ${method} ${BASE}${path}`;
  if (token) cmd += ` -H "Authorization: Bearer ${token}"`;
  if (body)  cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`;
  const out = execSync(cmd).toString().trim().split('\n');
  const status = parseInt(out.pop()!);
  const data = JSON.parse(out.join('\n') || '{}');
  return { status, data };
}

let pass = 0, fail = 0;
function check(label: string, cond: boolean) {
  if (cond) { console.log(`  ✓ ${label}`); pass++; }
  else       { console.error(`  ✗ ${label}`); fail++; }
}
function approxEq(a: number, b: number, tol = 0.01) { return Math.abs(a - b) < tol; }

// ─────────────────────────────────────────────────────────────────────────────
// Setup: unique-per-run isolated test accounts (timestamp-namespaced)
// Signup returns user only (no token); login to obtain JWT.
// ─────────────────────────────────────────────────────────────────────────────
const ts   = Date.now();
const pw   = 'TestPass!123';
const ownerEmail   = `test_owner_${ts}@rentx.test`;
const renter1Email = `test_r1_${ts}@rentx.test`;
const renter2Email = `test_r2_${ts}@rentx.test`;

function signupAndLogin(name: string, email: string): string {
  curl('POST', '/auth/signup', undefined, { name, email, password: pw });
  return curl('POST', '/auth/login', undefined, { email, password: pw }).data.token as string;
}

console.log('Creating isolated test users…');
const ownerTok   = signupAndLogin(`Owner_${ts}`,   ownerEmail);
const renter1Tok = signupAndLogin(`Renter1_${ts}`, renter1Email);
const renter2Tok = signupAndLogin(`Renter2_${ts}`, renter2Email);
const ownerMe    = curl('GET', '/auth/me', ownerTok).data;
const renter1Me  = curl('GET', '/auth/me', renter1Tok).data;
const renter2Me  = curl('GET', '/auth/me', renter2Tok).data;
console.log(`  owner=${ownerMe.id.slice(0,8)} renter1=${renter1Me.id.slice(0,8)} renter2=${renter2Me.id.slice(0,8)}`);

// Helper: full rental lifecycle → returned booking
function fullCycle(title: string, renterTok: string, start: string, end: string) {
  const item = curl('POST', '/items', ownerTok, {
    title, description: 'Test', category: 'Tools',
    price_per_day: 10, deposit_amount: 20, city: 'City', area: 'Area'
  }).data;
  const booking = curl('POST', '/bookings', renterTok, {
    item_id: item.id, start_date: start, end_date: end
  }).data;
  curl('PATCH', `/bookings/${booking.id}/accept`, ownerTok);
  curl('PATCH', `/bookings/${booking.id}/return`, renterTok);
  return { item, booking };
}

// Create returned bookings; ratings we will submit are listed here for auditability:
//   bookingA: renter1→owner 5★,  owner→renter1 4★
//   bookingB: renter2→owner 3★,  owner→renter2 5★
//   bookingD: renter1→owner 2★  (extra booking to verify 3-rating aggregate)
const { booking: bookingA } = fullCycle('Item A', renter1Tok, '2030-01-01', '2030-01-05');
const { booking: bookingB } = fullCycle('Item B', renter2Tok, '2030-02-01', '2030-02-05');
const { booking: bookingD } = fullCycle('Item D', renter1Tok, '2030-06-01', '2030-06-05');

// Booking C stays pending then accepted (never returned) — for rejection tests
const itemC = curl('POST', '/items', ownerTok, {
  title: 'Item C', description: 'Test', category: 'Tools',
  price_per_day: 10, deposit_amount: 20, city: 'City', area: 'Area'
}).data;
const bookingC_pending = curl('POST', '/bookings', renter1Tok, {
  item_id: itemC.id, start_date: '2030-03-01', end_date: '2030-03-05'
}).data;
const bookingC_accepted = curl('POST', '/bookings', renter2Tok, {
  item_id: itemC.id, start_date: '2030-05-01', end_date: '2030-05-05'
}).data;
curl('PATCH', `/bookings/${bookingC_accepted.id}/accept`, ownerTok);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Review Authorization Tests ---');
// ─────────────────────────────────────────────────────────────────────────────

// Test 3: pending → reject
const rPending = curl('POST', `/bookings/${bookingC_pending.id}/reviews`, renter1Tok, { rating: 5 });
check('Test 3: Pending booking review rejected (400)', rPending.status === 400);

// Test 4: accepted-not-returned → reject
const rAccepted = curl('POST', `/bookings/${bookingC_accepted.id}/reviews`, renter2Tok, { rating: 5 });
check('Test 4: Accepted-not-returned review rejected (400)', rAccepted.status === 400);

// Test 1: returned → renter1 reviews owner  ★5
const r1 = curl('POST', `/bookings/${bookingA.id}/reviews`, renter1Tok, { rating: 5, comment: 'Great owner!' });
check('Test 1: Renter can review owner after return (200, OWNER)', r1.status === 200 && r1.data.target_role === 'OWNER');

// Test 2: returned → owner reviews renter1  ★4
const r2 = curl('POST', `/bookings/${bookingA.id}/reviews`, ownerTok, { rating: 4, comment: 'Good renter' });
check('Test 2: Owner can review renter after return (200, RENTER)', r2.status === 200 && r2.data.target_role === 'RENTER');

// Renter2 reviews owner  ★3
const rR2O = curl('POST', `/bookings/${bookingB.id}/reviews`, renter2Tok, { rating: 3 });
check('Renter2 reviews owner after return (200)', rR2O.status === 200);

// Owner reviews renter2  ★5
const rOR2 = curl('POST', `/bookings/${bookingB.id}/reviews`, ownerTok, { rating: 5 });
check('Owner reviews renter2 after return (200)', rOR2.status === 200);

// Renter1 reviews owner for bookingD  ★2
const rD = curl('POST', `/bookings/${bookingD.id}/reviews`, renter1Tok, { rating: 2 });
check('Renter1 reviews owner for bookingD (200)', rD.status === 200);

// Test 7: duplicate review blocked
const r7 = curl('POST', `/bookings/${bookingA.id}/reviews`, renter1Tok, { rating: 3 });
check('Test 7: Duplicate review rejected (400)', r7.status === 400);

// Test 5: unrelated user → 403 (renter2 was not in bookingA)
const r5 = curl('POST', `/bookings/${bookingA.id}/reviews`, renter2Tok, { rating: 4 });
check('Test 5: Unrelated user review rejected (403)', r5.status === 403);

// Test 8: rating = 0
const r8 = curl('POST', `/bookings/${bookingB.id}/reviews`, renter1Tok, { rating: 0 });
check('Test 8: Rating 0 rejected (400)', r8.status === 400);

// Test 9: rating = 6
const r9 = curl('POST', `/bookings/${bookingB.id}/reviews`, renter1Tok, { rating: 6 });
check('Test 9: Rating 6 rejected (400)', r9.status === 400);

// Test 10: valid rating on a fresh returned booking
const { booking: bookingE } = fullCycle('Item E', renter1Tok, '2030-07-01', '2030-07-05');
const r10 = curl('POST', `/bookings/${bookingE.id}/reviews`, renter1Tok, { rating: 1 });
check('Test 10: Valid rating 1 accepted (200)', r10.status === 200);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Reputation Calculation Tests ---');
// ─────────────────────────────────────────────────────────────────────────────

const ownerRep   = curl('GET', `/users/${ownerMe.id}/reputation`).data;
const renter1Rep = curl('GET', `/users/${renter1Me.id}/reputation`).data;
const renter2Rep = curl('GET', `/users/${renter2Me.id}/reputation`).data;

// Owner received as OWNER: 5 (r1), 3 (rR2O), 2 (rD), 1 (r10) → avg = (5+3+2+1)/4 = 2.75
const expectedOwnerAvg     = (5 + 3 + 2 + 1) / 4;   // 2.75
const expectedOwnerRatings = 4;

// Renter1 received as RENTER: 4 (r2) → avg = 4.0
const expectedR1Avg     = 4.0;
const expectedR1Ratings = 1;

// Renter2 received as RENTER: 5 (rOR2) → avg = 5.0
const expectedR2Avg     = 5.0;
const expectedR2Ratings = 1;

// Test 12a–f: Deterministic rating averages (computed from known submitted ratings)
check(`Test 12a: Owner total_ratings = ${expectedOwnerRatings}`,
  ownerRep.owner.total_ratings === expectedOwnerRatings);
check(`Test 12b: Owner avg_rating ≈ ${expectedOwnerAvg.toFixed(2)} = (5+3+2+1)/4`,
  approxEq(ownerRep.owner.average_rating, expectedOwnerAvg));

check(`Test 12c: Renter1 total_ratings = ${expectedR1Ratings}`,
  renter1Rep.renter.total_ratings === expectedR1Ratings);
check(`Test 12d: Renter1 avg_rating = ${expectedR1Avg}`,
  approxEq(renter1Rep.renter.average_rating, expectedR1Avg));

check(`Test 12e: Renter2 total_ratings = ${expectedR2Ratings}`,
  renter2Rep.renter.total_ratings === expectedR2Ratings);
check(`Test 12f: Renter2 avg_rating = ${expectedR2Avg}`,
  approxEq(renter2Rep.renter.average_rating, expectedR2Avg));

// Test 14: completed rental counts (only 'returned' status bookings)
// Owner's items had: A, B, D, E returned = 4
check('Test 14a: Owner completed_rentals = 4', ownerRep.owner.completed_rentals === 4);
// Renter1 returned: A, D, E = 3
check('Test 14b: Renter1 completed_rentals = 3', renter1Rep.renter.completed_rentals === 3);
// Renter2 returned: B = 1
check('Test 14c: Renter2 completed_rentals = 1', renter2Rep.renter.completed_rentals === 1);

// Test 15: cancel bookingC_pending → must NOT increase completed_rentals
curl('PATCH', `/bookings/${bookingC_pending.id}/cancel`, renter1Tok);
const ownerRepAfterCancel = curl('GET', `/users/${ownerMe.id}/reputation`).data;
check('Test 15a: Cancelled booking NOT counted in completed_rentals (still 4)',
  ownerRepAfterCancel.owner.completed_rentals === 4);
check('Test 15b: Cancelled booking IS counted in cancelled_rentals (>= 1)',
  ownerRepAfterCancel.owner.cancelled_rentals >= 1);

// Test 16: user with zero reviews on a track → avg_rating = 0, total_ratings = 0
check('Test 16a: Owner has no RENTER-role ratings (separate track)',
  ownerRep.renter.total_ratings === 0 && ownerRep.renter.average_rating === 0);
check('Test 16b: Renter1 has no OWNER-role ratings (separate track)',
  renter1Rep.owner.total_ratings === 0 && renter1Rep.owner.average_rating === 0);

// Test 16c: unauthenticated request allowed (public endpoint)
const r16c = curl('GET', `/users/${ownerMe.id}/reputation`);
check('Test 16c: Unauthenticated reputation request returns 200 (public)',
  r16c.status === 200);

// Test 17: multiple renters' reviews aggregate into owner's average
check('Test 17: Owner avg is aggregate of all submitted ratings (not just last)',
  ownerRep.owner.total_ratings === expectedOwnerRatings &&
  approxEq(ownerRep.owner.average_rating, expectedOwnerAvg));

// Test 18: renter tracks are independent — one renter's score doesn't affect the other
check('Test 18: Renter tracks isolated (renter1 avg 4.0 ≠ renter2 avg 5.0)',
  !approxEq(renter1Rep.renter.average_rating, renter2Rep.renter.average_rating));

// Reviews list endpoint
const ownerOwnerReviews = curl('GET', `/users/${ownerMe.id}/reviews?role=OWNER`).data;
check('Reviews list endpoint returns array', Array.isArray(ownerOwnerReviews));
check(`Reviews list has ${expectedOwnerRatings} entries`, ownerOwnerReviews.length === expectedOwnerRatings);
check('Review record has reviewer.name', ownerOwnerReviews[0]?.reviewer?.name !== undefined);
check('Review record has booking.item.title', ownerOwnerReviews[0]?.booking?.item?.title !== undefined);

// my_review_submitted annotation on GET /bookings/my
const myBookings = curl('GET', '/bookings/my', renter1Tok).data;
const returnedAsRenter = myBookings.asRenter.filter((b: any) => b.status === 'returned');
check('Annotated bookings: my_review_submitted field present',
  returnedAsRenter.length > 0 && 'my_review_submitted' in returnedAsRenter[0]);
const bA = returnedAsRenter.find((b: any) => b.id === bookingA.id);
const bD = returnedAsRenter.find((b: any) => b.id === bookingD.id);
check('Annotated bookings: bookingA my_review_submitted = true',  bA?.my_review_submitted === true);
check('Annotated bookings: bookingD my_review_submitted = true',  bD?.my_review_submitted === true);

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
