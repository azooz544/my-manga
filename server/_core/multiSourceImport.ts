/**
 * Multi-Source Manga Import System
 * Imports manga from 5 different sources:
 * 1. AniList API
 * 2. MyAnimeList API (via Jikan)
 * 3. Jikan API (direct)
 * 4. MangaDex API
 * 5. Kitsu API
 */

interface MangaSource {
  title: string;
  description?: string;
  coverImage?: string;
  year?: number;
  rating?: number;
  format: 'MANGA' | 'MANHWA' | 'MANHUA';
  sourceId: string;
  sourceType: 'anilist' | 'myanimelist' | 'jikan' | 'mangadex' | 'kitsu';
  externalId?: string;
}

interface ImportStats {
  source: string;
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  duration: number;
}

// ===== AniList Source =====
async function importFromAniList(): Promise<MangaSource[]> {
  console.log('[MultiImport] Starting AniList import...');
  const results: MangaSource[] = [];
  
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

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    if (data.data?.Page?.media) {
      for (const media of data.data.Page.media) {
        results.push({
          title: media.title.english || media.title.romaji,
          description: media.description?.replace(/<[^>]*>/g, ''),
          coverImage: media.coverImage?.large,
          year: media.startDate?.year,
          rating: media.averageScore ? media.averageScore / 10 : undefined,
          format: media.format === 'MANGA' ? 'MANGA' : 'MANGA',
          sourceId: `anilist-${media.id}`,
          sourceType: 'anilist',
          externalId: String(media.id),
        });
      }
    }
  } catch (error) {
    console.error('[MultiImport] AniList error:', error);
  }

  console.log(`[MultiImport] AniList: ${results.length} manga found`);
  return results;
}

// ===== MyAnimeList Source (via Jikan) =====
async function importFromMyAnimeList(): Promise<MangaSource[]> {
  console.log('[MultiImport] Starting MyAnimeList import...');
  const results: MangaSource[] = [];
  
  try {
    const response = await fetch('https://api.jikan.moe/v4/manga?order_by=score&sort=desc&limit=50');
    const data = await response.json();

    if (data.data) {
      for (const manga of data.data) {
        results.push({
          title: manga.title,
          description: manga.synopsis,
          coverImage: manga.images?.jpg?.large_image_url,
          year: manga.published?.from ? new Date(manga.published.from).getFullYear() : undefined,
          rating: manga.score,
          format: 'MANGA',
          sourceId: `mal-${manga.mal_id}`,
          sourceType: 'myanimelist',
          externalId: String(manga.mal_id),
        });
      }
    }
  } catch (error) {
    console.error('[MultiImport] MyAnimeList error:', error);
  }

  console.log(`[MultiImport] MyAnimeList: ${results.length} manga found`);
  return results;
}

// ===== Jikan Direct Source =====
async function importFromJikan(): Promise<MangaSource[]> {
  console.log('[MultiImport] Starting Jikan direct import...');
  const results: MangaSource[] = [];
  
  try {
    const response = await fetch('https://api.jikan.moe/v4/top/manga?type=manga&limit=50');
    const data = await response.json();

    if (data.data) {
      for (const manga of data.data) {
        results.push({
          title: manga.title,
          description: manga.synopsis,
          coverImage: manga.images?.jpg?.large_image_url,
          year: manga.published?.from ? new Date(manga.published.from).getFullYear() : undefined,
          rating: manga.score,
          format: 'MANGA',
          sourceId: `jikan-${manga.mal_id}`,
          sourceType: 'jikan',
          externalId: String(manga.mal_id),
        });
      }
    }
  } catch (error) {
    console.error('[MultiImport] Jikan error:', error);
  }

  console.log(`[MultiImport] Jikan: ${results.length} manga found`);
  return results;
}

// ===== MangaDex Source =====
async function importFromMangaDex(): Promise<MangaSource[]> {
  console.log('[MultiImport] Starting MangaDex import...');
  const results: MangaSource[] = [];
  
  try {
    const response = await fetch(
      'https://api.mangadex.org/manga?limit=50&order[rating]=desc&contentRating[]=safe&contentRating[]=suggestive'
    );
    const data = await response.json();

    if (data.data) {
      for (const manga of data.data) {
        const attributes = manga.attributes;
        const coverRelation = manga.relationships?.find((r: any) => r.type === 'cover_art');
        const coverUrl = coverRelation
          ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRelation.attributes.fileName}`
          : undefined;

        results.push({
          title: attributes.title.en || Object.values(attributes.title)[0] as string,
          description: attributes.description?.en,
          coverImage: coverUrl,
          year: attributes.year,
          rating: attributes.rating ? (attributes.rating.bayesian / 2) : undefined,
          format: attributes.publicationDemographic === 'shounen' ? 'MANGA' : 'MANGA',
          sourceId: `mangadex-${manga.id}`,
          sourceType: 'mangadex',
          externalId: manga.id,
        });
      }
    }
  } catch (error) {
    console.error('[MultiImport] MangaDex error:', error);
  }

  console.log(`[MultiImport] MangaDex: ${results.length} manga found`);
  return results;
}

// ===== Kitsu Source =====
async function importFromKitsu(): Promise<MangaSource[]> {
  console.log('[MultiImport] Starting Kitsu import...');
  const results: MangaSource[] = [];
  
  try {
    const response = await fetch(
      'https://kitsu.io/api/edge/manga?sort=-userCount&page[limit]=50'
    );
    const data = await response.json();

    if (data.data) {
      for (const manga of data.data) {
        const attributes = manga.attributes;
        results.push({
          title: attributes.titles?.en || attributes.canonicalTitle,
          description: attributes.synopsis,
          coverImage: attributes.posterImage?.large,
          year: attributes.startDate ? new Date(attributes.startDate).getFullYear() : undefined,
          rating: attributes.averageRating ? parseInt(attributes.averageRating) / 10 : undefined,
          format: 'MANGA',
          sourceId: `kitsu-${manga.id}`,
          sourceType: 'kitsu',
          externalId: manga.id,
        });
      }
    }
  } catch (error) {
    console.error('[MultiImport] Kitsu error:', error);
  }

  console.log(`[MultiImport] Kitsu: ${results.length} manga found`);
  return results;
}

// ===== Deduplication Logic =====
function deduplicateManga(allManga: MangaSource[]): MangaSource[] {
  const seen = new Map<string, MangaSource>();
  
  for (const manga of allManga) {
    // Normalize title for comparison
    const normalizedTitle = manga.title.toLowerCase().trim();
    
    // Check if we've seen this title before
    const existing = Array.from(seen.values()).find(
      m => m.title.toLowerCase().trim() === normalizedTitle
    );

    if (existing) {
      // Merge data - prefer non-empty values
      if (!existing.description && manga.description) {
        existing.description = manga.description;
      }
      if (!existing.coverImage && manga.coverImage) {
        existing.coverImage = manga.coverImage;
      }
      if (!existing.year && manga.year) {
        existing.year = manga.year;
      }
      if (!existing.rating && manga.rating) {
        existing.rating = manga.rating;
      }
      // Keep track of all sources
      existing.sourceId += `;${manga.sourceId}`;
    } else {
      seen.set(normalizedTitle, manga);
    }
  }

  return Array.from(seen.values());
}

// ===== Main Import Function =====
export async function importFromMultipleSources(): Promise<ImportStats[]> {
  console.log('[MultiImport] Starting multi-source import...');
  const stats: ImportStats[] = [];
  const allManga: MangaSource[] = [];

  // Import from all sources in parallel
  const sources = [
    { name: 'AniList', fn: importFromAniList },
    { name: 'MyAnimeList', fn: importFromMyAnimeList },
    { name: 'Jikan', fn: importFromJikan },
    { name: 'MangaDex', fn: importFromMangaDex },
    { name: 'Kitsu', fn: importFromKitsu },
  ];

  for (const source of sources) {
    const startTime = Date.now();
    try {
      const manga = await source.fn();
      allManga.push(...manga);
      
      stats.push({
        source: source.name,
        total: manga.length,
        imported: manga.length,
        duplicates: 0,
        errors: 0,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      console.error(`[MultiImport] ${source.name} failed:`, error);
      stats.push({
        source: source.name,
        total: 0,
        imported: 0,
        duplicates: 0,
        errors: 1,
        duration: Date.now() - startTime,
      });
    }
  }

  // Deduplicate
  const deduplicatedManga = deduplicateManga(allManga);
  const duplicateCount = allManga.length - deduplicatedManga.length;

  console.log(`[MultiImport] Total manga before dedup: ${allManga.length}`);
  console.log(`[MultiImport] Total manga after dedup: ${deduplicatedManga.length}`);
  console.log(`[MultiImport] Duplicates removed: ${duplicateCount}`);

  return stats;
}

export { MangaSource, ImportStats };
