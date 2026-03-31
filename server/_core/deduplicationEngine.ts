/**
 * Advanced Deduplication and Conflict Resolution Engine
 * Handles merging manga from multiple sources with intelligent conflict resolution
 */

interface MangaMetadata {
  title: string;
  description?: string;
  coverImage?: string;
  year?: number;
  rating?: number;
  format: 'MANGA' | 'MANHWA' | 'MANHUA';
  sourceId: string;
  sourceType: 'anilist' | 'myanimelist' | 'jikan' | 'mangadex' | 'kitsu';
  externalId?: string;
  sources: Array<{
    type: string;
    id: string;
    rating?: number;
  }>;
}

interface DeduplicationResult {
  uniqueManga: MangaMetadata[];
  mergedCount: number;
  conflictResolutions: Array<{
    title: string;
    conflict: string;
    resolution: string;
  }>;
}

// ===== String Similarity Algorithm =====
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Remove common words and special characters
  const normalize = (s: string) => s.replace(/[^a-z0-9]/g, '');
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  
  if (n1 === n2) return 0.95;
  
  // Levenshtein distance
  const longer = n1.length > n2.length ? n1 : n2;
  const shorter = n1.length > n2.length ? n2 : n1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  
  return costs[s2.length];
}

// ===== Manga Matching =====
function findDuplicates(
  manga: MangaMetadata,
  candidates: MangaMetadata[],
  threshold: number = 0.85
): MangaMetadata[] {
  return candidates.filter(candidate => {
    // Don't match with itself
    if (manga.sourceId === candidate.sourceId) return false;
    
    // Check title similarity
    const titleSimilarity = calculateStringSimilarity(manga.title, candidate.title);
    if (titleSimilarity < threshold) return false;
    
    // Additional checks for higher confidence
    if (manga.year && candidate.year && Math.abs(manga.year - candidate.year) > 1) {
      return false; // Different years (with 1 year tolerance)
    }
    
    return true;
  });
}

// ===== Conflict Resolution =====
function resolveMangaConflict(
  primary: MangaMetadata,
  duplicates: MangaMetadata[]
): { merged: MangaMetadata; conflicts: string[] } {
  const conflicts: string[] = [];
  const merged: MangaMetadata = { ...primary };
  
  // Collect all sources
  const allSources = [...(primary.sources || [])];
  
  for (const dup of duplicates) {
    // Merge descriptions (prefer longer one)
    if (dup.description && (!merged.description || dup.description.length > merged.description.length)) {
      if (merged.description !== dup.description) {
        conflicts.push(`description_conflict: ${primary.sourceType} vs ${dup.sourceType}`);
      }
      merged.description = dup.description;
    }
    
    // Merge cover images (prefer highest quality)
    if (dup.coverImage && !merged.coverImage) {
      merged.coverImage = dup.coverImage;
    }
    
    // Merge year (prefer most common)
    if (dup.year && !merged.year) {
      merged.year = dup.year;
    } else if (dup.year && merged.year && dup.year !== merged.year) {
      conflicts.push(`year_conflict: ${merged.year} vs ${dup.year}`);
    }
    
    // Merge rating (average or prefer higher)
    if (dup.rating && merged.rating) {
      if (Math.abs(dup.rating - merged.rating) > 1) {
        conflicts.push(`rating_conflict: ${merged.rating} vs ${dup.rating}`);
      }
      merged.rating = (merged.rating + dup.rating) / 2;
    } else if (dup.rating && !merged.rating) {
      merged.rating = dup.rating;
    }
    
    // Collect source information
    allSources.push({
      type: dup.sourceType,
      id: dup.externalId || dup.sourceId,
      rating: dup.rating,
    });
  }
  
  merged.sources = allSources;
  merged.sourceId = primary.sourceId + `;${duplicates.map(d => d.sourceId).join(';')}`;
  
  return { merged, conflicts };
}

// ===== Main Deduplication Engine =====
export function deduplicateAndMerge(
  mangaList: MangaMetadata[]
): DeduplicationResult {
  console.log(`[Dedup] Starting deduplication of ${mangaList.length} manga...`);
  
  const processed = new Set<string>();
  const uniqueManga: MangaMetadata[] = [];
  const conflictResolutions: Array<{
    title: string;
    conflict: string;
    resolution: string;
  }> = [];
  
  for (let i = 0; i < mangaList.length; i++) {
    const manga = mangaList[i];
    
    if (processed.has(manga.sourceId)) {
      continue;
    }
    
    // Find all duplicates
    const candidates = mangaList.slice(i + 1).filter(m => !processed.has(m.sourceId));
    const duplicates = findDuplicates(manga, candidates, 0.85);
    
    if (duplicates.length > 0) {
      // Resolve conflicts and merge
      const { merged, conflicts } = resolveMangaConflict(manga, duplicates);
      uniqueManga.push(merged);
      
      // Record conflict resolutions
      for (const conflict of conflicts) {
        conflictResolutions.push({
          title: manga.title,
          conflict,
          resolution: `Merged ${duplicates.length} sources`,
        });
      }
      
      // Mark all as processed
      processed.add(manga.sourceId);
      duplicates.forEach(d => processed.add(d.sourceId));
    } else {
      // No duplicates found
      manga.sources = [{
        type: manga.sourceType,
        id: manga.externalId || manga.sourceId,
        rating: manga.rating,
      }];
      uniqueManga.push(manga);
      processed.add(manga.sourceId);
    }
  }
  
  const mergedCount = mangaList.length - uniqueManga.length;
  console.log(`[Dedup] Deduplication complete: ${uniqueManga.length} unique manga (${mergedCount} merged)`);
  
  return {
    uniqueManga,
    mergedCount,
    conflictResolutions,
  };
}

// ===== Batch Deduplication =====
export function deduplicateBatch(
  mangaBatches: MangaMetadata[][]
): DeduplicationResult {
  // Flatten all batches
  const allManga = mangaBatches.flat();
  
  // Deduplicate across all sources
  return deduplicateAndMerge(allManga);
}

export { MangaMetadata, DeduplicationResult };
