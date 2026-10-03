import { pgTable, text, integer } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  familyCode: text('family_code').notNull(),
  encryptedName: text('encrypted_name').notNull(),
  gender: text('gender').notNull(),
  birthYear: integer('birth_year').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const records = pgTable('records', {
  // Composite of profile_id and exam_id in practice, but we use a distinct ID or just composite PK.
  // For simplicity, we just use a generated string ID or UUID on client.
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull(),
  status: text('status').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const bets = pgTable('bets', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  amountPln: integer('amount_pln').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  status: text('status').notNull(),
  examIds: text('exam_ids').notNull(), // Stored as JSON string
});
