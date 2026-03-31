import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, foreignKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const manga = mysqlTable("manga", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull().unique(),
  description: text("description"),
  coverUrl: varchar("coverUrl", { length: 512 }),
  rating: int("rating").default(0),
  year: int("year"),
  genres: text("genres"), // JSON stringified array
  type: mysqlEnum("type", ["manga", "manhwa", "manhua"]).default("manga"),
  anilistId: int("anilistId").unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Manga = typeof manga.$inferSelect;
export type InsertManga = typeof manga.$inferInsert;

export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  mangaId: int("mangaId").notNull(),
  chapterNumber: varchar("chapterNumber", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }),
  pageCount: int("pageCount").default(0),
  externalId: varchar("externalId", { length: 255 }).unique(),
  source: varchar("source", { length: 50 }), // 'mangadex', 'anilist', etc
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;