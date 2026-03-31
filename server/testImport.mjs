#!/usr/bin/env node

/**
 * Test Import Script - Tests multi-source import without database
 * Shows what data would be imported from each API
 * Usage: node server/testImport.mjs
 */

import axios from 'axios';

const API_TIMEOUT = 30000;

// ===== AniList Import =====
async function importFromAniList() {
  console.log('\n[AniList] Fetching...');
  const results = [];
  
  try {
    const query = `
      query {
        Page(page: 1, perPage: 25) {
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
          rating: media.averageScore ? Math.round(media.averageScore / 10) : null,
          year: media.startDate?.year,
          source: 'anilist',
        });
      }
    }
    console.log(`[AniList] ✓ ${results.length} manga`);
  } catch (error) {
    console.error('[AniList] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== MyAnimeList Import (via Jikan) =====
async function importFromMyAnimeList() {
  console.log('\n[MyAnimeList] Fetching...');
  const results = [];
  
  try {
    const response = await axios.get('https://api.jikan.moe/v4/manga?order_by=score&sort=desc&limit=25', {
      timeout: API_TIMEOUT,
    });

    if (response.data?.data) {
      for (const manga of response.data.data) {
        results.push({
          title: manga.title,
          rating: Math.round(manga.score),
          year: manga.published?.from ? new Date(manga.published.from).getFullYear() : null,
          source: 'myanimelist',
        });
      }
    }
    console.log(`[MyAnimeList] ✓ ${results.length} manga`);
  } catch (error) {
    console.error('[MyAnimeList] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== Jikan Direct Import =====
async function importFromJikan() {
  console.log('\n[Jikan] Fetching...');
  const results = [];
  
  try {
    const response = await axios.get('https://api.jikan.moe/v4/top/manga?type=manga&limit=25', {
      timeout: API_TIMEOUT,
    });

    if (response.data?.data) {
      for (const manga of response.data.data) {
        results.push({
          title: manga.title,
          rating: Math.round(manga.score),
          year: manga.published?.from ? new Date(manga.published.from).getFullYear() : null,
          source: 'jikan',
        });
      }
    }
    console.log(`[Jikan] ✓ ${results.length} manga`);
  } catch (error) {
    console.error('[Jikan] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== MangaDex Import =====
async function importFromMangaDex() {
  console.log('\n[MangaDex] Fetching...');
  const results = [];
  
  try {
    const response = await axios.get(
      'https://api.mangadex.org/manga?limit=25&order[rating]=desc&contentRating[]=safe&contentRating[]=suggestive',
      { timeout: API_TIMEOUT }
    );

    if (response.data?.data) {
      for (const manga of response.data.data) {
        const attributes = manga.attributes;
        results.push({
          title: attributes.title.en || Object.values(attributes.title)[0],
          rating: attributes.rating ? Math.round(attributes.rating.bayesian / 2) : null,
          year: attributes.year,
          source: 'mangadex',
        });
      }
    }
    console.log(`[MangaDex] ✓ ${results.length} manga`);
  } catch (error) {
    console.error('[MangaDex] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== Kitsu Import =====
async function importFromKitsu() {
  console.log('\n[Kitsu] Fetching...');
  const results = [];
  
  try {
    const response = await axios.get(
      'https://kitsu.io/api/edge/manga?sort=-userCount&page[limit]=25',
      { timeout: API_TIMEOUT }
    );

    if (response.data?.data) {
      for (const manga of response.data.data) {
        const attributes = manga.attributes;
        results.push({
          title: attributes.titles?.en || attributes.canonicalTitle,
          rating: attributes.averageRating ? Math.round(parseInt(attributes.averageRating) / 10) : null,
          year: attributes.startDate ? new Date(attributes.startDate).getFullYear() : null,
          source: 'kitsu',
        });
      }
    }
    console.log(`[Kitsu] ✓ ${results.length} manga`);
  } catch (error) {
    console.error('[Kitsu] ✗ Error:', error.message);
  }
  
  return results;
}

// ===== Deduplication =====
function deduplicateManga(allManga) {
  const seen = new Map();
  
  for (const manga of allManga) {
    const normalizedTitle = manga.title.toLowerCase().trim();
    
    if (seen.has(normalizedTitle)) {
      const existing = seen.get(normalizedTitle);
      if (!existing.rating && manga.rating) existing.rating = manga.rating;
      if (!existing.year && manga.year) existing.year = manga.year;
      existing.sources = (existing.sources || [existing.source]).concat(manga.source);
    } else {
      manga.sources = [manga.source];
      seen.set(normalizedTitle, manga);
    }
  }
  
  return Array.from(seen.values());
}

// ===== Main Function =====
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Multi-Source Manga Import - TEST MODE               ║');
  console.log('║   (No database required - preview only)               ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  try {
    // Import from all sources
    console.log('\n[Test] Fetching manga from all sources...');
    const [anilist, mal, jikan, mangadex, kitsu] = await Promise.all([
      importFromAniList(),
      importFromMyAnimeList(),
      importFromJikan(),
      importFromMangaDex(),
      importFromKitsu(),
    ]);
    
    // Combine all results
    const allManga = [...anilist, ...mal, ...jikan, ...mangadex, ...kitsu];
    console.log(`\n[Test] Total manga fetched: ${allManga.length}`);
    
    // Deduplicate
    const uniqueManga = deduplicateManga(allManga);
    
    // Show sample results
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    SAMPLE RESULTS                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total fetched:        ${String(allManga.length).padEnd(40)} ║`);
    console.log(`║ After deduplication:  ${String(uniqueManga.length).padEnd(40)} ║`);
    console.log(`║ Duplicates removed:   ${String(allManga.length - uniqueManga.length).padEnd(40)} ║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║                   TOP 10 MANGA                         ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    
    for (let i = 0; i < Math.min(10, uniqueManga.length); i++) {
      const manga = uniqueManga[i];
      const sources = manga.sources.join(', ');
      const title = manga.title.substring(0, 35).padEnd(35);
      const rating = String(manga.rating || 'N/A').padEnd(5);
      console.log(`║ ${i + 1}. ${title} ⭐${rating} [${sources}] ║`);
    }
    
    console.log('╠════════════════════════════════════════════════════════╣');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`║ Duration: ${String(duration + 's').padEnd(50)} ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    
    console.log('\n✅ Test completed successfully!');
    console.log('📊 Ready to import to database with: node server/importMultipleSources.mjs');
    
  } catch (error) {
    console.error('\n[Error] Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
