import { useParams, Link } from 'wouter';
import { getMangaById } from '@/lib/jikanService';
import { buildImageUrl } from '@/lib/mangadexService';
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
  const [mangaDexId, setMangaDexId] = useState<string | null>(null);



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
            // البحث عن المانجا على MangaDex
            const searchQuery = mangaData.title_english || mangaData.title;
            const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(searchQuery)}&limit=1`);
            const searchData = await searchRes.json();

            if (searchData.data && searchData.data.length > 0) {
              const dexId = searchData.data[0].id;
              setMangaDexId(dexId);
            }
          } catch (chapErr) {
            console.error('Error fetching chapters:', chapErr);
          } finally {
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
  const chaptersQuery = trpc.manga.getChapters.useQuery(mangaDexId || '', {
    enabled: !!mangaDexId,
  });

  // تحديث الفصول عند تحميلها
  React.useEffect(() => {
    if (chaptersQuery.data) {
      setChapters(chaptersQuery.data);
      setLoadingChapters(false);
    }
  }, [chaptersQuery.data]);

  const handleChapterSelect = async (chapterId: string) => {
    try {
      setChapterImages([]); 
      setViewerError(null);
      
      // استدعاء API لجلب صور الفصل
      const response = await fetch(`/api/trpc/manga.getChapterPages?input=${encodeURIComponent(JSON.stringify({ json: chapterId }))}`);
      const result = await response.json();
      const pages = result.result?.data;
      
      if (!pages || !pages.chapter || !pages.chapter.data || pages.chapter.data.length === 0) {
        setViewerError("هذا الفصل لا يحتوي على صور متاحة.");
        return;
      }

      const images = pages.chapter.data.map((imageName: string) =>
        buildImageUrl(pages.baseUrl, pages.chapter.hash, imageName)
      );
      
      setChapterImages(images);
      setSelectedChapter(chapterId);
      setCurrentImageIndex(0);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageViewer) return;
      if (e.key === 'ArrowLeft') nextPage();
      else if (e.key === 'ArrowRight') prevPage();
      else if (e.key === 'Escape') setShowImageViewer(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageViewer, nextPage, prevPage]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const { clientX, target } = e;
    const { left, width } = (target as HTMLImageElement).getBoundingClientRect();
    if (clientX - left < width / 2) nextPage();
    else prevPage();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <Loader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">لم يتم العثور على المانجا</h1>
          <Link href="/">
            <div className="text-accent hover:underline flex items-center justify-center gap-2 cursor-pointer">
              <ArrowRight className="w-4 h-4" /> العودة إلى الرئيسية
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="relative w-full h-96 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(135deg, rgba(15, 15, 15, 0.8), rgba(107, 33, 168, 0.4)), url('${manga.images.jpg.large_image_url}')` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
      </div>

      <div className="container relative -mt-32 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-24">
              <img src={manga.images.jpg.large_image_url} alt={manga.title} className="w-full aspect-video object-cover" />
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">التقييم</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-white font-bold">{manga.score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">عدد الفصول المتاحة</p>
                  <div className="flex items-center gap-2 text-white">
                    <BookOpen className="w-4 h-4" />
                    <span>{chapters.length}</span>
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  <Button onClick={() => setShowImageViewer(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2" disabled={chapters.length === 0 || loadingChapters}>
                    <Play className="w-4 h-4" /> اقرأ الآن
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8 mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">{manga.title}</h1>
              <div className="mb-8 mt-6">
                <h2 className="text-xl font-bold text-white mb-4">الوصف</h2>
                <p className="text-gray-300 leading-relaxed line-clamp-6">{manga.synopsis}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> الفصول المتاحة ({chapters.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {loadingChapters ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-purple-500 animate-spin" />
                  </div>
                ) : chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        handleChapterSelect(chapter.id);
                        setShowImageViewer(true);
                      }}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors group ${selectedChapter === chapter.id ? 'bg-purple-600/20 border-purple-500' : 'bg-secondary border-border hover:border-accent'}`}
                    >
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium group-hover:text-accent transition-colors">
                          الفصل {chapter.attributes?.chapter || 'بدون رقم'} {chapter.attributes?.title ? `- ${chapter.attributes.title}` : ''}
                        </p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-accent" />
                    </button>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">لا توجد فصول متاحة للقراءة</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showImageViewer && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between select-none">
          <div className="w-full bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between absolute top-0 z-10 transition-opacity opacity-0 hover:opacity-100 sm:opacity-100">
            <div className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
              صفحة {chapterImages.length > 0 ? currentImageIndex + 1 : 0} / {chapterImages.length || 0}
            </div>
            <button onClick={() => setShowImageViewer(false)} className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative mt-12 mb-12">
            {viewerError ? (
              <div className="text-red-400 text-center flex flex-col items-center bg-red-900/20 p-8 rounded-lg border border-red-800/50">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">{viewerError}</p>
              </div>
            ) : chapterImages.length > 0 ? (
              <img
                src={chapterImages[currentImageIndex]}
                alt={`صفحة ${currentImageIndex + 1}`}
                onClick={handleImageClick}
                className="max-h-full max-w-full object-contain cursor-pointer transition-transform duration-200"
                style={{ cursor: 'url(https://cdn-icons-png.flaticon.com/32/1159/1159633.png) 16 16, auto' }}
              />
            ) : (
              <div className="text-gray-400 text-center flex flex-col items-center">
                <Loader className="w-10 h-10 animate-spin mb-4 text-purple-500" />
                <p className="text-lg">جاري تحميل الفصل...</p>
              </div>
            )}
          </div>

          <div className="w-full h-1 bg-gray-800 absolute bottom-0">
            <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${chapterImages.length > 0 ? ((currentImageIndex + 1) / chapterImages.length) * 100 : 0}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
