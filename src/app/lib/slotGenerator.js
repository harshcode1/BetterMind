// Generates appointment time slots from a doctor's workingHours + existing DB appointments.
// No external dependencies — works without Google Calendar.

const SLOT_DURATION_MINUTES = 60;
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Parse "HH:MM" into { h, m }
 */
function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return { h, m };
}

/**
 * Generate available slots for a doctor on a given date.
 *
 * @param {object} doctor  - Doctor document from MongoDB (must have workingHours)
 * @param {Date}   date    - The date to generate slots for
 * @param {Array}  booked  - Existing appointments for this doctor on this date (each with dateTime)
 * @returns {string[]}     - ISO strings of available slot start times
 */
export function generateSlots(doctor, date, booked = []) {
  const dayName = DAY_NAMES[new Date(date).getDay()];
  const hours = doctor.workingHours?.[dayName];

  if (!hours || hours.available === false) return [];

  const start = parseTime(hours.start || '09:00');
  const end   = parseTime(hours.end   || '17:00');

  const slots = [];
  const d = new Date(date);
  d.setHours(start.h, start.m, 0, 0);

  const endMs = new Date(date).setHours(end.h, end.m, 0, 0);
  const nowMs  = Date.now();

  const bookedMs = new Set(
    booked.map(a => new Date(a.dateTime).getTime())
  );

  while (d.getTime() + SLOT_DURATION_MINUTES * 60_000 <= endMs) {
    // Skip slots in the past
    if (d.getTime() > nowMs && !bookedMs.has(d.getTime())) {
      slots.push(d.toISOString());
    }
    d.setMinutes(d.getMinutes() + SLOT_DURATION_MINUTES);
  }

  return slots;
}
