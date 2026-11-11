import { averageMood, buildContextParts, moodWindowStart, MOOD_WINDOW_DAYS } from '../../src/app/lib/chatContext';

describe('moodWindowStart', () => {
  it('is exactly 7 days before "now"', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    expect(MOOD_WINDOW_DAYS).toBe(7);
    expect(moodWindowStart(now).toISOString()).toBe('2026-11-03T12:00:00.000Z');
  });
});

describe('averageMood', () => {
  it('averages the mood values', () => {
    expect(averageMood([{ mood: 8 }, { mood: 6 }, { mood: 4 }])).toBe(6);
  });
  it('rounds to one decimal place', () => {
    expect(averageMood([{ mood: 7 }, { mood: 6 }, { mood: 6 }])).toBe(6.3);
  });
  it('accepts numeric strings (older entries may have stored them that way)', () => {
    expect(averageMood([{ mood: '8' }, { mood: 6 }])).toBe(7);
  });
  it('ignores entries without a usable number', () => {
    expect(averageMood([{ mood: 8 }, { mood: 'abc' }, {}, { mood: null }])).toBe(8);
  });
  it('returns null when there is nothing to average', () => {
    expect(averageMood([])).toBeNull();
    expect(averageMood([{ mood: 'x' }])).toBeNull();
  });
});

describe('buildContextParts', () => {
  it('includes the 7-day average and the latest PHQ-9 / GAD-7 scores', () => {
    const parts = buildContextParts(
      [{ mood: 8 }, { mood: 6 }, { mood: 4 }],
      { phq9Score: 12, depressionSeverity: 'Moderate', gad7Score: 6, anxietySeverity: 'Mild' }
    );
    expect(parts).toEqual([
      "User's average mood over the last 7 days: 6.0/10",
      'Latest assessment: PHQ-9 (depression) score 12/27 (Moderate), GAD-7 (anxiety) score 6/21 (Mild)',
    ]);
  });
  it('omits the mood line when there are no recent moods', () => {
    const parts = buildContextParts([], { phq9Score: 1, depressionSeverity: 'Minimal', gad7Score: 2, anxietySeverity: 'Minimal' });
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatch(/^Latest assessment/);
  });
  it('omits the assessment line when there is no assessment', () => {
    expect(buildContextParts([{ mood: 5 }], null)).toEqual(["User's average mood over the last 7 days: 5.0/10"]);
  });
  it('returns nothing when there is no data at all', () => {
    expect(buildContextParts([], null)).toEqual([]);
  });
});
