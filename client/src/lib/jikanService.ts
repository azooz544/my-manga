/**
 * Jikan API Service
 * Fetches manga data from Jikan (Unofficial MyAnimeList API)
 * API Documentation: https://docs.api.jikan.moe/
 * Reliable, open-source, and handles 25M+ requests weekly
 */

const JIKAN_API = 'https://api.jikan.moe/v4';

export interface JikanManga {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  approved: boolean;
  titles: Array<{
    type: string;
    title: string;
  }>;
  title: string;
  title_english: string;
  title_japanese: string;
  type: string;
  chapters: number;
  volumes: number;
  status: string;
  publishing: boolean;
  published: {
    from: string;
    to: string;
  };
  score: number;
  scored_by: number;
  rank: number;
  popularity: number;
  members: number;
  genres: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  authors: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  synopsis: string;
}

export interface JikanMangaListResponse {
  data: JikanManga[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

/**
 * Search for manga by query
 */
export async function searchManga(query: string, page: number = 1): Promise<JikanMangaListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('page', page.toString());
    params.append('limit', '25');

    const response = await fetch(`${JIKAN_API}/manga?${params}`);
    if (!response.ok) throw new Error('Failed to search manga');
    return await response.json();
  } catch (error) {
    console.error('Error searching manga:', error);
    throw error;
  }
}

/**
 * Get top manga list
 */
export async function getTopManga(page: number = 1, filter: string = 'all'): Promise<JikanMangaListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '25');
    if (filter !== 'all') {
      params.append('filter', filter);
    }

    const response = await fetch(`${JIKAN_API}/top/manga?${params}`);
    if (!response.ok) throw new Error('Failed to fetch top manga');
    return await response.json();
  } catch (error) {
    console.error('Error fetching top manga:', error);
    throw error;
  }
}

/**
 * Get manga by ID with full details
 */
export async function getMangaById(mangaId: number) {
  try {
    const response = await fetch(`${JIKAN_API}/manga/${mangaId}/full`);
    if (!response.ok) throw new Error('Failed to fetch manga details');
    return await response.json();
  } catch (error) {
    console.error('Error fetching manga details:', error);
    throw error;
  }
}

/**
 * Get random manga
 */
export async function getRandomManga() {
  try {
    const response = await fetch(`${JIKAN_API}/random/manga`);
    if (!response.ok) throw new Error('Failed to fetch random manga');
    return await response.json();
  } catch (error) {
    console.error('Error fetching random manga:', error);
    throw error;
  }
}

/**
 * Get manga by genre
 */
export async function getMangaByGenre(genreId: number, page: number = 1): Promise<JikanMangaListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '25');

    const response = await fetch(`${JIKAN_API}/genres/manga/${genreId}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch manga by genre');
    return await response.json();
  } catch (error) {
    console.error('Error fetching manga by genre:', error);
    throw error;
  }
}

/**
 * Transform Jikan manga to our format
 */
export function transformJikanManga(manga: JikanManga) {
  return {
    id: manga.mal_id.toString(),
    image: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
    title: manga.title || manga.title_english || 'Unknown',
    chapter: `${manga.chapters || 0} فصل`,
    view: `${manga.members?.toLocaleString() || 0} متابع`,
    description: manga.synopsis || 'لا توجد وصف متاح',
    status: manga.status,
    score: manga.score,
    genres: manga.genres.map(g => g.name),
    authors: manga.authors.map(a => a.name).join(', '),
  };
}
