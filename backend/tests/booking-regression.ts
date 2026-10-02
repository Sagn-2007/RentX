/**
 * Booking regression tests — each scenario uses a fresh item to prevent
 * cross-test state interference.
 */
import { execSync } from 'child_process';
const BASE = 'http://localhost:3001/api';
function curl(method: string, path: string, token?: string, body?: any) {
  let cmd = `curl -s -w "\\n%{http_code}" -X ${method} ${BASE}${path}`;
  if (token) cmd += ` -H "Authorization: Bearer ${token}"`;
  if (body)  cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`;
  const out = execSync(cmd).toString().trim().split('\n');
  const status = parseInt(out.pop()!);
  return { status, data: JSON.parse(out.join('\n') || '{}') };
}
let p = 0, f = 0;
function check(label: string, cond: boolean) {
  if (cond) { console.log(`  ✓ ${label}`); p++; }
  else { console.error(`  ✗ ${label}`); f++; }
}
const ts = Date.now();
const pw = 'Regress!1';
function go(name: string, email: string) {
  curl('POST', '/auth/signup', undefined, { name, email, password: pw });
  return curl('POST', '/auth/login', undefined, { email, password: pw }).data.token as string;
}
const ownerTok   = go(`RO_${ts}`,  `ro_${ts}@r.test`);
const renter1Tok = go(`R1_${ts}`,  `r1_${ts}@r.test`);
const renter2Tok = go(`R2_${ts}`,  `r2_${ts}@r.test`);
const renter3Tok = go(`R3_${ts}`,  `r3_${ts}@r.test`);

function makeItem(title: string) {
  return curl('POST', '/items', ownerTok, {
    title, description: 'D', category: 'Tools',
    price_per_day: 5, deposit_amount: 10, city: 'C', area: 'A'
  }).data;
}

// ── Test 1: Multiple pending requests for same item are allowed (Phase 2 fix)
const item1 = makeItem('Reg-Item1');
const b1a = curl('POST', '/bookings', renter1Tok, { item_id: item1.id, start_date: '2031-01-01', end_date: '2031-01-05' });
const b1b = curl('POST', '/bookings', renter2Tok, { item_id: item1.id, start_date: '2031-01-02', end_date: '2031-01-06' });
check('REG-1: Multiple pending requests allowed for overlapping dates', b1a.status === 200 && b1b.status === 200);

// ── Test 2: Same renter cannot have two active requests for same item
const item2 = makeItem('Reg-Item2');
curl('POST', '/bookings', renter1Tok, { item_id: item2.id, start_date: '2031-02-01', end_date: '2031-02-05' });
const dup = curl('POST', '/bookings', renter1Tok, { item_id: item2.id, start_date: '2031-03-01', end_date: '2031-03-05' });
check('REG-2: Duplicate request by same renter blocked (400)', dup.status === 400);

// ── Test 3: New renter3 request blocked when accepted booking overlaps dates
const item3 = makeItem('Reg-Item3');
const b3a = curl('POST', '/bookings', renter1Tok, { item_id: item3.id, start_date: '2031-04-01', end_date: '2031-04-10' });
curl('PATCH', `/bookings/${b3a.data.id}/accept`, ownerTok);
// renter3 (fresh, no prior booking for item3) tries overlapping dates
const b3b = curl('POST', '/bookings', renter3Tok, { item_id: item3.id, start_date: '2031-04-05', end_date: '2031-04-08' });
check('REG-3: New request blocked when accepted booking overlaps (400)', b3b.status === 409);

// ── Test 4: After accepted booking is cancelled, new booking is allowed
curl('PATCH', `/bookings/${b3a.data.id}/cancel`, renter1Tok);
const b3c = curl('POST', '/bookings', renter3Tok, { item_id: item3.id, start_date: '2031-04-05', end_date: '2031-04-08' });
check('REG-4: New request allowed after accepted booking cancelled (200)', b3c.status === 200);

// ── Test 5: Unlisted item blocks new bookings
const item5 = makeItem('Reg-Item5');
curl('POST', `/items/${item5.id}/unlist`, ownerTok);
const b5 = curl('POST', '/bookings', renter1Tok, { item_id: item5.id, start_date: '2031-09-01', end_date: '2031-09-05' });
check('REG-5: Booking blocked for unlisted item (400)', b5.status === 400);

// ── Test 6: After relist, new bookings allowed again
curl('POST', `/items/${item5.id}/relist`, ownerTok);
const b6 = curl('POST', '/bookings', renter1Tok, { item_id: item5.id, start_date: '2031-09-01', end_date: '2031-09-05' });
check('REG-6: Booking allowed after relist (200)', b6.status === 200);

// ── Test 7: Cannot unlist item with accepted rental
const item7 = makeItem('Reg-Item7');
const b7a = curl('POST', '/bookings', renter1Tok, { item_id: item7.id, start_date: '2031-10-01', end_date: '2031-10-05' });
curl('PATCH', `/bookings/${b7a.data.id}/accept`, ownerTok);
const unlist7 = curl('POST', `/items/${item7.id}/unlist`, ownerTok);
check('REG-7: Cannot unlist item with active accepted rental (400)', unlist7.status === 400);

// ── Test 8: Unlisting auto-cancels pending requests
const item8 = makeItem('Reg-Item8');
const b8a = curl('POST', '/bookings', renter1Tok, { item_id: item8.id, start_date: '2031-11-01', end_date: '2031-11-05' });
const b8b = curl('POST', '/bookings', renter2Tok, { item_id: item8.id, start_date: '2031-11-02', end_date: '2031-11-06' });
curl('POST', `/items/${item8.id}/unlist`, ownerTok);
const myBookings1 = curl('GET', '/bookings/my', renter1Tok).data;
const b8a_status = myBookings1.asRenter.find((b: any) => b.id === b8a.data.id)?.status;
check('REG-8: Pending requests cancelled on unlist', b8a_status === 'cancelled');

console.log(`\n=== Regression: ${p} passed, ${f} failed ===`);
process.exit(f > 0 ? 1 : 0);
