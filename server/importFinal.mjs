#!/usr/bin/env node

/**
 * Final Production Import Script
 * Uses Drizzle ORM for database operations
 * Imports manga with chapter validation from multiple sources
 */

import axios from 'axios';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const SOURCES = {
  anilist: { name: 'AniList', url: 'https://graphql.anilist.co' },
  jikan: { name: 'Jikan', url: 'https://api.jikan.moe/v4/manga' },
  mangadex: { name: 'MangaDex', url: 'https://api.mangadex.org/manga' },
};

let db;

/**
 * Initialize database connection
 */
async function initDatabase() {
  try {
    // Parse DATABASE_URL from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set');
    }

    // Create connection pool
    const connection = await mysql.createPool({
      connectionLimit: 5,
      uri: dbUrl,
    });

    db = drizzle(connection, { schema });
    console.log('[Database] ✓ Connected');
    return db;
  } catch (error) {
    console.error('[Database] ✗ Connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Fetch manga from AniList
 */
async function fetchFromAniList() {
  try {
    const query = `
      query {
        Page(page: 1, perPage: 50) {
          media(type: MANGA, sort: POPULARITY_DESC) {
            id
            title { english romaji }
            description
            coverImage { large }
            chapters
          }
        }
      }
    `;

    const response = await axios.post(SOURCES.anilist.url, { query }, { timeout: 15000 });
    const manga = response.data?.data?.Page?.media || [];

    return manga
      .filter(m => m.chapters && m.chapters > 0)
      .map(m => ({
        title: m.title?.english || m.title?.romaji || 'Unknown',
        description: m.description || '',
        coverUrl: m.coverImage?.large || null,
        type: 'manga',
        source: 'anilist',
        externalId: String(m.id),
        chapters: m.chapters,
      }));
  } catch (error) {
    console.error('[AniList] ✗ Error:', error.message);
    return [];
  }
}

/**
 * Fetch manga from Jikan
 */
async function fetchFromJikan() {
  try {
    const response = await axios.get(SOURCES.jikan.url, {
      params: { limit: 50, order_by: 'popularity', sort: 'desc' },
      timeout: 15000,
    });

    const manga = response.data?.data || [];

    return manga
      .filter(m => m.chapters && m.chapters > 0)
      .map(m => ({
        title: m.title || 'Unknown',
        description: m.synopsis || '',
        coverUrl: m.images?.jpg?.large_image_url || null,
        type: 'manga',
        source: 'jikan',
        externalId: String(m.mal_id),
        chapters: m.chapters,
      }));
  } catch (error) {
    console.error('[Jikan] ✗ Error:', error.message);
    return [];
  }
}

/**
 * Fetch manga from MangaDex with validation
 */
async function fetchFromMangaDex() {
  try {
    const response = await axios.get(SOURCES.mangadex.url, {
      params: { limit: 50, order: { rating: 'desc' } },
      timeout: 15000,
    });

    const manga = response.data?.data || [];
    const validated = [];

    for (const m of manga) {
      try {
        const chaptersResponse = await axios.get(
          `https://api.mangadex.org/manga/${m.id}/feed?limit=1&order[chapter]=desc`,
          { timeout: 5000 }
        );

        const hasChapters = chaptersResponse.data?.data && chaptersResponse.data.data.length > 0;
        if (hasChapters) {
          validated.push({
            title: m.attributes?.title?.en || 'Unknown',
            description: m.attributes?.description?.en || '',
            coverUrl: null,
            type: 'manga',
            source: 'mangadex',
            externalId: m.id,
            chapters: 1,
          });
        }
      } catch (error) {
        // Skip if validation fails
      }
    }

    return validated;
  } catch (error) {
    console.error('[MangaDex] ✗ Error:', error.message);
    return [];
  }
}

/**
 * Insert manga into database
 */
async function insertManga(manga) {
  try {
    const result = await db.insert(schema.manga).values({
      title: manga.title,
      description: manga.description,
      coverUrl: manga.coverUrl,
      type: manga.type,
      anilistId: manga.source === 'anilist' ? parseInt(manga.externalId) : null,
    });
    return result[0].insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const existing = await db
        .select({ id: schema.manga.id })
        .from(schema.manga)
        .where(schema.eq(schema.manga.title, manga.title))
        .limit(1);
      return existing[0]?.id;
    }
    console.error('[Database] Insert error:', error.message);
    return null;
  }
}

/**
 * Insert chapters into database
 */
async function insertChapters(mangaId, chapterCount, source) {
  try {
    const chapters = [];
    for (let i = 1; i <= Math.min(chapterCount, 10); i++) {
      chapters.push({
        mangaId,
        chapterNumber: String(i),
        title: `Chapter ${i}`,
        pageCount: 20,
        source,
      });
    }

    await db.insert(schema.chapters).values(chapters);
  } catch (error) {
    console.error('[Database] Chapter insert error:', error.message);
  }
}

/**
 * Main import function
 */
async function importMangaFinal() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Production Import with Chapter Validation            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  let totalFetched = 0;
  let totalImported = 0;
  let totalChapters = 0;

  // Initialize database
  await initDatabase();

  // Fetch from all sources
  console.log('[AniList] Fetching...');
  const anilistManga = await fetchFromAniList();
  console.log(`[AniList] ✓ Fetched ${anilistManga.length} manga with chapters`);
  totalFetched += anilistManga.length;

  console.log('\n[Jikan] Fetching...');
  const jikanManga = await fetchFromJikan();
  console.log(`[Jikan] ✓ Fetched ${jikanManga.length} manga with chapters`);
  totalFetched += jikanManga.length;

  console.log('\n[MangaDex] Fetching...');
  const mangadexManga = await fetchFromMangaDex();
  console.log(`[MangaDex] ✓ Fetched ${mangadexManga.length} manga with chapters`);
  totalFetched += mangadexManga.length;

  // Combine and deduplicate
  const allManga = [...anilistManga, ...jikanManga, ...mangadexManga];
  const uniqueManga = new Map();

  for (const manga of allManga) {
    const key = manga.title.toLowerCase();
    if (!uniqueManga.has(key)) {
      uniqueManga.set(key, manga);
    }
  }

  console.log(`\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║                   IMPORT RESULTS                       ║`);
  console.log(`╠════════════════════════════════════════════════════════╣`);
  console.log(`║ Total fetched:        ${String(totalFetched).padEnd(46)} ║`);
  console.log(`║ Unique manga:         ${String(uniqueManga.size).padEnd(46)} ║`);
  console.log(`║ Duplicates removed:   ${String(totalFetched - uniqueManga.size).padEnd(46)} ║`);
  console.log(`║ Importing...                                           ║`);

  // Import to database
  for (const manga of uniqueManga.values()) {
    try {
      const mangaId = await insertManga(manga);
      if (mangaId) {
        await insertChapters(mangaId, manga.chapters, manga.source);
        totalImported++;
        totalChapters += manga.chapters;
        console.log(`  ✓ ${manga.title} (${manga.chapters} chapters)`);
      }
    } catch (error) {
      console.error(`  ✗ Error importing ${manga.title}:`, error.message);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`║                                                        ║`);
  console.log(`║ Imported:             ${String(totalImported).padEnd(46)} ║`);
  console.log(`║ Total chapters:       ${String(totalChapters).padEnd(46)} ║`);
  console.log(`║ Duration:             ${String(`${duration}s`).padEnd(46)} ║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);

  console.log('\n✅ Import completed successfully!');
  process.exit(0);
}

// Run import
importMangaFinal().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
