/**
 * Manga Hook API Service
 * Fetches real manga data from Manga Hook API
 * API Documentation: https://mangahook-api.vercel.app/
 */

const MANGA_HOOK_API = 'https://mangahook-api.vercel.app';

export interface MangaItem {
  id: string;
  image: string;
  title: string;
  chapter: string;
  view: string;
  description: string;
}

export interface MangaDetail {
  imageUrl: string;
  name: string;
  author: string;
  status: string;
  updated: string;
  view: string;
  genres: string[];
  chapterList: Chapter[];
}

export interface Chapter {
  id: string;
  path: string;
  name: string;
  view: string;
  createdAt: string;
}

export interface ChapterDetail {
  title: string;
  currentChapter: string;
  chapterListIds: Array<{
    id: string;
    name: string;
  }>;
  images: Array<{
    title: string;
    image: string;
  }>;
}

export interface MangaListResponse {
  mangaList: MangaItem[];
  metaData: {
    totalStories: number;
    totalPages: number;
    type: Array<{ id: string; type: string }>;
    state: Array<{ id: string; type: string }>;
    category: Array<{ id: string; type: string }>;
  };
}

/**
 * Fetch manga list with optional filters
 */
export async function getMangaList(
  page: number = 1,
  category?: string,
  type?: string,
  state?: string
): Promise<MangaListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    if (state) params.append('state', state);

    const response = await fetch(`${MANGA_HOOK_API}/api/mangaList?${params}`);
    if (!response.ok) throw new Error('Failed to fetch manga list');
    return await response.json();
  } catch (error) {
    console.error('Error fetching manga list:', error);
    throw error;
  }
}

/**
 * Fetch detailed information about a specific manga
 */
export async function getMangaDetail(mangaId: string): Promise<MangaDetail> {
  try {
    const response = await fetch(`${MANGA_HOOK_API}/api/manga/${mangaId}`);
    if (!response.ok) throw new Error('Failed to fetch manga detail');
    return await response.json();
  } catch (error) {
    console.error('Error fetching manga detail:', error);
    throw error;
  }
}

/**
 * Fetch chapter details including images
 */
export async function getChapterDetail(
  mangaId: string,
  chapterId: string
): Promise<ChapterDetail> {
  try {
    const response = await fetch(`${MANGA_HOOK_API}/api/manga/${mangaId}/${chapterId}`);
    if (!response.ok) throw new Error('Failed to fetch chapter detail');
    return await response.json();
  } catch (error) {
    console.error('Error fetching chapter detail:', error);
    throw error;
  }
}

/**
 * Search for manga by title
 */
export async function searchManga(query: string): Promise<MangaListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('query', query);
    const response = await fetch(`${MANGA_HOOK_API}/api/search?${params}`);
    if (!response.ok) throw new Error('Failed to search manga');
    return await response.json();
  } catch (error) {
    console.error('Error searching manga:', error);
    throw error;
  }
}
