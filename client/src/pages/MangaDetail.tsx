import { useParams, Link } from 'wouter';
import { getMangaById } from '@/lib/jikanService';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Play, Star, Calendar, BookOpen, Tag, Loader, ArrowRight, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
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

export default function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<MangaDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [chapterImages, setChapterImages] = useState<string[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [comickHid, setComickHid] = useState<string | null>(null);

  useEffect(() => {
    const fetchMangaDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const response = await getMangaById(parseInt(id));
          const mangaData = response.data;
          setManga(mangaData);
          
          try {
            setLoadingChapters(true);
            // البحث عن المانجا على ComicK
            const searchQuery = mangaData.title_english || mangaData.title;
            const searchRes = await fetch(`/api/trpc/manga.search?input=${encodeURIComponent(JSON.stringify({ json: searchQuery }))}`).then(r => r.json()).then(d => d.result?.data || []);
            
            if (searchRes && searchRes.length > 0) {
              const hid = searchRes[0].hid;
              setComickHid(hid);
            }
          } catch (chapErr) {
            console.error('Error fetching chapters:', chapErr);
            setLoadingChapters(false);
          }
        }
      } catch (err) {
        setError('فشل في تحميل بيانات المانجا');
      } finally {
        setLoading(false);
      }
    };

    fetchMangaDetail();
  }, [id]);

  // استدعاء الفصول عند تحديد المانجا
  const chaptersQuery = trpc.manga.getChapters.useQuery(comickHid || '', {
    enabled: !!comickHid,
  });

  // تحديث الفصول عند تحميلها
  useEffect(() => {
    if (chaptersQuery.data) {
      setChapters(chaptersQuery.data);
      setLoadingChapters(false);
    }
  }, [chaptersQuery.data]);

  const handleChapterSelect = async (chapterId: string) => {
    try {
      setChapterImages([]); 
      setViewerError(null);
      
      // استدعاء API لجلب صور الفصل من ComicK
      const imagesRes = await fetch(`/api/trpc/manga.getChapterImages?input=${encodeURIComponent(JSON.stringify({ json: chapterId }))}`).then(r => r.json());
      const images = imagesRes.result?.data || [];
      
      if (!images || images.length === 0) {
        setViewerError("هذا الفصل لا يحتوي على صور متاحة.");
        return;
      }
      
      setChapterImages(images);
      setSelectedChapter(chapterId);
      setCurrentImageIndex(0);
      setShowImageViewer(true);
    } catch (err: any) {
      console.error('Error loading chapter:', err);
      setViewerError("حدث خطأ في تحميل صور الفصل. حاول مرة أخرى.");
    }
  };

  const nextPage = useCallback(() => {
    setCurrentImageIndex((prev) => Math.min(chapterImages.length - 1, prev + 1));
  }, [chapterImages.length]);

  const prevPage = useCallback(() => {
    setCurrentImageIndex((prev) => Math.max(0, prev - 1));
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
              onClick={() => chapters.length > 0 && handleChapterSelect(chapters[0].hid)}
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
                  <p className="font-bold">{manga.chapters || 'N/A'}</p>
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
          ) : chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لم يتم العثور على فصول متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter) => (
                <button
                  key={chapter.hid}
                  onClick={() => handleChapterSelect(chapter.hid)}
                  className="p-4 bg-card hover:bg-card/80 rounded-lg transition-all hover:shadow-lg"
                >
                  <h4 className="font-bold text-right">{chapter.title || `الفصل ${chapter.chap}`}</h4>
                  <p className="text-sm text-gray-400 text-right">الفصل: {chapter.chap}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      {showImageViewer && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black/50">
              <button 
                onClick={() => setShowImageViewer(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="text-sm text-gray-400">
                {currentImageIndex + 1} / {chapterImages.length}
              </span>
            </div>

            {/* Image Display */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              {viewerError ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-400">{viewerError}</p>
                </div>
              ) : (
                <>
                  <button 
                    onClick={prevPage}
                    className="absolute left-4 p-2 hover:bg-white/10 rounded-lg z-10"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>

                  <img 
                    src={chapterImages[currentImageIndex]}
                    alt={`صفحة ${currentImageIndex + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />

                  <button 
                    onClick={nextPage}
                    className="absolute right-4 p-2 hover:bg-white/10 rounded-lg z-10"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-cyan-500"
                style={{ width: `${((currentImageIndex + 1) / chapterImages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
