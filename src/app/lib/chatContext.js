// Builds the personalisation that is added to the AI chat's system prompt.
// Pure functions (no database access) so they are easy to test.

export const MOOD_WINDOW_DAYS = 7;

// Start of the "last 7 days" window.
export function moodWindowStart(now = new Date()) {
  return new Date(now.getTime() - MOOD_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

// Average of the `mood` values (1 decimal place), or null if there is nothing usable.
export function averageMood(moods) {
  const values = moods
    .filter((m) => m.mood !== null && m.mood !== undefined && m.mood !== '')
    .map((m) => Number(m.mood))
    .filter((n) => Number.isFinite(n));
  if (values.length === 0) return null;
  const average = values.reduce((sum, n) => sum + n, 0) / values.length;
  return Math.round(average * 10) / 10;
}

// Lines of context for the system prompt: 7-day mood average and the latest PHQ-9 / GAD-7 result.
export function buildContextParts(recentMoods, latestAssessment) {
  const parts = [];
  const average = averageMood(recentMoods);
  if (average !== null) {
    parts.push(`User's average mood over the last ${MOOD_WINDOW_DAYS} days: ${average.toFixed(1)}/10`);
  }
  if (latestAssessment) {
    parts.push(
      `Latest assessment: PHQ-9 (depression) score ${latestAssessment.phq9Score}/27 (${latestAssessment.depressionSeverity}), ` +
      `GAD-7 (anxiety) score ${latestAssessment.gad7Score}/21 (${latestAssessment.anxietySeverity})`
    );
  }
  return parts;
}
