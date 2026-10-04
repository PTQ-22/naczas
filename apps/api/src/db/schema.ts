import { pgTable, text } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  familyCode: text('family_code').notNull(),
  payload: text('payload').notNull(), // Stores the full Profile JSON
});

export const records = pgTable('records', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull(),
  status: text('status').notNull(),
  lastDone: text('last_done'),
  bookedFor: text('booked_for'),
  bookedTime: text('booked_time'),
  updatedAt: text('updated_at').notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  familyCode: text('family_code').notNull(),
  createdAt: text('created_at').notNull(),
});
