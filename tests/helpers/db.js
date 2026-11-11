// Test database helpers. lib/db.js connects using MONGODB_URI (set to the in-memory server in env.js).
import clientPromise from '../../src/app/lib/db';

export async function getDb() {
  const client = await clientPromise;
  return client.db();
}

// Empty every collection between tests so tests stay independent.
export async function clearDb() {
  const db = await getDb();
  const collections = await db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

// Close the shared connection so Jest can exit cleanly.
export async function closeDb() {
  const client = await clientPromise;
  await client.close();
}
