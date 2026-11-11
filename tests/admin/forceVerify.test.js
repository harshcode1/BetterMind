import { ObjectId } from 'mongodb';
import * as forceVerifyModule from '../../src/app/api/admin/doctors/[id]/force-verify/route';
import { clearDb, closeDb, getDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';

jest.mock('next/headers', () => require('../helpers/headersMock'));
const { setCookieJar } = require('../helpers/headersMock');

let errorSpy;
beforeEach(async () => {
  await clearDb();
  setCookieJar({});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());
afterAll(closeDb);

async function seedDoctor() {
  const doctorUser = await createTestUser({ role: 'doctor', verified: false });
  const db = await getDb();
  const doctorId = new ObjectId();
  await db.collection('doctors').insertOne({
    _id: doctorId, userId: doctorUser.user._id, name: 'Dr Test', email: doctorUser.user.email,
    specialty: 'Psychiatrist', verified: false,
  });
  return { doctorId: doctorId.toString(), doctorUserId: doctorUser.user._id };
}

async function stateOf(doctorId, userId) {
  const db = await getDb();
  const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(doctorId) });
  const user = await db.collection('users').findOne({ _id: userId });
  return { doctorVerified: doctor.verified, userVerified: user.verified };
}

const call = (doctorId, token, method = 'POST') =>
  forceVerifyModule.POST(
    makeRequest(`/api/admin/doctors/${doctorId}/force-verify`, { method, cookies: token ? { token } : {} }),
    { params: { id: doctorId } }
  );

describe('force-verify is a state change, so it is a POST and only a POST', () => {
  it('exports POST and no GET (a GET now gets 405 from Next)', () => {
    expect(typeof forceVerifyModule.POST).toBe('function');
    expect(forceVerifyModule.GET).toBeUndefined();
  });
});

describe('POST /api/admin/doctors/[id]/force-verify', () => {
  it('unauthenticated -> 401 and nothing changes', async () => {
    const { doctorId, doctorUserId } = await seedDoctor();
    const res = await call(doctorId, null);
    expect(res.status).toBe(401);
    expect(await stateOf(doctorId, doctorUserId)).toEqual({ doctorVerified: false, userVerified: false });
  });

  it.each(['patient', 'doctor'])('a %s -> 403 and nothing changes', async (role) => {
    const { doctorId, doctorUserId } = await seedDoctor();
    const caller = await createTestUser({ role });
    setCookieJar({ token: caller.token });
    const res = await call(doctorId, caller.token);
    expect(res.status).toBe(403);
    expect(await stateOf(doctorId, doctorUserId)).toEqual({ doctorVerified: false, userVerified: false });
  });

  it('a doctor cannot verify themselves', async () => {
    const db = await getDb();
    const { doctorId, doctorUserId } = await seedDoctor();
    const self = await db.collection('users').findOne({ _id: doctorUserId });
    const { generateToken } = require('../../src/app/lib/auth');
    const selfToken = generateToken(self);
    setCookieJar({ token: selfToken });
    expect((await call(doctorId, selfToken)).status).toBe(403);
    expect(await stateOf(doctorId, doctorUserId)).toEqual({ doctorVerified: false, userVerified: false });
  });

  it('an admin verifies the doctor and the doctor user', async () => {
    const { doctorId, doctorUserId } = await seedDoctor();
    const admin = await createTestUser({ role: 'admin' });
    setCookieJar({ token: admin.token });
    const res = await call(doctorId, admin.token);
    expect(res.status).toBe(200);
    expect(await stateOf(doctorId, doctorUserId)).toEqual({ doctorVerified: true, userVerified: true });
  });

  it('the response does not leak the user record (password hash, 2FA secret)', async () => {
    const { doctorId } = await seedDoctor();
    const admin = await createTestUser({ role: 'admin' });
    setCookieJar({ token: admin.token });
    const text = await (await call(doctorId, admin.token)).text();
    expect(text).not.toMatch(/password|twoFactorAuth|secret|\$2[aby]\$/i);
  });

  it('invalid id -> 400, unknown doctor -> 404', async () => {
    const admin = await createTestUser({ role: 'admin' });
    setCookieJar({ token: admin.token });
    expect((await call('not-an-id', admin.token)).status).toBe(400);
    expect((await call(new ObjectId().toString(), admin.token)).status).toBe(404);
  });
});
