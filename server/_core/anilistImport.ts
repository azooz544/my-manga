/**
 * AniList API Integration for importing Manga and Manhwa
 * Fetches top-rated manga and manhwa from AniList and prepares data for database import
 */

interface AniListManga {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  description?: string;
  coverImage?: {
    large?: string;
    medium?: string;
  };
  averageScore?: number;
  meanScore?: number;
  status?: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  genres?: string[];
  type?: string; // MANGA or MANHWA
  format?: string; // MANGA, ONE_SHOT, etc.
}

interface ProcessedManga {
  title: string;
  description: string;
  coverUrl: string;
  rating: number;
  year: number;
  genres: string[];
  type: 'manga' | 'manhwa' | 'manhua';
  anilistId: number;
}

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

export async function fetchAniListManga(
  page: number = 1,
  perPage: number = 50
): Promise<ProcessedManga[]> {
  try {
    console.log(
      `[AniListImport] Fetching manga from AniList (page: ${page}, perPage: ${perPage})`
    );

    const response = await fetch('https://graphql.anilist.co', {
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

    const manga = data.data.Page.media as AniListManga[];
    console.log(
      `[AniListImport] Fetched ${manga.length} manga from AniList`
    );

    return manga.map((item) => processMangaData(item));
  } catch (error) {
    console.error('[AniListImport] Error fetching manga:', error);
    throw error;
  }
}

export async function fetchAniListManhwa(
  page: number = 1,
  perPage: number = 50
): Promise<ProcessedManga[]> {
  try {
    console.log(
      `[AniListImport] Fetching manhwa from AniList (page: ${page}, perPage: ${perPage})`
    );

    const response = await fetch('https://graphql.anilist.co', {
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

    const manga = data.data.Page.media as AniListManga[];
    // Filter for Korean manhwa
    const manhwa = manga.filter(
      (m) =>
        m.format === 'MANGA' &&
        m.description &&
        (m.description.toLowerCase().includes('korean') ||
          m.description.toLowerCase().includes('manhwa'))
    );

    console.log(
      `[AniListImport] Fetched ${manhwa.length} manhwa from AniList`
    );

    return manhwa.map((item) => processMangaData(item, 'manhwa'));
  } catch (error) {
    console.error('[AniListImport] Error fetching manhwa:', error);
    throw error;
  }
}

function processMangaData(
  item: AniListManga,
  type: 'manga' | 'manhwa' | 'manhua' = 'manga'
): ProcessedManga {
  const title =
    item.title.english || item.title.romaji || item.title.native || 'Unknown';
  const description =
    item.description || 'No description available';
  const coverUrl = item.coverImage?.large || item.coverImage?.medium || '';
  const rating = item.averageScore || item.meanScore || 0;
  const year = item.startDate?.year || new Date().getFullYear();
  const genres = item.genres || [];

  // Clean description (remove HTML tags)
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
    rating: Math.round(rating / 10),
    year,
    genres,
    type,
    anilistId: item.id,
  };
}

export async function importMangaCollection(
  limit: number = 100
): Promise<ProcessedManga[]> {
  try {
    const allManga: ProcessedManga[] = [];
    const perPage = 50;
    const pages = Math.ceil(limit / perPage);

    console.log(
      `[AniListImport] Starting bulk import of ${limit} manga/manhwa`
    );

    // Fetch manga
    for (let page = 1; page <= pages; page++) {
      const manga = await fetchAniListManga(page, perPage);
      allManga.push(...manga);
      if (allManga.length >= limit) break;
    }

    // Fetch manhwa
    for (let page = 1; page <= pages; page++) {
      const manhwa = await fetchAniListManhwa(page, perPage);
      allManga.push(...manhwa);
      if (allManga.length >= limit) break;
    }

    console.log(
      `[AniListImport] Successfully imported ${allManga.length} items`
    );
    return allManga.slice(0, limit);
  } catch (error) {
    console.error('[AniListImport] Error during bulk import:', error);
    throw error;
  }
}
