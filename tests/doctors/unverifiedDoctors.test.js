import { ObjectId } from 'mongodb';
import { GET as listDoctors, POST as createDoctor } from '../../src/app/api/doctors/route';
import { GET as getDoctor } from '../../src/app/api/doctors/[id]/route';
import { POST as book } from '../../src/app/api/appointments/route';
import { clearDb, closeDb, getDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';

const WORKING_HOURS = Object.fromEntries(
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((d) => [d, { start: '09:00', end: '17:00' }])
);

// A weekday about a week from now (doctors work Monday-Friday)
function nextWeekday() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
const DATE = nextWeekday();

let errorSpy;
let users;
let verified, unverified, legacy; // doctor ids
let unverifiedOwner; // the user who owns the unverified doctor profile

async function seedDoctor(name, fields) {
  const db = await getDb();
  const owner = await createTestUser({ role: 'doctor' });
  const _id = new ObjectId();
  await db.collection('doctors').insertOne({
    _id, userId: owner.user._id, name, email: owner.user.email, specialty: 'Psychiatrist', workingHours: WORKING_HOURS, ...fields,
  });
  return { id: _id.toString(), owner };
}

beforeEach(async () => {
  await clearDb();
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  users = {
    patient: await createTestUser({ role: 'patient' }),
    doctor: await createTestUser({ role: 'doctor' }),
    admin: await createTestUser({ role: 'admin' }),
  };
  verified = (await seedDoctor('Dr Verified', { verified: true })).id;
  const u = await seedDoctor('Dr Unverified', { verified: false });
  unverified = u.id;
  unverifiedOwner = u.owner;
  legacy = (await seedDoctor('Dr Legacy NoFlag', {})).id; // profile with no `verified` field at all
});
afterEach(() => errorSpy.mockRestore());
afterAll(closeDb);

const as = (user, path, init = {}) => makeRequest(path, { ...init, cookies: user ? { token: user.token } : {} });
const names = async (res) => (await res.json()).doctors.map((d) => d.name).sort();

describe('GET /api/doctors', () => {
  it.each(['patient', 'doctor'])('a %s sees only verified doctors', async (role) => {
    const res = await listDoctors(as(users[role], '/api/doctors'));
    expect(res.status).toBe(200);
    expect(await names(res)).toEqual(['Dr Verified']);
  });

  it('an admin sees every doctor (verified, unverified and flag-less)', async () => {
    expect(await names(await listDoctors(as(users.admin, '/api/doctors')))).toEqual(['Dr Legacy NoFlag', 'Dr Unverified', 'Dr Verified']);
  });

  it('the filter also applies with a specialty filter and with a date (availability) request', async () => {
    expect(await names(await listDoctors(as(users.patient, '/api/doctors?specialty=Psychiatrist')))).toEqual(['Dr Verified']);
    const withDate = await listDoctors(as(users.patient, `/api/doctors?date=${DATE}`));
    expect(await names(withDate)).toEqual(['Dr Verified']);
  });

  it('a rejected doctor is not listed', async () => {
    await seedDoctor('Dr Rejected', { verified: false, rejected: true, rejectionReason: 'no licence' });
    expect(await names(await listDoctors(as(users.patient, '/api/doctors')))).toEqual(['Dr Verified']);
  });

  it('still requires authentication', async () => {
    expect((await listDoctors(as(null, '/api/doctors'))).status).toBe(401);
  });
});

describe('GET /api/doctors/[id]', () => {
  const detail = (user, id, query = '') => getDoctor(as(user, `/api/doctors/${id}${query}`), { params: { id } });

  it('a patient can open a verified doctor', async () => {
    const res = await detail(users.patient, verified);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('Dr Verified');
  });

  it.each([['unverified'], ['legacy']])('a patient gets 404 for the %s doctor (profile and availability)', async (which) => {
    const id = which === 'unverified' ? unverified : legacy;
    expect((await detail(users.patient, id)).status).toBe(404);
    expect((await detail(users.patient, id, `?date=${DATE}`)).status).toBe(404);
  });

  it('another doctor also gets 404 for an unverified doctor', async () => {
    expect((await detail(users.doctor, unverified)).status).toBe(404);
  });

  it('an admin can open an unverified doctor', async () => {
    const res = await detail(users.admin, unverified);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('Dr Unverified');
  });

  it('an unverified doctor can open their own profile', async () => {
    expect((await detail(unverifiedOwner, unverified)).status).toBe(200);
  });
});

describe('POST /api/appointments (booking)', () => {
  async function firstSlot(doctorId) {
    const res = await getDoctor(as(users.admin, `/api/doctors/${doctorId}?date=${DATE}`), { params: { id: doctorId } });
    const { availableSlots } = await res.json();
    expect(availableSlots.length).toBeGreaterThan(0);
    return availableSlots[0];
  }
  const bookAs = (user, doctorId, dateTime) =>
    book(as(user, '/api/appointments', { method: 'POST', json: { doctorId, dateTime, notes: 'hi' } }));

  it('booking a verified doctor still works', async () => {
    const res = await bookAs(users.patient, verified, await firstSlot(verified));
    expect([200, 201]).toContain(res.status);
    expect(await (await getDb()).collection('appointments').countDocuments()).toBe(1);
  });

  it.each([['unverified'], ['legacy']])('booking the %s doctor is rejected with 400 and nothing is stored', async (which) => {
    const id = which === 'unverified' ? unverified : legacy;
    const slot = await firstSlot(id); // a perfectly valid slot: only the verification status is wrong
    const res = await bookAs(users.patient, id, slot);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/verified/i);
    expect(await (await getDb()).collection('appointments').countDocuments()).toBe(0);
  });

  it('even an admin cannot book an unverified doctor', async () => {
    const res = await bookAs(users.admin, unverified, await firstSlot(unverified));
    expect(res.status).toBe(400);
  });

  it('a doctor that does not exist is still 404', async () => {
    expect((await bookAs(users.patient, new ObjectId().toString(), new Date().toISOString())).status).toBe(404);
  });

  it('once an admin verifies the doctor, booking works', async () => {
    const slot = await firstSlot(unverified);
    expect((await bookAs(users.patient, unverified, slot)).status).toBe(400);
    await (await getDb()).collection('doctors').updateOne({ _id: new ObjectId(unverified) }, { $set: { verified: true } });
    expect([200, 201]).toContain((await bookAs(users.patient, unverified, slot)).status);
  });
});

describe('doctors created by an admin are verified', () => {
  it('POST /api/doctors sets verified: true, so the new doctor is visible and bookable', async () => {
    const res = await createDoctor(as(users.admin, '/api/doctors', {
      method: 'POST', json: { name: 'Dr Added By Admin', email: 'added@example.com', specialty: 'Therapist' },
    }));
    expect([200, 201]).toContain(res.status);
    const stored = await (await getDb()).collection('doctors').findOne({ name: 'Dr Added By Admin' });
    expect(stored.verified).toBe(true);
    expect(await names(await listDoctors(as(users.patient, '/api/doctors')))).toContain('Dr Added By Admin');
  });
});
