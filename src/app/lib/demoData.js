// Demo data for Guest Mode — lets visitors (e.g. recruiters) explore the full
// product with realistic, populated content without creating an account.
// None of this is persisted; it is generated client-side on demand.

const ACTIVITIES = ['Exercise', 'Work', 'Meditation', 'Social Event', 'Reading', 'Family Time', 'Self-care', 'Outdoor Activity', 'Music', 'Therapy'];

// Deterministic pseudo-random so the demo looks stable across renders.
function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const NOTES = [
  'Felt productive and calm today.',
  'A bit tired but managed a short walk.',
  'Good session with breathing exercises.',
  'Stressful morning, better by evening.',
  'Caught up with a friend — really helped.',
  'Slept well, energy was high.',
  'Quiet day, took time for myself.',
  '',
];

// Mood history matching /api/mood shape: { mood, activities, notes, createdAt }
export function demoMoods(days = 30) {
  const rand = seeded(days * 7 + 13);
  const out = [];
  const n = Math.min(days, 30);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(20, 0, 0, 0);
    // Gentle upward trend (recovery story) with natural variation.
    const base = 4.5 + ((n - i) / n) * 3.5;
    const mood = Math.max(1, Math.min(10, Math.round(base + (rand() - 0.5) * 3)));
    const acts = [];
    const count = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < count; k++) acts.push(ACTIVITIES[Math.floor(rand() * ACTIVITIES.length)]);
    out.push({
      _id: `demo-mood-${i}`,
      mood,
      activities: [...new Set(acts)],
      notes: NOTES[Math.floor(rand() * NOTES.length)],
      createdAt: d.toISOString(),
    });
  }
  return out;
}

function severity(score, type) {
  if (type === 'phq9') {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Moderately Severe';
    return 'Severe';
  }
  if (score <= 4) return 'Minimal';
  if (score <= 9) return 'Mild';
  if (score <= 14) return 'Moderate';
  return 'Severe';
}

// Assessment history matching /api/assessment shape.
export function demoAssessments() {
  const rand = seeded(91);
  const points = [
    { weeksAgo: 8, phq9: 16, gad7: 13 },
    { weeksAgo: 6, phq9: 13, gad7: 11 },
    { weeksAgo: 4, phq9: 10, gad7: 8 },
    { weeksAgo: 2, phq9: 7, gad7: 6 },
    { weeksAgo: 0, phq9: 5, gad7: 4 },
  ];
  return points.map((p, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - p.weeksAgo * 7);
    const phq9Answers = distribute(p.phq9, 9, rand);
    const gad7Answers = distribute(p.gad7, 7, rand);
    return {
      id: `demo-assess-${idx}`,
      _id: `demo-assess-${idx}`,
      date: date.toISOString(),
      phq9Score: p.phq9,
      gad7Score: p.gad7,
      depressionSeverity: severity(p.phq9, 'phq9'),
      anxietySeverity: severity(p.gad7, 'gad7'),
      phq9Answers,
      gad7Answers,
      scores: { phq9: p.phq9, gad7: p.gad7 },
    };
  }).reverse(); // newest first, matching API ordering
}

// Spread a total score across `count` questions (each 0–3) realistically.
function distribute(total, count, rand) {
  const ans = Array(count).fill(0);
  let remaining = total;
  let guard = 0;
  while (remaining > 0 && guard < 200) {
    const i = Math.floor(rand() * count);
    if (ans[i] < 3) { ans[i]++; remaining--; }
    guard++;
  }
  return ans;
}

// Doctors matching /api/doctors shape.
export function demoDoctors() {
  return [
    { _id: 'demo-doc-1', id: 'demo-doc-1', name: 'Dr. Anita Rao',        specialty: 'Psychiatrist',           averageRating: 4.9, reviews: Array(128).fill(0), description: 'Board-certified psychiatrist specializing in anxiety, depression, and mood disorders with a warm, evidence-based approach.', experience: 12, totalPatients: 540 },
    { _id: 'demo-doc-2', id: 'demo-doc-2', name: 'Dr. Marcus Lee',        specialty: 'Clinical Psychologist', averageRating: 4.8, reviews: Array(96).fill(0),  description: 'Focuses on CBT and trauma-informed care. Helps clients build practical coping strategies for daily life.', experience: 9, totalPatients: 410 },
    { _id: 'demo-doc-3', id: 'demo-doc-3', name: 'Dr. Sofia Mendes',      specialty: 'Therapist',             averageRating: 4.7, reviews: Array(74).fill(0),  description: 'Integrative therapist blending mindfulness and talk therapy for stress, burnout, and relationship concerns.', experience: 7, totalPatients: 290 },
    { _id: 'demo-doc-4', id: 'demo-doc-4', name: 'Dr. James Carter',      specialty: 'Counselor',             averageRating: 4.9, reviews: Array(152).fill(0), description: 'Specializes in addiction recovery and motivational counseling. Compassionate, non-judgmental support.', experience: 15, totalPatients: 680 },
    { _id: 'demo-doc-5', id: 'demo-doc-5', name: 'Dr. Priya Nair',        specialty: 'Child Psychiatrist',    averageRating: 4.8, reviews: Array(63).fill(0),  description: 'Dedicated to adolescent and child mental health, including ADHD, anxiety, and developmental support.', experience: 10, totalPatients: 360 },
    { _id: 'demo-doc-6', id: 'demo-doc-6', name: 'Dr. Daniel Kim',        specialty: 'Psychologist',          averageRating: 4.6, reviews: Array(88).fill(0),  description: 'Helps clients navigate depression and life transitions using a strengths-based, collaborative style.', experience: 8, totalPatients: 320 },
  ];
}

// Appointments matching /api/appointments shape.
export function demoAppointments() {
  const mk = (daysFromNow, hour, status, doctorName, specialty, google = false) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    return { _id: `demo-appt-${daysFromNow}-${hour}`, dateTime: d.toISOString(), status, doctorName, specialty, googleEventId: google ? 'demo' : null };
  };
  return [
    mk(2, 10, 'confirmed', 'Dr. Anita Rao', 'Psychiatrist', true),
    mk(5, 15, 'pending', 'Dr. Marcus Lee', 'Clinical Psychologist'),
    mk(-7, 11, 'confirmed', 'Dr. Sofia Mendes', 'Therapist'),
    mk(-21, 14, 'cancelled', 'Dr. James Carter', 'Counselor'),
  ];
}

// Initial chat conversation for guest preview.
export function demoChat() {
  return [
    { sender: 'user', text: "I've been feeling anxious and having trouble sleeping lately." },
    {
      sender: 'bot',
      text: "I'm really sorry you've been feeling this way — anxiety and disrupted sleep often go hand in hand. Let's take it step by step. Have you noticed anything in particular that tends to trigger the anxious feelings, especially around bedtime?",
      recommendation: {
        specialist: 'Psychiatrist or Clinical Psychologist',
        resources: ['Sleep hygiene basics', 'Guided breathing for anxiety', '4-7-8 breathing technique before bed'],
      },
    },
    { sender: 'user', text: "It's usually work stress that keeps my mind racing." },
    {
      sender: 'bot',
      text: "That makes a lot of sense — a racing mind from work stress is one of the most common causes of sleep-onset anxiety. A few things can help: a wind-down routine 30 minutes before bed, jotting tomorrow's worries on paper to 'park' them, and limiting screens. If it persists for more than a couple of weeks, talking to a professional can make a real difference.",
    },
  ];
}
