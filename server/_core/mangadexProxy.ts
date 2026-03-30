/**
 * MangaDex API Proxy
 * Handles manga search, chapter fetching, and image extraction
 * Filters out external chapters and ensures only chapters with actual pages are returned
 */

const MANGADEX_API = 'https://api.mangadex.org';
const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface RetryOptions {
  maxRetries?: number;
  timeout?: number;
  delayMs?: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Retry logic with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const maxRetries = retryOptions.maxRetries ?? MAX_RETRIES;
  const timeout = retryOptions.timeout ?? REQUEST_TIMEOUT;
  const delayMs = retryOptions.delayMs ?? RETRY_DELAY;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MangaDexProxy] Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`);
      
      const response = await fetchWithTimeout(url, options, timeout);
      
      if (response.ok) {
        return response;
      }

      if (response.status < 500) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt);
        console.log(`[MangaDexProxy] Retrying after ${waitTime}ms...`);
        await sleep(waitTime);
      }
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt);
        console.log(`[MangaDexProxy] Error: ${error.message}. Retrying after ${waitTime}ms...`);
        await sleep(waitTime);
      }
    }
  }

  throw lastError || new Error('Failed to fetch from MangaDex API after all retries');
}

/**
 * Search for manga by title
 */
export async function searchManga(
  title: string,
  options: RetryOptions = {}
): Promise<any[]> {
  try {
    const url = `${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=5&order[relevance]=desc`;
    
    console.log(`[MangaDexProxy] Searching for: ${title}`);
    
    const response = await fetchWithRetry(url, {}, options);

    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.warn('[MangaDexProxy] Unexpected response format');
      return [];
    }

    // Map MangaDex response to our format
    const results = data.data.map((manga: any) => {
      const result = {
        id: manga.id,
        title: manga.attributes?.title?.en || manga.attributes?.title || 'Unknown',
        description: manga.attributes?.description?.en || '',
        coverUrl: manga.relationships?.find((r: any) => r.type === 'cover_art')?.id || null,
      };
      console.log(`[MangaDexProxy] Mapped manga:`, result);
      return result;
    });

    console.log(`[MangaDexProxy] Found ${results.length} manga results:`, results);
    return results;
  } catch (error: any) {
    console.error('[MangaDexProxy] Search error:', error.message);
    throw error;
  }
}

/**
 * Get chapters for a manga with filtering
 * Filters out external chapters and ensures chapters have actual pages
 */
export async function getChapters(
  mangaId: string,
  options: RetryOptions = {}
): Promise<any[]> {
  try {
    const url = `${MANGADEX_API}/manga/${mangaId}/feed?limit=500&order[chapter]=desc&includes[]=scanlation_group`;
    
    console.log(`[MangaDexProxy] Fetching chapters for mangaId: ${mangaId}`);
    
    const response = await fetchWithRetry(url, {}, options);

    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.warn('[MangaDexProxy] No chapters found in response');
      return [];
    }

    // Filter chapters:
    // 1. Remove external chapters (isExternal = true)
    // 2. Keep only chapters with pages (pageCount > 0)
    // 3. Keep only chapters with English language
    const filteredChapters = data.data
      .filter((chapter: any) => {
        // Skip external chapters
        if (chapter.attributes?.isExternal) {
          console.log(`[MangaDexProxy] Skipping external chapter: ${chapter.attributes?.title}`);
          return false;
        }

        // Skip chapters without pages
        if (!chapter.attributes?.pages || chapter.attributes.pages <= 0) {
          console.log(`[MangaDexProxy] Skipping chapter with no pages: ${chapter.attributes?.title}`);
          return false;
        }

        // Keep English chapters
        return chapter.attributes?.translatedLanguage === 'en';
      })
      .map((chapter: any) => ({
        id: chapter.id,
        chap: chapter.attributes?.chapter || 'Special',
        title: chapter.attributes?.title || `Chapter ${chapter.attributes?.chapter}`,
        pages: chapter.attributes?.pages || 0,
        publishAt: chapter.attributes?.publishAt || new Date().toISOString(),
        scanlationGroup: data.relationships?.find((r: any) => 
          r.id === chapter.relationships?.find((rel: any) => rel.type === 'scanlation_group')?.id
        )?.attributes?.name || 'Unknown',
      }));

    console.log(`[MangaDexProxy] Found ${filteredChapters.length} valid chapters (filtered from ${data.data.length})`);
    return filteredChapters;
  } catch (error: any) {
    console.error('[MangaDexProxy] Get chapters error:', error.message);
    throw error;
  }
}

/**
 * Get images for a chapter
 */
export async function getChapterImages(
  chapterId: string,
  options: RetryOptions = {}
): Promise<string[]> {
  try {
    const url = `${MANGADEX_API}/at-home/server/${chapterId}`;
    
    console.log(`[MangaDexProxy] Fetching images for chapter: ${chapterId}`);
    
    const response = await fetchWithRetry(url, {}, options);

    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.chapter || !data.chapter.data || !Array.isArray(data.chapter.data)) {
      console.warn('[MangaDexProxy] No images found in chapter');
      return [];
    }

    // Build complete image URLs
    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    const images = data.chapter.data.map((filename: string) => 
      `${baseUrl}/data/${hash}/${filename}`
    );

    console.log(`[MangaDexProxy] Found ${images.length} images`);
    return images;
  } catch (error: any) {
    console.error('[MangaDexProxy] Get images error:', error.message);
    throw error;
  }
}
