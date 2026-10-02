import { execSync } from 'child_process';

const BASE = 'http://localhost:3001/api';

function curl(method: string, path: string, token?: string, body?: any) {
  let cmd = `curl -s -w "\\n%{http_code}" -X ${method} "${BASE}${path}"`;
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

const ts = Date.now();
const pw = 'TestPass!123';

function signupAndLogin(name: string, email: string): string {
  curl('POST', '/auth/signup', undefined, { name, email, password: pw });
  return curl('POST', '/auth/login', undefined, { email, password: pw }).data.token;
}

console.log('Setting up isolated test users...');
const ownerTok   = signupAndLogin(`Owner_${ts}`, `o_${ts}@chat.test`);
const renterTok  = signupAndLogin(`Renter_${ts}`, `r_${ts}@chat.test`);
const otherTok   = signupAndLogin(`Other_${ts}`, `x_${ts}@chat.test`);

const item = curl('POST', '/items', ownerTok, {
  title: 'Chat Item', description: 'Test', category: 'Tools',
  price_per_day: 10, deposit_amount: 20, city: 'City', area: 'Area'
}).data;

const booking = curl('POST', '/bookings', renterTok, {
  item_id: item.id, start_date: '2030-01-01', end_date: '2030-01-05'
}).data;

console.log('\n--- Chat Authorization Tests ---');

// Unrelated user
const getOther = curl('GET', `/bookings/${booking.id}/messages`, otherTok);
check('Unrelated user cannot GET (403)', getOther.status === 403);
const postOther = curl('POST', `/bookings/${booking.id}/messages`, otherTok, { body: 'hello' });
check('Unrelated user cannot POST (403)', postOther.status === 403);

// Renter / Owner
const getRenter = curl('GET', `/bookings/${booking.id}/messages`, renterTok);
check('Renter can GET', getRenter.status === 200 && Array.isArray(getRenter.data));

const postRenter = curl('POST', `/bookings/${booking.id}/messages`, renterTok, { body: 'Hi from renter' });
check('Renter can POST in pending state', postRenter.status === 200 && postRenter.data.body === 'Hi from renter');

const getOwner = curl('GET', `/bookings/${booking.id}/messages`, ownerTok);
check('Owner can GET', getOwner.status === 200 && getOwner.data.length === 1);

const postOwner = curl('POST', `/bookings/${booking.id}/messages`, ownerTok, { body: 'Hi from owner' });
check('Owner can POST in pending state', postOwner.status === 200 && postOwner.data.body === 'Hi from owner');

console.log('\n--- Chat Validation Tests ---');
const postEmpty = curl('POST', `/bookings/${booking.id}/messages`, renterTok, { body: '   ' });
check('Empty/whitespace message rejected', postEmpty.status === 400);
const postLong = curl('POST', `/bookings/${booking.id}/messages`, renterTok, { body: 'A'.repeat(1001) });
check('Message >1000 chars rejected', postLong.status === 400);

console.log('\n--- Chat Lifecycle Tests ---');
curl('PATCH', `/bookings/${booking.id}/accept`, ownerTok);
const postAccepted = curl('POST', `/bookings/${booking.id}/messages`, renterTok, { body: 'Accepted msg' });
check('Accepted state allows messages', postAccepted.status === 200);

curl('PATCH', `/bookings/${booking.id}/return`, renterTok);
const postReturned = curl('POST', `/bookings/${booking.id}/messages`, renterTok, { body: 'Returned msg' });
check('Returned state rejects new messages', postReturned.status === 400);

const getReturned = curl('GET', `/bookings/${booking.id}/messages`, renterTok);
check('Historical messages readable after closure', getReturned.status === 200 && getReturned.data.length === 3);

console.log('\n--- Chat Pagination & Ordering Tests ---');
const b2 = curl('POST', '/bookings', renterTok, { item_id: item.id, start_date: '2030-02-01', end_date: '2030-02-05' }).data;

// Send 5 messages sequentially to ensure temporal order
for (let i = 0; i < 5; i++) {
  curl('POST', `/bookings/${b2.id}/messages`, renterTok, { body: `msg ${i}` });
}
const getB2 = curl('GET', `/bookings/${b2.id}/messages?limit=2`, renterTok);
check('Limit pagination works', getB2.data.length === 2 && getB2.data[1].body === 'msg 4');

const getB2Before = curl('GET', `/bookings/${b2.id}/messages?limit=2&before=${getB2.data[0].id}`, renterTok);
check('Before cursor works', getB2Before.data.length === 2 && getB2Before.data[1].body === 'msg 2');

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
