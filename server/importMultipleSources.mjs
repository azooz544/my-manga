#!/usr/bin/env node

/**
 * Multi-Source Manga Import Script
 * Imports manga from 5 different APIs and stores in database
 * Usage: node server/importMultipleSources.mjs
 */

import axios from 'axios';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ===== Configuration =====
const API_TIMEOUT = 30000;
const BATCH_SIZE = 50;

let dbConnection;

// ===== Database Connection =====
async function connectDB() {
  try {
    const connection = await createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'anime_db',
    });
    console.log('[DB] Connected to database');
    return connection;
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    process.exit(1);
  }
}

// ===== AniList Import =====
async function importFromAniList() {
  console.log('\n[AniList] Starting import...');
  const results = [];
  
  try {
    const query = `
      query {
        Page(page: 1, perPage: 50) {
          media(type: MANGA, sort: POPULARITY_DESC) {
            id
            title { english romaji }
            description
            coverImage { large }
            startDate { year }
            averageScore
            format
          }
        }
      }
    `;

    const response = await axios.post('https://graphql.anilist.co', { query }, {
      timeout: API_TIMEOUT,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data?.data?.Page?.media) {
      for (const media of response.data.data.Page.media) {
        results.push({
          title: media.title.english || media.title.romaji,
          description: media.description?.replace(/<[^>]*>/g, ''),
          coverUrl: media.coverImage?.large,
          year: media.startDate?.year,
          rating: media.averageScore ? Math.round(media.averageScore / 10) : null,
          type: 'manga',
          anilistId: media.id,
          source: 'anilist',
        });
      }
    }
    console.log(`[AniList] ✓ Imported ${results.length} manga`);
  } catch (error) {
    console.error('[AniList] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== MyAnimeList Import (via Jikan) =====
async function importFromMyAnimeList() {
  console.log('\n[MyAnimeList] Starting import...');
  const results = [];
  
  try {
    const response = await axios.get('https://api.jikan.moe/v4/manga?order_by=score&sort=desc&limit=50', {
      timeout: API_TIMEOUT,
    });

    if (response.data?.data) {
      for (const manga of response.data.data) {
        results.push({
          title: manga.title,
          description: manga.synopsis,
          coverUrl: manga.images?.jpg?.large_image_url,
          year: manga.published?.from ? new Date(manga.published.from).getFullYear() : null,
          rating: Math.round(manga.score),
          type: 'manga',
          anilistId: null,
          source: 'myanimelist',
        });
      }
    }
    console.log(`[MyAnimeList] ✓ Imported ${results.length} manga`);
  } catch (error) {
    console.error('[MyAnimeList] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== Jikan Direct Import =====
async function importFromJikan() {
  console.log('\n[Jikan] Starting import...');
  const results = [];
  
  try {
    const response = await axios.get('https://api.jikan.moe/v4/top/manga?type=manga&limit=50', {
      timeout: API_TIMEOUT,
    });

    if (response.data?.data) {
      for (const manga of response.data.data) {
        results.push({
          title: manga.title,
          description: manga.synopsis,
          coverUrl: manga.images?.jpg?.large_image_url,
          year: manga.published?.from ? new Date(manga.published.from).getFullYear() : null,
          rating: Math.round(manga.score),
          type: 'manga',
          anilistId: null,
          source: 'jikan',
        });
      }
    }
    console.log(`[Jikan] ✓ Imported ${results.length} manga`);
  } catch (error) {
    console.error('[Jikan] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== MangaDex Import =====
async function importFromMangaDex() {
  console.log('\n[MangaDex] Starting import...');
  const results = [];
  
  try {
    const response = await axios.get(
      'https://api.mangadex.org/manga?limit=50&order[rating]=desc&contentRating[]=safe&contentRating[]=suggestive',
      { timeout: API_TIMEOUT }
    );

    if (response.data?.data) {
      for (const manga of response.data.data) {
        const attributes = manga.attributes;
        const coverRelation = manga.relationships?.find(r => r.type === 'cover_art');
        const coverUrl = coverRelation
          ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRelation.attributes.fileName}`
          : null;

        results.push({
          title: attributes.title.en || Object.values(attributes.title)[0],
          description: attributes.description?.en,
          coverUrl: coverUrl,
          year: attributes.year,
          rating: attributes.rating ? Math.round(attributes.rating.bayesian / 2) : null,
          type: 'manga',
          anilistId: null,
          source: 'mangadex',
        });
      }
    }
    console.log(`[MangaDex] ✓ Imported ${results.length} manga`);
  } catch (error) {
    console.error('[MangaDex] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== Kitsu Import =====
async function importFromKitsu() {
  console.log('\n[Kitsu] Starting import...');
  const results = [];
  
  try {
    const response = await axios.get(
      'https://kitsu.io/api/edge/manga?sort=-userCount&page[limit]=50',
      { timeout: API_TIMEOUT }
    );

    if (response.data?.data) {
      for (const manga of response.data.data) {
        const attributes = manga.attributes;
        results.push({
          title: attributes.titles?.en || attributes.canonicalTitle,
          description: attributes.synopsis,
          coverUrl: attributes.posterImage?.large,
          year: attributes.startDate ? new Date(attributes.startDate).getFullYear() : null,
          rating: attributes.averageRating ? Math.round(parseInt(attributes.averageRating) / 10) : null,
          type: 'manga',
          anilistId: null,
          source: 'kitsu',
        });
      }
    }
    console.log(`[Kitsu] ✓ Imported ${results.length} manga`);
  } catch (error) {
    console.error('[Kitsu] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== Deduplication =====
function deduplicateManga(allManga) {
  console.log('\n[Dedup] Starting deduplication...');
  const seen = new Map();
  
  for (const manga of allManga) {
    const normalizedTitle = manga.title.toLowerCase().trim();
    
    if (seen.has(normalizedTitle)) {
      const existing = seen.get(normalizedTitle);
      // Merge data
      if (!existing.description && manga.description) existing.description = manga.description;
      if (!existing.coverUrl && manga.coverUrl) existing.coverUrl = manga.coverUrl;
      if (!existing.year && manga.year) existing.year = manga.year;
      if (!existing.rating && manga.rating) existing.rating = manga.rating;
    } else {
      seen.set(normalizedTitle, manga);
    }
  }
  
  const unique = Array.from(seen.values());
  console.log(`[Dedup] ✓ Deduplication complete: ${unique.length} unique manga (${allManga.length - unique.length} duplicates removed)`);
  return unique;
}

// ===== Database Insert =====
async function insertMangaIntoDB(mangaList) {
  console.log('\n[DB] Inserting manga into database...');
  
  try {
    let inserted = 0;
    let skipped = 0;
    
    for (const manga of mangaList) {
      try {
        // Check if already exists
        const [existing] = await dbConnection.execute(
          'SELECT id FROM manga WHERE title = ?',
          [manga.title]
        );
        
        if (existing.length > 0) {
          skipped++;
          continue;
        }
        
        // Insert new manga
        await dbConnection.execute(
          'INSERT INTO manga (title, description, coverUrl, year, rating, type, anilistId) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            manga.title,
            manga.description || null,
            manga.coverUrl || null,
            manga.year || null,
            manga.rating || null,
            manga.type,
            manga.anilistId || null,
          ]
        );
        inserted++;
      } catch (error) {
        console.error(`[DB] Error inserting "${manga.title}":`, error.message);
      }
    }
    
    console.log(`[DB] ✓ Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
    return { inserted, skipped };
  } catch (error) {
    console.error('[DB] Insert failed:', error.message);
    throw error;
  }
}

// ===== Main Function =====
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Multi-Source Manga Import System                    ║');
  console.log('║   Importing from 5 different APIs                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  try {
    // Connect to database
    dbConnection = await connectDB();
    
    // Import from all sources
    console.log('\n[Import] Fetching manga from all sources...');
    const [anilist, mal, jikan, mangadex, kitsu] = await Promise.all([
      importFromAniList(),
      importFromMyAnimeList(),
      importFromJikan(),
      importFromMangaDex(),
      importFromKitsu(),
    ]);
    
    // Combine all results
    const allManga = [...anilist, ...mal, ...jikan, ...mangadex, ...kitsu];
    console.log(`\n[Import] Total manga fetched: ${allManga.length}`);
    
    // Deduplicate
    const uniqueManga = deduplicateManga(allManga);
    
    // Insert into database
    const { inserted, skipped } = await insertMangaIntoDB(uniqueManga);
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    IMPORT SUMMARY                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total fetched:        ${String(allManga.length).padEnd(40)} ║`);
    console.log(`║ After deduplication:  ${String(uniqueManga.length).padEnd(40)} ║`);
    console.log(`║ Inserted to DB:       ${String(inserted).padEnd(40)} ║`);
    console.log(`║ Skipped (existing):   ${String(skipped).padEnd(40)} ║`);
    console.log(`║ Duration:             ${String(duration + 's').padEnd(40)} ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('\n[Error] Import failed:', error.message);
    process.exit(1);
  } finally {
    if (dbConnection) {
      await dbConnection.end();
      console.log('\n[DB] Connection closed');
    }
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
