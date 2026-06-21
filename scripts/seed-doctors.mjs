import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

const doctors = [
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@bettermind.dev',
    specialty: 'Psychiatrist',
    bio: 'Board-certified psychiatrist with 12 years of experience treating anxiety, depression, and mood disorders. Former faculty at AIIMS Delhi.',
    credentials: 'MD Psychiatry, AIIMS Delhi | Fellowship, Johns Hopkins',
    licenseNumber: 'MCI-PSY-2847',
    phone: '+91 98100 11223',
    address: 'Connaught Place, New Delhi',
    averageRating: 4.9,
    reviewCount: 134,
    experience: 12,
    verified: true,
    workingHours: {
      monday:    { start: '09:00', end: '17:00', available: true },
      tuesday:   { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday:  { start: '09:00', end: '17:00', available: true },
      friday:    { start: '09:00', end: '13:00', available: true },
      saturday:  { start: '10:00', end: '14:00', available: true },
      sunday:    { available: false },
    },
  },
  {
    name: 'Dr. Arjun Mehta',
    email: 'arjun.mehta@bettermind.dev',
    specialty: 'Psychologist',
    bio: 'Clinical psychologist specialising in CBT and trauma-focused therapy. 9 years helping patients overcome PTSD, OCD and chronic stress.',
    credentials: 'PhD Clinical Psychology, Tata Institute | MSc Psychology, Delhi University',
    licenseNumber: 'RCI-CLN-5512',
    phone: '+91 98200 44556',
    address: 'Bandra West, Mumbai',
    averageRating: 4.8,
    reviewCount: 98,
    experience: 9,
    verified: true,
    workingHours: {
      monday:    { start: '10:00', end: '18:00', available: true },
      tuesday:   { start: '10:00', end: '18:00', available: true },
      wednesday: { available: false },
      thursday:  { start: '10:00', end: '18:00', available: true },
      friday:    { start: '10:00', end: '18:00', available: true },
      saturday:  { start: '10:00', end: '14:00', available: true },
      sunday:    { available: false },
    },
  },
  {
    name: 'Dr. Neha Gupta',
    email: 'neha.gupta@bettermind.dev',
    specialty: 'Therapist',
    bio: 'Licensed therapist focused on relationship counselling, grief support, and mindfulness-based interventions. Warm, person-centred approach.',
    credentials: 'MPhil Psychiatric Social Work, NIMHANS | Certified Mindfulness Instructor',
    licenseNumber: 'RCI-PSW-7731',
    phone: '+91 98300 77889',
    address: 'Indiranagar, Bengaluru',
    averageRating: 4.7,
    reviewCount: 76,
    experience: 7,
    verified: true,
    workingHours: {
      monday:    { start: '09:00', end: '17:00', available: true },
      tuesday:   { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday:  { start: '09:00', end: '17:00', available: true },
      friday:    { start: '09:00', end: '17:00', available: true },
      saturday:  { available: false },
      sunday:    { available: false },
    },
  },
  {
    name: 'Dr. Rohan Kapoor',
    email: 'rohan.kapoor@bettermind.dev',
    specialty: 'Neurologist',
    bio: 'Neurologist with a sub-specialty in neuropsychiatry. Treats patients with overlapping neurological and mental health conditions including epilepsy-related mood disorders.',
    credentials: 'DM Neurology, PGI Chandigarh | MBBS, MAMC Delhi',
    licenseNumber: 'MCI-NEU-3301',
    phone: '+91 98400 22334',
    address: 'Sector 17, Chandigarh',
    averageRating: 4.8,
    reviewCount: 112,
    experience: 15,
    verified: true,
    workingHours: {
      monday:    { start: '08:00', end: '14:00', available: true },
      tuesday:   { start: '08:00', end: '14:00', available: true },
      wednesday: { start: '08:00', end: '14:00', available: true },
      thursday:  { start: '08:00', end: '14:00', available: true },
      friday:    { start: '08:00', end: '14:00', available: true },
      saturday:  { available: false },
      sunday:    { available: false },
    },
  },
  {
    name: 'Dr. Aisha Patel',
    email: 'aisha.patel@bettermind.dev',
    specialty: 'Child Psychiatrist',
    bio: 'Paediatric psychiatrist with expertise in ADHD, autism spectrum disorders and childhood anxiety. 10 years of clinical and academic practice.',
    credentials: 'MD Psychiatry (Child), KEM Mumbai | Fellowship Child Psychiatry, NIMHANS',
    licenseNumber: 'MCI-CPY-4490',
    phone: '+91 98500 55667',
    address: 'Juhu, Mumbai',
    averageRating: 4.9,
    reviewCount: 89,
    experience: 10,
    verified: true,
    workingHours: {
      monday:    { start: '10:00', end: '16:00', available: true },
      tuesday:   { start: '10:00', end: '16:00', available: true },
      wednesday: { start: '10:00', end: '16:00', available: true },
      thursday:  { available: false },
      friday:    { start: '10:00', end: '16:00', available: true },
      saturday:  { start: '10:00', end: '13:00', available: true },
      sunday:    { available: false },
    },
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh@bettermind.dev',
    specialty: 'Addiction Specialist',
    bio: 'Specialist in substance use disorders and behavioural addictions. Uses motivational interviewing and evidence-based rehabilitation protocols.',
    credentials: 'MD Psychiatry, BHU Varanasi | Certified Addiction Medicine Specialist',
    licenseNumber: 'MCI-ADD-6612',
    phone: '+91 98600 88990',
    address: 'Hazratganj, Lucknow',
    averageRating: 4.6,
    reviewCount: 54,
    experience: 8,
    verified: true,
    workingHours: {
      monday:    { start: '11:00', end: '19:00', available: true },
      tuesday:   { start: '11:00', end: '19:00', available: true },
      wednesday: { start: '11:00', end: '19:00', available: true },
      thursday:  { start: '11:00', end: '19:00', available: true },
      friday:    { start: '11:00', end: '17:00', available: true },
      saturday:  { available: false },
      sunday:    { available: false },
    },
  },
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    // Upsert each doctor by email so re-runs are safe
    for (const doc of doctors) {
      const password = await bcrypt.hash('BetterMind@2025', 10);

      // Upsert a user account for the doctor
      const userResult = await db.collection('users').findOneAndUpdate(
        { email: doc.email },
        {
          $setOnInsert: {
            name: doc.name,
            email: doc.email,
            password,
            role: 'doctor',
            verified: true,
            createdAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      const userId = userResult._id ?? userResult.value?._id;

      // Upsert the doctor profile
      await db.collection('doctors').updateOne(
        { email: doc.email },
        {
          $set: {
            ...doc,
            userId,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      console.log(`✓ ${doc.name} (${doc.specialty})`);
    }

    console.log('\n✅ Seeded 6 doctors successfully.');
  } finally {
    await client.close();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
