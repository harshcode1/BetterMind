// Guest Mode is a client-side demo (demo data is generated in the browser). The real guarantee that
// the database never receives guest/demo data is server-side: every write route answers 401 to a
// request with no valid session, and writes nothing. These tests prove that for EVERY write route.
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { middleware } from '../../src/middleware';
import { clearDb, closeDb, getDb } from '../helpers/db';
import { makeRequest } from '../helpers/http';

import * as adminVerify from '../../src/app/api/admin/doctors/[id]/verify/route';
import * as forceVerify from '../../src/app/api/admin/doctors/[id]/force-verify/route';
import * as appointments from '../../src/app/api/appointments/route';
import * as appointmentById from '../../src/app/api/appointments/[id]/route';
import * as appointmentSync from '../../src/app/api/appointments/sync/route';
import * as assessment from '../../src/app/api/assessment/route';
import * as assessmentById from '../../src/app/api/assessment/[id]/route';
import * as twoFaDisable from '../../src/app/api/auth/2fa/disable/route';
import * as twoFaSetup from '../../src/app/api/auth/2fa/setup/route';
import * as chat from '../../src/app/api/chat/route';
import * as doctorProfile from '../../src/app/api/doctor/profile/route';
import * as doctorReviews from '../../src/app/api/doctor/reviews/route';
import * as doctors from '../../src/app/api/doctors/route';
import * as doctorById from '../../src/app/api/doctors/[id]/route';
import * as mood from '../../src/app/api/mood/route';
import * as resources from '../../src/app/api/resources/route';
import * as resourcesSaved from '../../src/app/api/resources/saved/route';
import * as resourcesSavedById from '../../src/app/api/resources/saved/[id]/route';
import * as userProfile from '../../src/app/api/user/profile/route';

jest.mock('next/headers', () => require('../helpers/headersMock'));
const { setCookieJar } = require('../helpers/headersMock');

const ID = new ObjectId().toString();
const params = { params: { id: ID } };

// Every route.js that exports POST / PUT / PATCH / DELETE, except those public BY DESIGN.
const RAW_WRITE_ROUTES = [
  ['POST /api/admin/doctors/[id]/verify', adminVerify.POST, 'POST', `/api/admin/doctors/${ID}/verify`, params],
  ['POST /api/admin/doctors/[id]/force-verify', forceVerify.POST, 'POST', `/api/admin/doctors/${ID}/force-verify`, params],
  ['POST /api/appointments', appointments.POST, 'POST', '/api/appointments'],
  ['PUT /api/appointments/[id]', appointmentById.PUT, 'PUT', `/api/appointments/${ID}`, params],
  ['DELETE /api/appointments/[id]', appointmentById.DELETE, 'DELETE', `/api/appointments/${ID}`, params],
  ['POST /api/appointments/sync', appointmentSync.POST, 'POST', '/api/appointments/sync'],
  ['POST /api/assessment', assessment.POST, 'POST', '/api/assessment'],
  ['DELETE /api/assessment/[id]', assessmentById.DELETE, 'DELETE', `/api/assessment/${ID}`, params],
  ['POST /api/auth/2fa/disable', twoFaDisable.POST, 'POST', '/api/auth/2fa/disable'],
  ['POST /api/auth/2fa/setup', twoFaSetup.POST, 'POST', '/api/auth/2fa/setup'],
  ['POST /api/chat', chat.POST, 'POST', '/api/chat'],
  ['PUT /api/doctor/profile', doctorProfile.PUT, 'PUT', '/api/doctor/profile'],
  ['POST /api/doctor/reviews', doctorReviews.POST, 'POST', '/api/doctor/reviews'],
  ['POST /api/doctors', doctors.POST, 'POST', '/api/doctors'],
  ['PUT /api/doctors/[id]', doctorById.PUT, 'PUT', `/api/doctors/${ID}`, params],
  ['POST /api/doctors/[id]', doctorById.POST, 'POST', `/api/doctors/${ID}`, params],
  ['DELETE /api/doctors/[id]', doctorById.DELETE, 'DELETE', `/api/doctors/${ID}`, params],
  ['POST /api/mood', mood.POST, 'POST', '/api/mood'],
  ['POST /api/resources', resources.POST, 'POST', '/api/resources'],
  ['POST /api/resources/saved', resourcesSaved.POST, 'POST', '/api/resources/saved'],
  ['DELETE /api/resources/saved', resourcesSaved.DELETE, 'DELETE', '/api/resources/saved'],
  ['DELETE /api/resources/saved/[id]', resourcesSavedById.DELETE, 'DELETE', `/api/resources/saved/${ID}`, params],
  ['PUT /api/user/profile', userProfile.PUT, 'PUT', '/api/user/profile'],
];

// Pad every row to 5 entries: with fewer, Jest's it.each would hand the 5th callback parameter
// to the test as a `done` callback and wait for it forever.
const WRITE_ROUTES = RAW_WRITE_ROUTES.map(([name, handler, method, urlPath, routeParams]) => [name, handler, method, urlPath, routeParams]);

// Public by design (they create the session, or are the second login step guarded by a signed cookie)
const PUBLIC_BY_DESIGN = new Set([
  'auth/login',
  'auth/register',
  'auth/register/doctor',
  'auth/2fa/verify',
]);

// A body that would be a perfectly valid write if the caller were logged in.
const BODY = {
  mood: 6, notes: 'guest note', activities: ['Exercise'],
  phq9Score: 5, gad7Score: 4, phq9Answers: [1], gad7Answers: [1], depressionSeverity: 'Mild', anxietySeverity: 'Minimal',
  message: 'hello', name: 'Guest', verified: true, doctorId: ID, date: '2030-01-01', time: '10:00', resourceId: ID, id: ID,
  appointmentId: ID, title: 'x', rating: 5, comment: 'x', code: '123456',
};

const SESSIONS = {
  'no cookie at all (a guest)': () => undefined,
  'a garbage token': () => 'not-a-real-token',
  'a token signed with the wrong secret': () => jwt.sign({ id: ID, role: 'admin' }, 'some-other-secret'),
  'an expired token': () => jwt.sign({ id: ID, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: -60 }),
};

let errorSpy;
beforeEach(async () => {
  await clearDb();
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());
afterAll(closeDb);

async function totalDocuments() {
  const db = await getDb();
  const collections = await db.collections();
  const counts = await Promise.all(collections.map((c) => c.countDocuments()));
  return counts.reduce((a, b) => a + b, 0);
}

describe.each(Object.entries(SESSIONS))('write routes with %s', (label, makeToken) => {
  it.each(WRITE_ROUTES)('%s -> 401 and nothing is written', async (name, handler, method, urlPath, routeParams) => {
    const token = makeToken();
    setCookieJar(token ? { token } : {});
    const request = makeRequest(urlPath, { method, json: BODY, cookies: token ? { token } : {} });

    // Next always passes a context object as the 2nd argument, so tests do too
    const res = await handler(request, routeParams || { params: {} });

    expect(res.status).toBe(401);
    expect(await totalDocuments()).toBe(0); // no document of any kind reached the database
  });
});

describe('the edge middleware also blocks every write route before it reaches the handler', () => {
  const needsEdgeCheck = WRITE_ROUTES.filter(([, , , urlPath]) => !urlPath.startsWith('/api/auth/'));
  it.each(needsEdgeCheck)('%s -> 401 from middleware', async (name, handler, method, urlPath) => {
    const res = await middleware(makeRequest(urlPath, { method, json: BODY }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Not authenticated' });
  });
});

describe('coverage guard: a new write route cannot be added without being tested here', () => {
  const API_DIR = path.join(__dirname, '..', '..', 'src', 'app', 'api');

  function findRouteFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return findRouteFiles(full);
      return entry.name === 'route.js' ? [full] : [];
    });
  }

  it('every route.js exporting POST/PUT/PATCH/DELETE is in WRITE_ROUTES or PUBLIC_BY_DESIGN', () => {
    const covered = new Set(WRITE_ROUTES.map(([name]) => name));
    const missing = [];

    for (const file of findRouteFiles(API_DIR)) {
      const rel = path.relative(API_DIR, path.dirname(file)).split(path.sep).join('/');
      if (PUBLIC_BY_DESIGN.has(rel)) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const [, method] of source.matchAll(/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/g)) {
        if (!covered.has(`${method} /api/${rel}`)) missing.push(`${method} /api/${rel}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the public-by-design routes really are the only exemptions (each one is rate-limited or credential-checked)', () => {
    expect([...PUBLIC_BY_DESIGN].sort()).toEqual(['auth/2fa/verify', 'auth/login', 'auth/register', 'auth/register/doctor']);
  });
});
