import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const readingsTable = pgTable("readings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  imageUri: text("image_uri").notNull().default(''),
  hand: varchar("hand", { length: 10 }).notNull().default('right'),
  dob: varchar("dob", { length: 20 }),
  language: varchar("language", { length: 10 }),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReadingSchema = createInsertSchema(readingsTable).omit({ createdAt: true });
export type InsertReading = z.infer<typeof insertReadingSchema>;
export type Reading = typeof readingsTable.$inferSelect;
