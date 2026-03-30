import { useParams, Link } from 'wouter';
import { getMangaById } from '@/lib/jikanService';
import { trpcClient } from '@/lib/trpcClient';
import { Button } from '@/components/ui/button';
import { Play, Star, Calendar, BookOpen, Tag, Loader, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

interface MangaDetailData {
  mal_id: number;
  title: string;
  title_english: string;
  synopsis: string;
  images: { jpg: { large_image_url: string } };
  authors: Array<{ name: string }>;
  status: string;
  chapters: number;
  volumes: number;
  score: number;
  genres: Array<{ name: string }>;
  published: { from: string };
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
  const { id } = useParams<{ id: string }>();
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

  // Fetch manga detail from Jikan
  useEffect(() => {
    const fetchMangaDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const response = await getMangaById(parseInt(id));
          const mangaData = response.data;
          setManga(mangaData);
          
          // Search for manga on MangaDex and load chapters
          await searchAndLoadChapters(mangaData.title_english || mangaData.title);
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

  const searchAndLoadChapters = async (title: string) => {
    try {
      setLoadingChapters(true);
      setError(null);

      console.log(`[MangaDetail] Searching for: ${title}`);
      
      // استدعاء tRPC search procedure
      const searchResults = await trpcClient.manga.search(title);
      console.log(`[MangaDetail] Search results:`, searchResults);
      console.log(`[MangaDetail] Search results type:`, typeof searchResults);
      console.log(`[MangaDetail] Search results[0]:`, searchResults?.[0]);
      console.log(`[MangaDetail] Search results[0] type:`, typeof searchResults?.[0]);
      console.log(`[MangaDetail] Search results[0].id:`, searchResults?.[0]?.id);

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

      // جلب الفصول
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

  const handleChapterSelect = async (chapterId: string) => {
    try {
      setChapterImages([]); 
      setViewerError(null);
      
      console.log(`[MangaDetail] Loading chapter: ${chapterId}`);
      
      // استدعاء tRPC getChapterImages procedure
      const images = await trpcClient.manga.getChapterImages(chapterId);
      
      console.log(`[MangaDetail] Got images:`, images);

      if (!images || !Array.isArray(images) || images.length === 0) {
        setViewerError("هذا الفصل لا يحتوي على صور متاحة.");
        return;
      }
      
      setChapterImages(images);
      setSelectedChapter(chapterId);
      setCurrentImageIndex(0);
      setShowImageViewer(true);
    } catch (err: any) {
      console.error('[MangaDetail] Error loading chapter:', err);
      setViewerError(err.message || "حدث خطأ في تحميل صور الفصل. حاول مرة أخرى.");
    }
  };

  const nextPage = useCallback(() => {
    setCurrentImageIndex((prev) => Math.min(chapterImages.length - 1, prev + 1));
  }, [chapterImages.length]);

  const prevPage = useCallback(() => {
    setCurrentImageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showImageViewer) return;
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
    if (e.key === 'Escape') setShowImageViewer(false);
  }, [showImageViewer, nextPage, prevPage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (showImageViewer) {
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showImageViewer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg">{error || 'فشل في تحميل المانجا'}</p>
          <Link href="/">
            <Button className="mt-4">العودة للرئيسية</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={manga.images.jpg.large_image_url} 
          alt={manga.title}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 -mt-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <img 
              src={manga.images.jpg.large_image_url}
              alt={manga.title}
              className="w-full rounded-lg shadow-lg mb-6"
            />
            <Button 
              onClick={() => chapters.length > 0 && handleChapterSelect(chapters[0].id)}
              disabled={chapters.length === 0 || loadingChapters}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {loadingChapters ? 'جاري التحميل...' : 'ابدأ القراءة الآن'}
            </Button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold mb-2">{manga.title}</h1>
            {manga.title_english && (
              <p className="text-gray-400 mb-4">{manga.title_english}</p>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-card rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-400">التقييم</p>
                  <p className="font-bold">{manga.score}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-400">الفصول</p>
                  <p className="font-bold">{chapters.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="text-sm text-gray-400">الحالة</p>
                  <p className="font-bold">{manga.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-sm text-gray-400">السنة</p>
                  <p className="font-bold">{new Date(manga.published.from).getFullYear()}</p>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">الأنواع</h3>
              <div className="flex flex-wrap gap-2">
                {manga.genres.map((genre) => (
                  <span 
                    key={genre.name}
                    className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">الملخص</h3>
              <p className="text-gray-300 leading-relaxed">{manga.synopsis}</p>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">الفصول ({chapters.length})</h2>
          
          {loadingChapters ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin w-8 h-8" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400 bg-red-900/20 rounded-lg p-4">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <p>{error}</p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لم يتم العثور على فصول متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(chapter.id)}
                  className="p-4 bg-card hover:bg-card/80 rounded-lg transition-all hover:shadow-lg text-right"
                >
                  <h4 className="font-bold">{chapter.title}</h4>
                  <p className="text-sm text-gray-400">الفصل: {chapter.chap}</p>
                  <p className="text-xs text-gray-500 mt-2">الصفحات: {chapter.pages}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer - Full Screen Immersive */}
      {showImageViewer && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
        >
          <div className="w-full h-full flex flex-col">
            {/* Header - Auto-hiding */}
            <div 
              className={`flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/80 to-transparent transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <button 
                onClick={() => setShowImageViewer(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="text-sm text-gray-300 font-medium">
                {currentImageIndex + 1} / {chapterImages.length}
              </span>
            </div>

            {/* Image Display - Full Screen */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-black">
              {viewerError ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-400">{viewerError}</p>
                </div>
              ) : (
                <>
                  {/* Left Navigation Button */}
                  <button 
                    onClick={prevPage}
                    className={`absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center hover:bg-white/10 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'} group z-20`}
                  >
                    <ChevronLeft className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Image */}
                  <img 
                    src={chapterImages[currentImageIndex]}
                    alt={`صفحة ${currentImageIndex + 1}`}
                    className="max-h-full max-w-full object-contain select-none"
                    draggable={false}
                  />

                  {/* Right Navigation Button */}
                  <button 
                    onClick={nextPage}
                    className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center hover:bg-white/10 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'} group z-20`}
                  >
                    <ChevronRight className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                  </button>
                </>
              )}
            </div>

            {/* Progress Bar - Auto-hiding */}
            <div 
              className={`w-full h-1 bg-gray-800 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 transition-all duration-200"
                style={{ width: `${((currentImageIndex + 1) / chapterImages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
