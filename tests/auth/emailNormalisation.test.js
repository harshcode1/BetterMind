import { POST as registerPost } from '../../src/app/api/auth/register/route';
import { POST as registerDoctorPost } from '../../src/app/api/auth/register/doctor/route';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { clearDb, closeDb, getDb } from '../helpers/db';
import { makeRequest } from '../helpers/http';

let ipCounter = 0;
const ip = () => ({ 'x-forwarded-for': `198.19.0.${(ipCounter += 1)}` });
let errorSpy;
beforeEach(async () => {
  await clearDb();
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
  console.log.mockRestore();
});
afterAll(closeDb);

const PASSWORD = 'Password123!';
const register = (email, extra = {}) =>
  registerPost(makeRequest('/api/auth/register', { method: 'POST', json: { name: 'John', email, password: PASSWORD, ...extra }, headers: ip() }));
const registerDoctor = (email, licenseNumber = 'LIC-1') =>
  registerDoctorPost(makeRequest('/api/auth/register/doctor', {
    method: 'POST', headers: ip(),
    json: { name: 'Dr Who', email, password: PASSWORD, specialty: 'Psychiatrist', credentials: 'MD', licenseNumber, phone: '123' },
  }));
const login = (email) =>
  loginPost(makeRequest('/api/auth/login', { method: 'POST', json: { email, password: PASSWORD }, headers: ip() }));

describe('patient registration normalises the email (trim + lowercase)', () => {
  it('stores "John@X.com" as "john@x.com" and returns it lower-cased', async () => {
    const res = await register('John@X.com');
    expect(res.status).toBe(200);
    expect((await res.json()).user.email).toBe('john@x.com');
    const stored = await (await getDb()).collection('users').findOne({});
    expect(stored.email).toBe('john@x.com');
  });

  it('trims surrounding whitespace', async () => {
    await register('  John@X.com  ');
    expect((await (await getDb()).collection('users').findOne({})).email).toBe('john@x.com');
  });

  it.each(['john@x.com', 'JOHN@X.COM', 'John@X.com', '  JoHn@x.CoM '])('after registering as "John@X.com", logging in as %j works', async (loginEmail) => {
    await register('John@X.com');
    const res = await login(loginEmail);
    expect(res.status).toBe(200);
    expect(res.cookies.get('token').value).toBeTruthy();
  });

  it('the same address in a different case is a duplicate, not a second account', async () => {
    expect((await register('John@X.com')).status).toBe(200);
    const again = await register('JOHN@x.com');
    expect(again.status).toBe(400);
    expect(await (await getDb()).collection('users').countDocuments()).toBe(1);
  });

  it('an email that is invalid after trimming is still rejected', async () => {
    expect((await register('not an email')).status).toBe(400);
    expect((await register('   ')).status).toBe(400);
    expect(await (await getDb()).collection('users').countDocuments()).toBe(0);
  });

  it('a non-string email is rejected with 400, not a server error', async () => {
    expect((await register({ $ne: null })).status).toBe(400);
    expect((await register(['a@b.co'])).status).toBe(400);
  });
});

describe('doctor registration normalises the email too', () => {
  it('stores it lower-cased on both the user and the doctor profile, and the doctor can log in with any case', async () => {
    const res = await registerDoctor('Dr.Who@Clinic.COM');
    expect(res.status).toBe(200);
    const db = await getDb();
    expect((await db.collection('users').findOne({})).email).toBe('dr.who@clinic.com');
    expect((await db.collection('doctors').findOne({})).email).toBe('dr.who@clinic.com');

    for (const loginEmail of ['dr.who@clinic.com', 'DR.WHO@CLINIC.COM']) {
      const loginRes = await login(loginEmail);
      expect(loginRes.status).toBe(200);
      expect((await loginRes.json()).user.role).toBe('doctor');
    }
  });

  it('a case variant of an existing email is rejected as a duplicate', async () => {
    await registerDoctor('Dr.Who@Clinic.COM', 'LIC-1');
    const res = await registerDoctor('dr.who@clinic.com', 'LIC-2');
    expect(res.status).toBe(400);
    expect(await (await getDb()).collection('users').countDocuments()).toBe(1);
  });

  it('a patient and a doctor cannot share an address that differs only by case', async () => {
    await register('Shared@X.com');
    expect((await registerDoctor('SHARED@x.com')).status).toBe(400);
  });
});

describe('login', () => {
  it('rejects non-string / missing emails with 400', async () => {
    for (const email of [undefined, null, 5, { $gt: '' }]) {
      const res = await loginPost(makeRequest('/api/auth/login', { method: 'POST', json: { email, password: PASSWORD }, headers: ip() }));
      expect(res.status).toBe(400);
    }
  });

  it('the returned user email is the normalised one', async () => {
    await register('John@X.com');
    const body = await (await login('JOHN@X.COM')).json();
    expect(body.user.email).toBe('john@x.com');
  });
});
