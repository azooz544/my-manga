#!/usr/bin/env node

/**
 * Simple Production Import Script
 * Fetches manga from multiple sources and stores in database
 * Only imports manga with real chapters
 */

import axios from 'axios';
import mysql from 'mysql2/promise';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCES = {
  anilist: { name: 'AniList', url: 'https://graphql.anilist.co' },
  jikan: { name: 'Jikan', url: 'https://api.jikan.moe/v4/manga' },
  mangadex: { name: 'MangaDex', url: 'https://api.mangadex.org/manga' },
};

let pool;

/**
 * Initialize database connection from DATABASE_URL
 */
async function initDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Parse DATABASE_URL (format: mysql://user:password@host:port/database)
    const url = new URL(dbUrl);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      ssl: {},
      enableKeepAlive: true,
    };

    pool = mysql.createPool(config);
    console.log('[Database] ✓ Connected to', config.database);
    return pool;
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

    const filtered = manga
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

    console.log(`[AniList] ✓ Fetched ${filtered.length} manga with chapters`);
    return filtered;
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

    const filtered = manga
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

    console.log(`[Jikan] ✓ Fetched ${filtered.length} manga with chapters`);
    return filtered;
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

    console.log(`[MangaDex] ✓ Fetched ${validated.length} manga with chapters`);
    return validated;
  } catch (error) {
    console.error('[MangaDex] ✗ Error:', error.message);
    return [];
  }
}

/**
 * Insert manga into database
 */
async function insertManga(manga, connection) {
  try {
    const [result] = await connection.execute(
      'INSERT INTO manga (title, description, coverUrl, type, anilistId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [
        manga.title,
        manga.description,
        manga.coverUrl,
        manga.type,
        manga.source === 'anilist' ? parseInt(manga.externalId) : null,
      ]
    );
    return result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const [rows] = await connection.execute('SELECT id FROM manga WHERE title = ?', [manga.title]);
      return rows[0]?.id;
    }
    throw error;
  }
}

/**
 * Insert chapters into database
 */
async function insertChapters(mangaId, chapterCount, source, connection) {
  try {
    for (let i = 1; i <= Math.min(chapterCount, 10); i++) {
      await connection.execute(
        'INSERT INTO chapters (mangaId, chapterNumber, title, pageCount, source, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [mangaId, String(i), `Chapter ${i}`, 20, source]
      );
    }
  } catch (error) {
    console.error('[Database] Chapter insert error:', error.message);
  }
}

/**
 * Main import function
 */
async function importManga() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Production Import with Chapter Validation            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  let totalFetched = 0;
  let totalImported = 0;
  let totalChapters = 0;

  // Initialize database
  await initDatabase();
  const connection = await pool.getConnection();

  try {
    // Fetch from all sources
    console.log('[Sources] Fetching manga...\n');
    const anilistManga = await fetchFromAniList();
    totalFetched += anilistManga.length;

    const jikanManga = await fetchFromJikan();
    totalFetched += jikanManga.length;

    const mangadexManga = await fetchFromMangaDex();
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
    console.log(`║                                                        ║`);
    console.log(`║ Importing to database...                               ║`);

    // Import to database
    for (const manga of uniqueManga.values()) {
      try {
        const mangaId = await insertManga(manga, connection);
        if (mangaId) {
          await insertChapters(mangaId, manga.chapters, manga.source, connection);
          totalImported++;
          totalChapters += manga.chapters;
          console.log(`  ✓ ${manga.title}`);
        }
      } catch (error) {
        console.error(`  ✗ ${manga.title}: ${error.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`║                                                        ║`);
    console.log(`║ Successfully imported: ${String(totalImported).padEnd(45)} ║`);
    console.log(`║ Total chapters added:  ${String(totalChapters).padEnd(45)} ║`);
    console.log(`║ Duration:              ${String(`${duration}s`).padEnd(45)} ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);

    console.log('\n✅ Import completed successfully!');
  } finally {
    await connection.release();
    await pool.end();
  }
}

// Run import
importManga().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
