#!/usr/bin/env node

/**
 * Script to import manga and manhwa from AniList API into the database
 * Run with: node import-anilist-manga.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const ANILIST_QUERY = `
  query ($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      media(type: $type, sort: $sort, status: FINISHED) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          medium
        }
        averageScore
        meanScore
        status
        startDate {
          year
          month
          day
        }
        genres
        format
      }
    }
  }
`;

async function fetchFromAniList(page = 1, perPage = 50) {
  try {
    console.log(`[AniList] Fetching page ${page}...`);
    
    const response = await globalThis.fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: {
          page,
          perPage,
          type: 'MANGA',
          sort: ['SCORE_DESC', 'POPULARITY_DESC'],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`AniList GraphQL error: ${data.errors[0].message}`);
    }

    return data.data.Page.media || [];
  } catch (error) {
    console.error('[AniList] Error:', error);
    throw error;
  }
}

function processManga(item, type = 'manga') {
  const title = item.title.english || item.title.romaji || item.title.native || 'Unknown';
  const description = item.description || 'No description available';
  const coverUrl = item.coverImage?.large || item.coverImage?.medium || '';
  const rating = Math.round((item.averageScore || item.meanScore || 0) / 10);
  const year = item.startDate?.year || new Date().getFullYear();
  const genres = item.genres || [];

  // Clean description
  const cleanDescription = description
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .substring(0, 500);

  return {
    title,
    description: cleanDescription,
    coverUrl,
    rating,
    year,
    genres: JSON.stringify(genres),
    type,
    anilistId: item.id,
  };
}

async function importToDatabase(mangaList) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    let importedCount = 0;
    let skippedCount = 0;

    for (const item of mangaList) {
      try {
        const query = `
          INSERT INTO manga (title, description, coverUrl, rating, year, genres, type, anilistId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          coverUrl = VALUES(coverUrl),
          rating = VALUES(rating),
          year = VALUES(year),
          genres = VALUES(genres),
          type = VALUES(type),
          updatedAt = NOW()
        `;

        await connection.execute(query, [
          item.title,
          item.description,
          item.coverUrl,
          item.rating,
          item.year,
          item.genres,
          item.type,
          item.anilistId,
        ]);

        console.log(`✅ ${item.title}`);
        importedCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  ${item.title} (already exists)`);
          skippedCount++;
        } else {
          console.error(`❌ Error importing ${item.title}:`, error.message);
          skippedCount++;
        }
      }
    }

    console.log(`\n✨ Import complete!`);
    console.log(`✅ Imported: ${importedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📊 Total: ${importedCount + skippedCount}`);

    return importedCount;
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    console.log('🚀 Starting manga import from AniList...\n');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const allManga = [];
    const limit = 100;
    const perPage = 50;
    const pages = Math.ceil(limit / perPage);

    // Fetch manga
    for (let page = 1; page <= pages; page++) {
      const items = await fetchFromAniList(page, perPage);
      const processed = items.map((item) => processManga(item, 'manga'));
      allManga.push(...processed);
      if (allManga.length >= limit) break;
    }

    console.log(`\n📚 Fetched ${allManga.length} manga from AniList`);
    console.log('💾 Importing into database...\n');

    await importToDatabase(allManga.slice(0, limit));
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
