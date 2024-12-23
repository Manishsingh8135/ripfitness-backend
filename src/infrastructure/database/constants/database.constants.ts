export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export const COLLECTIONS = {
  USERS: 'users',
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  WORKOUT_LOGS: 'workout_logs',
  ACHIEVEMENTS: 'achievements',
  POINTS: 'points',
  LEADERBOARD: 'leaderboard',
} as const;

export const INDEX_OPTIONS = {
  background: true,
} as const;

export const SOFT_DELETE_CONDITIONS = {
  isDeleted: { $ne: true },
  deletedAt: { $exists: false },
} as const;
