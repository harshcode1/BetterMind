import { ObjectId } from 'mongodb';
import * as adminDoctors from '../../src/app/api/admin/doctors/route';
import * as adminVerify from '../../src/app/api/admin/doctors/[id]/verify/route';
import * as forceVerify from '../../src/app/api/admin/doctors/[id]/force-verify/route';
import * as doctors from '../../src/app/api/doctors/route';
import * as doctorById from '../../src/app/api/doctors/[id]/route';
import * as resources from '../../src/app/api/resources/route';
import * as doctorAppointments from '../../src/app/api/doctor/appointments/route';
import * as doctorProfile from '../../src/app/api/doctor/profile/route';
import * as doctorReviews from '../../src/app/api/doctor/reviews/route';
import * as doctorStats from '../../src/app/api/doctor/stats/route';
import { clearDb, closeDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';

jest.mock('next/headers', () => require('../helpers/headersMock'));
const { setCookieJar } = require('../helpers/headersMock');

const ID = new ObjectId().toString();
const idParams = { params: { id: ID } };

// [label, handler, method, path, params, body, roles allowed in]
const ROUTES = [
  ['GET admin/doctors', adminDoctors.GET, 'GET', '/api/admin/doctors', undefined, undefined, ['admin']],
  ['POST admin/doctors/[id]/verify', adminVerify.POST, 'POST', `/api/admin/doctors/${ID}/verify`, idParams, { verified: true }, ['admin']],
  ['POST admin/doctors/[id]/force-verify', forceVerify.POST, 'POST', `/api/admin/doctors/${ID}/force-verify`, idParams, undefined, ['admin']],
  ['POST doctors', doctors.POST, 'POST', '/api/doctors', undefined, {}, ['admin']],
  ['PUT doctors/[id]', doctorById.PUT, 'PUT', `/api/doctors/${ID}`, idParams, {}, ['admin']],
  ['DELETE doctors/[id]', doctorById.DELETE, 'DELETE', `/api/doctors/${ID}`, idParams, undefined, ['admin']],
  ['POST resources', resources.POST, 'POST', '/api/resources', undefined, {}, ['admin']],
  ['POST doctors/[id] (book/review as patient)', doctorById.POST, 'POST', `/api/doctors/${ID}`, idParams, {}, ['patient']],
  ['GET doctor/appointments', doctorAppointments.GET, 'GET', '/api/doctor/appointments', undefined, undefined, ['doctor']],
  ['GET doctor/profile', doctorProfile.GET, 'GET', '/api/doctor/profile', undefined, undefined, ['doctor']],
  ['PUT doctor/profile', doctorProfile.PUT, 'PUT', '/api/doctor/profile', undefined, {}, ['doctor']],
  ['GET doctor/reviews', doctorReviews.GET, 'GET', '/api/doctor/reviews', undefined, undefined, ['doctor']],
  ['POST doctor/reviews', doctorReviews.POST, 'POST', '/api/doctor/reviews', undefined, {}, ['doctor']],
  ['GET doctor/stats', doctorStats.GET, 'GET', '/api/doctor/stats', undefined, undefined, ['doctor']],
];

const ROLES = ['patient', 'doctor', 'admin'];
const users = {};

let errorSpy;
beforeAll(async () => {
  await clearDb();
  for (const role of ROLES) users[role] = await createTestUser({ role });
});
beforeEach(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());
afterAll(closeDb);

async function callAs(role, [, handler, method, path, params, body]) {
  const token = role ? users[role].token : undefined;
  setCookieJar(token ? { token } : {});
  const request = makeRequest(path, { method, json: body, cookies: token ? { token } : {} });
  return params ? handler(request, params) : handler(request);
}

describe.each(ROUTES)('%s', (...route) => {
  const allowed = route[6];

  it('unauthenticated -> 401', async () => {
    expect((await callAs(null, route)).status).toBe(401);
  });

  for (const role of ROLES) {
    if (allowed.includes(role)) {
      it(`${role} (allowed) gets past the role check`, async () => {
        const status = (await callAs(role, route)).status;
        expect([401, 403]).not.toContain(status);
      });
    } else {
      it(`${role} -> 403`, async () => {
        expect((await callAs(role, route)).status).toBe(403);
      });
    }
  }
});

describe('role matrix summary', () => {
  it('patients cannot reach any doctor-only or admin-only route', async () => {
    for (const route of ROUTES.filter((r) => !r[6].includes('patient'))) {
      expect((await callAs('patient', route)).status).toBe(403);
    }
  });
  it('doctors cannot reach any admin-only route', async () => {
    for (const route of ROUTES.filter((r) => r[6].includes('admin'))) {
      expect((await callAs('doctor', route)).status).toBe(403);
    }
  });
});
