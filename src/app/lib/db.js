// app/lib/db.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise;

if (!uri) {
  // Defer the error to request time so the build can complete without MONGODB_URI set
  clientPromise = Promise.reject(
    new Error('MONGODB_URI is not defined. Please add it to .env.local')
  );
  // Suppress unhandled rejection — will be thrown when a route awaits clientPromise
  clientPromise.catch(() => {});
} else if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        throw new Error('Database connection failed');
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      throw new Error('Database connection failed');
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;