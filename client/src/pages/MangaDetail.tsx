import { getMangaById } from '@/lib/jikanService';
import { trpcClient } from '@/lib/trpcClient';
import { Button } from '@/components/ui/button';
import { Play, Star, Calendar, BookOpen, Tag, Loader, ChevronLeft, ChevronRight, X, AlertCircle, ArrowRight } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';

interface MangaDetailData {
  mal_id?: number;
  title: string;
  title_english?: string;
  synopsis?: string;
  images?: { jpg: { large_image_url: string } };
  authors?: Array<{ name: string }>;
  status?: string;
  chapters?: number;
  volumes?: number;
  score?: number;
  genres?: Array<{ name: string }>;
  published?: { from: string };
  // MangaDex fields
  id?: string;
  description?: string;
  coverUrl?: string;
}

interface Chapter {
  id: string;
  chap: string;
  title: string;
  pages: number;
  publishAt: string;
  scanlationGroup?: string;
}

export default function MangaDetail() {
  const [match, params] = useRoute('/manga/:id');
  const id = params?.id as string;
  const [, setLocation] = useLocation();
  const [manga, setManga] = useState<MangaDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [chapterImages, setChapterImages] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [mangaDexId, setMangaDexId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch manga detail from Jikan or MangaDex
  useEffect(() => {
    const fetchMangaDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          // Check if ID is UUID (from search) or numeric (from home grid)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          
          if (isUUID) {
            // Load from MangaDex directly - don't need Jikan data
            setMangaDexId(id);
            await loadChaptersFromMangaDex(id);
            // Set minimal manga data for MangaDex UUIDs
            setManga({
              title: 'جاري التحميل...',
              description: 'جاري تحميل بيانات المانجا من MangaDex'
            });
          } else {
            // Load from Jikan (numeric ID)
            const response = await getMangaById(parseInt(id));
            const mangaData = response.data;
            setManga(mangaData);
            
            // Search for manga on MangaDex and load chapters
            await searchAndLoadChapters(mangaData.title_english || mangaData.title);
          }
        }
      } catch (err: any) {
        console.error('[MangaDetail] Error fetching manga:', err);
        setError('فشل في تحميل بيانات المانجا');
      } finally {
        setLoading(false);
      }
    };

    fetchMangaDetail();
  }, [id]);

  const loadChaptersFromMangaDex = async (mangaDexId: string) => {
    try {
      setLoadingChapters(true);
      setError(null);

      console.log(`[MangaDetail] Loading chapters for MangaDex ID: ${mangaDexId}`);
      
      const chaptersData = await trpcClient.manga.getChapters(mangaDexId);
      console.log(`[MangaDetail] Got chapters:`, chaptersData);
      
      if (chaptersData && Array.isArray(chaptersData) && chaptersData.length > 0) {
        setChapters(chaptersData);
      } else {
        setError('لم يتم العثور على فصول لهذه المانجا');
      }
    } catch (err: any) {
      console.error('[MangaDetail] Error loading chapters:', err);
      setError(err.message || 'خطأ في جلب الفصول');
    } finally {
      setLoadingChapters(false);
    }
  };

  const searchAndLoadChapters = async (title: string) => {
    try {
      setLoadingChapters(true);
      setError(null);

      console.log(`[MangaDetail] Searching for: ${title}`);
      
      const searchResults = await trpcClient.manga.search(title);
      console.log(`[MangaDetail] Search results:`, searchResults);

      if (!searchResults || searchResults.length === 0) {
        setError('لم يتم العثور على هذه المانجا في MangaDex');
        return;
      }

      if (!searchResults[0] || !searchResults[0].id) {
        setError('فشل في الحصول على معرّف المانجا');
        return;
      }

      const mangaId = searchResults[0].id;
      setMangaDexId(mangaId);

      try {
        const chaptersData = await trpcClient.manga.getChapters(mangaId);
        console.log(`[MangaDetail] Got chapters:`, chaptersData);
        
        if (chaptersData && Array.isArray(chaptersData) && chaptersData.length > 0) {
          setChapters(chaptersData);
        } else {
          setError('لم يتم العثور على فصول لهذه المانجا');
        }
      } catch (chapErr: any) {
        console.error('[MangaDetail] Error loading chapters:', chapErr);
        setError(chapErr.message || 'خطأ في جلب الفصول');
      }
    } catch (searchErr: any) {
      console.error('[MangaDetail] Error searching manga:', searchErr);
      setError(searchErr?.message || searchErr?.toString?.() || 'خطأ في البحث عن المانجا');
    } finally {
      setLoadingChapters(false);
    }
  };

  const loadChapterImages = async (chapterId: string) => {
    try {
      setViewerError(null);
      console.log(`[MangaDetail] Loading images for chapter: ${chapterId}`);
      
      const images = await trpcClient.manga.getChapterImages(chapterId);
      console.log(`[MangaDetail] Got ${images?.length || 0} images`);
      
      if (images && Array.isArray(images) && images.length > 0) {
        setChapterImages(images);
        setCurrentImageIndex(0);
        setShowImageViewer(true);
      } else {
        setViewerError('لم يتم العثور على صور لهذا الفصل');
      }
    } catch (err: any) {
      console.error('[MangaDetail] Error loading chapter images:', err);
      setViewerError(err.message || 'خطأ في جلب صور الفصل');
    }
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showImageViewer) return;
    if (e.key === 'ArrowRight') {
      setCurrentImageIndex((prev) => (prev + 1) % chapterImages.length);
    } else if (e.key === 'ArrowLeft') {
      setCurrentImageIndex((prev) => (prev - 1 + chapterImages.length) % chapterImages.length);
    } else if (e.key === 'Escape') {
      setShowImageViewer(false);
    }
  }, [showImageViewer, chapterImages.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !manga) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg text-destructive">{error}</p>
        <Button onClick={() => setLocation('/')} variant="outline">
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setLocation('/')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="العودة للرئيسية"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold flex-1">{manga?.title}</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Manga Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Cover image */}
          <div className="md:col-span-1">
            {manga?.images?.jpg?.large_image_url && (
              <img
                src={manga.images.jpg.large_image_url}
                alt={manga.title}
                className="w-full rounded-lg shadow-lg"
              />
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-3">
            <h2 className="text-3xl font-bold mb-4">{manga?.title}</h2>
            
            {manga?.score && (
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-semibold">{manga.score}</span>
              </div>
            )}

            {manga?.status && (
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5" />
                <span>{manga.status}</span>
              </div>
            )}

            {manga?.published?.from && (
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5" />
                <span>{new Date(manga.published.from).getFullYear()}</span>
              </div>
            )}

            {manga?.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((genre: any) => (
                  <span key={genre.name} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {manga?.synopsis && (
              <p className="text-muted-foreground line-clamp-4">{manga.synopsis}</p>
            )}
          </div>
        </div>

        {/* Chapters section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">الفصول ({chapters.length})</h3>
          
          {loadingChapters && (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive mb-4">
              {error}
            </div>
          )}

          {chapters.length === 0 && !loadingChapters && (
            <p className="text-muted-foreground">لم يتم العثور على فصول</p>
          )}

          {chapters.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => loadChapterImages(chapter.id)}
                  className="w-full text-left p-4 rounded-lg hover:bg-accent transition-colors border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{chapter.title}</p>
                      <p className="text-sm text-muted-foreground">الفصل {chapter.chap}</p>
                    </div>
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && chapterImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onMouseMove={handleMouseMove}
        >
          {/* Image */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={chapterImages[currentImageIndex]}
              alt={`صفحة ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Controls - Auto-hide after 3 seconds */}
          <div
            className={`transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Top bar */}
            <div className="bg-black/80 backdrop-blur px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setShowImageViewer(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <span className="text-white text-sm font-semibold">
                {currentImageIndex + 1} / {chapterImages.length}
              </span>
            </div>

            {/* Bottom controls */}
            <div className="bg-black/80 backdrop-blur px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + chapterImages.length) % chapterImages.length)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="الصفحة السابقة"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              {/* Progress bar */}
              <div className="flex-1 mx-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentImageIndex + 1) / chapterImages.length) * 100}%` }}
                />
              </div>

              <button
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % chapterImages.length)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="الصفحة التالية"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
