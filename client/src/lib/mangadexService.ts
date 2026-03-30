/**
 * MangaDex API Service
 * Fetches real manga chapters and images from MangaDex
 * API Documentation: https://api.mangadex.org/
 * Provides actual chapter images for manga reading
 */

const MANGADEX_API = 'https://api.mangadex.org';

export interface MangaDexChapter {
  id: string;
  attributes: {
    title: string;
    chapter: string;
    pages: number;
    translatedLanguage: string;
    publishAt: string;
  };
}

export interface MangaDexChapterResponse {
  data: MangaDexChapter[];
  limit: number;
  offset: number;
  total: number;
}

export interface ChapterPages {
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
  mangaTitle: string;
}

/**
 * Get chapters for a manga by ID
 */
export async function getMangaChapters(
  mangaId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MangaDexChapterResponse> {
  try {
    const params = new URLSearchParams();
    params.append('manga', mangaId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    params.append('translatedLanguage[]', 'en');
    params.append('order[publishAt]', 'desc');
    params.append('includes[]', 'scanlation_group');

    const response = await fetch(`${MANGADEX_API}/chapter?${params}`);
    if (!response.ok) throw new Error('Failed to fetch chapters');
    return await response.json();
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }
}

/**
 * Get chapter pages/images
 */
export async function getChapterPages(chapterId: string): Promise<ChapterPages> {
  try {
    const response = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`);
    if (!response.ok) throw new Error('Failed to fetch chapter pages');
    return await response.json();
  } catch (error) {
    console.error('Error fetching chapter pages:', error);
    throw error;
  }
}

/**
 * Build image URL for a chapter page
 */
export function buildImageUrl(
  chapterId: string,
  hash: string,
  imageName: string,
  dataSaver: boolean = false
): string {
  const baseUrl = 'https://uploads.mangadex.org';
  const quality = dataSaver ? 'data-saver' : 'data';
  return `${baseUrl}/${quality}/${hash}/${imageName}`;
}

/**
 * Get manga by ID with chapters
 */
export async function getMangaWithChapters(mangaId: string) {
  try {
    const chaptersResponse = await getMangaChapters(mangaId, 10);
    return {
      chapters: chaptersResponse.data,
      total: chaptersResponse.total,
    };
  } catch (error) {
    console.error('Error fetching manga with chapters:', error);
    throw error;
  }
}

/**
 * Get first chapter images for preview
 */
export async function getFirstChapterImages(mangaId: string): Promise<string[]> {
  try {
    const chaptersResponse = await getMangaChapters(mangaId, 1);
    if (chaptersResponse.data.length === 0) {
      return [];
    }

    const firstChapter = chaptersResponse.data[0];
    const pages = await getChapterPages(firstChapter.id);

    return pages.chapter.data.map((imageName) =>
      buildImageUrl(firstChapter.id, pages.chapter.hash, imageName)
    );
  } catch (error) {
    console.error('Error fetching first chapter images:', error);
    return [];
  }
}
