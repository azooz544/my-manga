-- Clean up manga without chapters
-- This script removes manga that don't have any chapters

-- First, let's see how many manga are empty
SELECT COUNT(*) as empty_manga_count 
FROM manga 
WHERE id NOT IN (SELECT DISTINCT manga_id FROM chapters);

-- Delete manga without chapters
DELETE FROM manga 
WHERE id NOT IN (SELECT DISTINCT manga_id FROM chapters);

-- Verify the cleanup
SELECT COUNT(*) as remaining_manga_count FROM manga;
SELECT COUNT(*) as total_chapters FROM chapters;

-- Show remaining manga with chapter counts
SELECT m.id, m.title, COUNT(c.id) as chapter_count
FROM manga m
LEFT JOIN chapters c ON m.id = c.manga_id
GROUP BY m.id, m.title
ORDER BY chapter_count DESC;
