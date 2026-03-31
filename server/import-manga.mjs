/**
 * Standalone script to import manga and manhwa from AniList into the database
 * Run with: node import-manga.mjs
 */

import { importMangaCollection } from './server/_core/anilistImport.ts';
import { db } from './server/db.ts';
import { manga as mangaTable } from '../drizzle/schema.ts';

async function importMangaData() {
  try {
    console.log('🚀 Starting manga import from AniList...');
    
    // Fetch manga and manhwa from AniList
    const mangaData = await importMangaCollection(100);
    
    console.log(`📚 Fetched ${mangaData.length} items from AniList`);
    console.log('💾 Importing into database...');
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const item of mangaData) {
      try {
        // Check if manga already exists
        const existing = await db.query.manga.findFirst({
          where: (t) => t.title.equals(item.title),
        });
        
        if (existing) {
          console.log(`⏭️  Skipped: ${item.title} (already exists)`);
          skippedCount++;
          continue;
        }
        
        // Insert new manga
        await db.insert(mangaTable).values({
          title: item.title,
          description: item.description,
          coverUrl: item.coverUrl,
          rating: item.rating,
          year: item.year,
          genres: JSON.stringify(item.genres),
          type: item.type,
          anilistId: item.anilistId,
          createdAt: new Date(),
        });
        
        console.log(`✅ Imported: ${item.title}`);
        importedCount++;
      } catch (error) {
        console.error(`❌ Error importing ${item.title}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`\n✨ Import complete!`);
    console.log(`✅ Imported: ${importedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📊 Total: ${importedCount + skippedCount}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importMangaData();
