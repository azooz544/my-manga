/**
 * Server-side proxy for ComicK API
 * Handles retries, timeouts, and error handling securely on the backend
 */

const COMICK_API_BASE = 'https://api.comick.cc';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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
      console.log(`[ComickProxy] Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`);
      
      const response = await fetchWithTimeout(url, options, timeout);
      
      // If response is ok, return immediately
      if (response.ok) {
        return response;
      }

      // If response is not ok but is not a server error, don't retry
      if (response.status < 500) {
        return response;
      }

      // For server errors (5xx), retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt); // Exponential backoff
        console.log(`[ComickProxy] Retrying after ${waitTime}ms...`);
        await sleep(waitTime);
      }
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt);
        console.log(`[ComickProxy] Error: ${error.message}. Retrying after ${waitTime}ms...`);
        await sleep(waitTime);
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('Failed to fetch from ComicK API after all retries');
}

/**
 * Search for manga by title
 */
export async function searchManga(
  title: string,
  options: RetryOptions = {}
): Promise<any[]> {
  try {
    const url = `${COMICK_API_BASE}/v1.0/search?q=${encodeURIComponent(title)}&limit=5`;
    
    console.log(`[ComickProxy] Searching for: ${title}`);
    
    const response = await fetchWithRetry(url, {}, options);

    if (!response.ok) {
      throw new Error(`ComicK API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('[ComickProxy] Unexpected response format:', data);
      return [];
    }

    console.log(`[ComickProxy] Found ${data.length} results`);
    return data;
  } catch (error: any) {
    console.error('[ComickProxy] Search error:', error.message);
    throw error;
  }
}

/**
 * Get chapters for a manga
 */
export async function getChapters(
  mangaHid: string,
  options: RetryOptions = {}
): Promise<any[]> {
  try {
    const url = `${COMICK_API_BASE}/comic/${mangaHid}/chapters?limit=500`;
    
    console.log(`[ComickProxy] Fetching chapters for hid: ${mangaHid}`);
    
    const response = await fetchWithRetry(url, {}, options);

    if (!response.ok) {
      throw new Error(`ComicK API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.chapters || !Array.isArray(data.chapters)) {
      console.warn('[ComickProxy] No chapters found in response');
      return [];
    }

    console.log(`[ComickProxy] Found ${data.chapters.length} chapters`);
    return data.chapters;
  } catch (error: any) {
    console.error('[ComickProxy] Get chapters error:', error.message);
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
    const url = `${COMICK_API_BASE}/chapter/${chapterId}`;
    
    console.log(`[ComickProxy] Fetching images for chapter: ${chapterId}`);
    
    const response = await fetchWithRetry(url, {}, options);

    if (!response.ok) {
      throw new Error(`ComicK API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.chapter || !data.chapter.md_images || !Array.isArray(data.chapter.md_images)) {
      console.warn('[ComickProxy] No images found in chapter');
      return [];
    }

    // Build complete image URLs
    const images = data.chapter.md_images
      .filter((img: any) => img.b2key)
      .map((img: any) => `https://meo.comick.pictures/${img.b2key}`);

    console.log(`[ComickProxy] Found ${images.length} images`);
    return images;
  } catch (error: any) {
    console.error('[ComickProxy] Get images error:', error.message);
    throw error;
  }
}
