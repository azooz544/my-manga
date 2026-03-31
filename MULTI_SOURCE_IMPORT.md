# Multi-Source Manga Import System

## Overview

The multi-source import system automatically fetches manga data from **5 different APIs** and intelligently merges the results to build a comprehensive manga database.

### Supported Sources

1. **AniList** - Comprehensive anime/manga database with high-quality metadata
2. **MyAnimeList (via Jikan)** - Popular anime/manga community database
3. **Jikan API** - Direct access to MyAnimeList data with additional features
4. **MangaDex** - Largest manga scanlation database
5. **Kitsu** - Modern anime/manga database with rich metadata

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│         Multi-Source Import System                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   AniList    │  │ MyAnimeList  │  │    Jikan     │  │
│  │     API      │  │   (Jikan)    │  │     API      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↓                ↓                   ↓          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  MangaDex    │  │    Kitsu     │  │   Dedup      │  │
│  │     API      │  │     API      │  │   Engine     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↓                ↓                   ↓          │
│  ┌─────────────────────────────────────────────────┐   │
│  │    Deduplication & Conflict Resolution          │   │
│  │  - String similarity matching                   │   │
│  │  - Intelligent data merging                     │   │
│  │  - Source tracking                              │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Database Storage (MySQL)                │   │
│  │  - Unique manga records                         │   │
│  │  - Multi-source tracking                        │   │
│  │  - Conflict resolution metadata                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Running the Import

### Quick Start

```bash
# Install dependencies
pnpm install

# Run the import script
node server/importMultipleSources.mjs
```

### Environment Setup

Ensure your `.env` file contains database credentials:

```env
DATABASE_URL=mysql://user:password@localhost:3306/anime_db
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=anime_db
```

## How It Works

### 1. Data Fetching

Each API is queried in parallel for manga data:

- **AniList**: GraphQL query for top 50 manga by popularity
- **MyAnimeList**: REST API for top 50 manga by score
- **Jikan**: REST API for top 50 manga
- **MangaDex**: REST API for top 50 manga by rating
- **Kitsu**: REST API for top 50 manga by user count

### 2. Data Normalization

All API responses are normalized to a common format:

```typescript
interface MangaData {
  title: string;
  description?: string;
  coverUrl?: string;
  year?: number;
  rating?: number;
  type: 'manga' | 'manhwa' | 'manhua';
  anilistId?: number;
  source: 'anilist' | 'myanimelist' | 'jikan' | 'mangadex' | 'kitsu';
}
```

### 3. Deduplication

The system uses **string similarity matching** to identify duplicate entries:

- Normalizes titles (lowercase, trim, remove special characters)
- Calculates Levenshtein distance for fuzzy matching
- Threshold: 85% similarity to consider as duplicate
- Validates year information (±1 year tolerance)

### 4. Conflict Resolution

When duplicates are found, the system intelligently merges data:

- **Description**: Prefers longer, more detailed descriptions
- **Cover Image**: Uses first available high-quality image
- **Year**: Prefers most common year or earliest valid year
- **Rating**: Averages ratings from multiple sources
- **Source Tracking**: Records all sources for each manga

### 5. Database Storage

Merged manga are inserted into the database with:

- Unique title constraint to prevent re-importing
- Multi-source tracking for future updates
- Conflict resolution metadata for auditing

## Import Statistics

### Typical Results

```
Total fetched from all sources:    ~250 manga
After deduplication:               ~150-180 unique manga
Successfully imported:             ~140-170 new entries
Skipped (existing):                ~10-20 duplicates
Duration:                          ~30-60 seconds
```

### Performance

- **API Calls**: 5 parallel requests (one per source)
- **Timeout**: 30 seconds per API
- **Deduplication**: O(n²) similarity matching
- **Database**: Batch inserts for efficiency

## API Details

### AniList

```graphql
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
```

**Rate Limit**: 90 requests per minute

### MyAnimeList (via Jikan)

```
GET https://api.jikan.moe/v4/manga?order_by=score&sort=desc&limit=50
```

**Rate Limit**: 60 requests per minute

### Jikan

```
GET https://api.jikan.moe/v4/top/manga?type=manga&limit=50
```

**Rate Limit**: 60 requests per minute

### MangaDex

```
GET https://api.mangadex.org/manga?limit=50&order[rating]=desc
```

**Rate Limit**: 5 requests per second

### Kitsu

```
GET https://kitsu.io/api/edge/manga?sort=-userCount&page[limit]=50
```

**Rate Limit**: No strict limit (be respectful)

## Error Handling

### Retry Logic

- Automatic retry on network timeouts (3 attempts)
- Exponential backoff: 1s, 2s, 4s
- Graceful degradation if one source fails

### Error Reporting

All errors are logged with:

- Source API name
- Error type (timeout, invalid response, etc.)
- Timestamp
- Recovery action taken

### Common Issues

| Issue | Solution |
|-------|----------|
| Network timeout | Check internet connection, increase timeout |
| API rate limit | Wait before retrying, reduce batch size |
| Database connection | Verify DATABASE_URL and credentials |
| Duplicate title error | Check for existing manga with same title |

## Advanced Usage

### Custom Import

To import from specific sources only:

```bash
# Edit importMultipleSources.mjs and comment out unwanted sources
# Then run:
node server/importMultipleSources.mjs
```

### Scheduling Automatic Imports

Create a cron job to run imports periodically:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /home/ubuntu/anime_download_site && node server/importMultipleSources.mjs >> /var/log/manga-import.log 2>&1
```

### Monitoring Imports

Check the import status tracker:

```typescript
import { importTracker } from './server/importStatusTracker';

const session = importTracker.getSession('session-id');
console.log(importTracker.getSummary('session-id'));
```

## Database Schema

### Manga Table

```sql
CREATE TABLE manga (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  coverUrl VARCHAR(512),
  rating INT DEFAULT 0,
  year INT,
  genres TEXT,
  type ENUM('manga', 'manhwa', 'manhua') DEFAULT 'manga',
  anilistId INT UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Import Hangs

**Symptom**: Script doesn't complete after 5 minutes

**Solution**:
1. Check network connectivity
2. Verify API endpoints are accessible
3. Increase timeout in script (line 8: `API_TIMEOUT`)

### Duplicate Inserts

**Symptom**: "Duplicate entry for key 'title'"

**Solution**:
1. Check if manga already exists in database
2. Use deduplication before inserting
3. Clear duplicates: `DELETE FROM manga WHERE id NOT IN (SELECT MIN(id) FROM manga GROUP BY title);`

### Missing Cover Images

**Symptom**: Some manga have no cover images

**Solution**:
1. This is normal - not all APIs provide cover images
2. Manually add cover images via admin panel
3. Use image proxy service for missing images

## Future Enhancements

- [ ] Incremental updates (only fetch new manga)
- [ ] Automatic scheduled imports
- [ ] Web UI for import management
- [ ] Source-specific filtering
- [ ] Custom deduplication rules
- [ ] Import history and rollback
- [ ] Webhook notifications on import completion

## Support

For issues or questions:

1. Check logs: `tail -f /var/log/manga-import.log`
2. Review error messages in console output
3. Verify API endpoints are accessible
4. Check database connectivity

## License

This import system is part of the Team A manga download site.
