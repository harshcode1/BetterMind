// Helpers for calling route handlers directly with real NextRequest objects (no HTTP server).
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../src/app/lib/auth';
import { getDb } from './db';

export function makeRequest(path, { method = 'GET', json, cookies = {}, headers = {} } = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  const init = {
    method,
    headers: {
      ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...headers,
    },
  };
  if (json !== undefined) init.body = JSON.stringify(json);
  return new NextRequest(`http://localhost:3000${path}`, init);
}

// Insert a user straight into the test DB and return it with a ready-to-use JWT.
export async function createTestUser({
  role = 'patient',
  email,
  password = 'Password123!',
  verified = false,
  extra = {},
} = {}) {
  const db = await getDb();
  const doc = {
    _id: new ObjectId(),
    name: `Test ${role}`,
    email: email || `${role}-${new ObjectId().toString()}@example.com`,
    password: await bcrypt.hash(password, 4),
    role,
    verified,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  };
  await db.collection('users').insertOne(doc);
  return { user: doc, id: doc._id.toString(), password, token: generateToken(doc) };
}

export async function readJson(response) {
  return response.json();
}
