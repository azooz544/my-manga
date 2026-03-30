import { useParams, Link } from 'wouter';
import { getMangaById } from '@/lib/jikanService';
import { getMangaWithChapters, getChapterPages, buildImageUrl } from '@/lib/mangadexService';
import { Button } from '@/components/ui/button';
import { Play, Star, Calendar, BookOpen, Tag, Loader, ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface MangaDetailData {
  mal_id: number;
  title: string;
  title_english: string;
  synopsis: string;
  images: {
    jpg: {
      large_image_url: string;
    };
  };
  authors: Array<{
    name: string;
  }>;
  status: string;
  chapters: number;
  volumes: number;
  score: number;
  genres: Array<{
    name: string;
  }>;
  published: {
    from: string;
  };
}

export default function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<MangaDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [chapterImages, setChapterImages] = useState<string[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  // جلب البيانات
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
            const searchQuery = mangaData.title_english || mangaData.title;
            const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(searchQuery)}`);
            const searchData = await searchRes.json();

            if (searchData.data && searchData.data.length > 0) {
              const mangaDexId = searchData.data[0].id;
              const chaptersData = await getMangaWithChapters(mangaDexId);
              
              if (chaptersData && chaptersData.chapters) {
                setChapters(chaptersData.chapters);
                
                if (chaptersData.chapters.length > 0) {
                  const firstChapter = chaptersData.chapters[0];
                  try {
                    const pages = await getChapterPages(firstChapter.id);
                    const images = pages.chapter.data.map((imageName: string) =>
                      buildImageUrl(pages.baseUrl, pages.chapter.hash, imageName)
                    );
                    setChapterImages(images);
                    setSelectedChapter(firstChapter.id);
                  } catch (pageErr) {
                    console.error('Error fetching chapter pages:', pageErr);
                  }
                }
              }
            }
          } catch (chapErr) {
            console.error('Error fetching chapters from MangaDex:', chapErr);
          }
        }
      } catch (err) {
        setError('فشل في تحميل بيانات المانجا');
        console.error('Error fetching manga detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMangaDetail();
  }, [id]);

  // دوال التنقل في صفحات المانجا
  const nextPage = useCallback(() => {
    setCurrentImageIndex((prev) => Math.min(chapterImages.length - 1, prev + 1));
  }, [chapterImages.length]);

  const prevPage = useCallback(() => {
    setCurrentImageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // التحكم بالكيبورد (الأسهم يمين/يسار للتقليب، وEsc للإغلاق)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageViewer) return;
      
      if (e.key === 'ArrowLeft') {
        nextPage(); // السهم الأيسر ينقلك للصفحة التالية (نظام المانجا)
      } else if (e.key === 'ArrowRight') {
        prevPage(); // السهم الأيمن ينقلك للصفحة السابقة
      } else if (e.key === 'Escape') {
        setShowImageViewer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageViewer, nextPage, prevPage]);

  const handleChapterSelect = async (chapterId: string) => {
    try {
      setChapterImages([]); // تصفير الصور لعرض اللودينج
      const pages = await getChapterPages(chapterId);
      const images = pages.chapter.data.map((imageName: string) =>
        buildImageUrl(pages.baseUrl, pages.chapter.hash, imageName)
      );
      setChapterImages(images);
      setSelectedChapter(chapterId);
      setCurrentImageIndex(0);
    } catch (err) {
      console.error('Error loading chapter:', err);
    }
  };

  // التحكم في النقر على الصورة للتقليب
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const { clientX, target } = e;
    const { left, width } = (target as HTMLImageElement).getBoundingClientRect();
    const clickX = clientX - left;
    
    // إذا ضغط على النصف الأيسر يروح للصفحة التالية، النصف الأيمن للصفحة السابقة
    if (clickX < width / 2) {
      nextPage();
    } else {
      prevPage();
    }
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
              <ArrowRight className="w-4 h-4" />
              العودة إلى الرئيسية
            </div>
          </Link>
        </div>
      </div>
    );
  }

  const publishYear = new Date(manga.published.from).getFullYear();
  const authorNames = manga.authors.map(a => a.name).join(', ');

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* جزء معلومات المانجا (لم يتغير) */}
      <div
        className="relative w-full h-96 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 15, 15, 0.8), rgba(107, 33, 168, 0.4)), url('${manga.images.jpg.large_image_url}')`,
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
      </div>

      <div className="container relative -mt-32 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* الشريط الجانبي */}
          <div className="md:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-24">
              <img
                src={manga.images.jpg.large_image_url}
                alt={manga.title}
                className="w-full aspect-video object-cover"
              />
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">التقييم</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-white font-bold">{manga.score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    manga.status === 'Finished' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {manga.status === 'Finished' ? 'مكتملة' : 'جاري النشر'}
                  </span>
                </div>
                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={() => setShowImageViewer(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    <Play className="w-4 h-4" />
                    اقرأ الآن
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8 mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">{manga.title}</h1>
              <p className="text-lg text-gray-400 mb-6">بقلم: {authorNames || 'غير معروف'}</p>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">الوصف</h2>
                <p className="text-gray-300 leading-relaxed line-clamp-6">{manga.synopsis}</p>
              </div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">الأنواع</h2>
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 bg-purple-600/20 text-purple-300 px-4 py-2 rounded-full">
                      <Tag className="w-4 h-4" />
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* قائمة الفصول */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                الفصول ({chapters.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        handleChapterSelect(chapter.id);
                        setShowImageViewer(true);
                      }}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors group ${
                        selectedChapter === chapter.id ? 'bg-purple-600/20 border-purple-500' : 'bg-secondary border-border hover:border-accent'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium group-hover:text-accent transition-colors">
                          الفصل {chapter.attributes?.chapter || 'بدون رقم'}
                        </p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-accent" />
                    </button>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">لا توجد فصول متاحة</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* قارئ المانجا الاحترافي (Reader Mode) */}
      {showImageViewer && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between select-none">
          
          {/* الشريط العلوي */}
          <div className="w-full flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
            <div className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
              صفحة {currentImageIndex + 1} / {chapterImages.length || 0}
            </div>
            <button
              onClick={() => setShowImageViewer(false)}
              className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* مساحة عرض الصورة */}
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative mt-12 mb-12">
            {chapterImages.length > 0 ? (
              <img
                src={chapterImages[currentImageIndex]}
                alt={`صفحة ${currentImageIndex + 1}`}
                onClick={handleImageClick}
                className="max-h-full max-w-full object-contain cursor-pointer transition-transform duration-200"
                style={{ cursor: 'url(https://cdn-icons-png.flaticon.com/32/1159/1159633.png) 16 16, auto' }} // مؤشر يدل على إمكانية النقر
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x800?text=Error+Loading+Image';
                }}
              />
            ) : (
              <div className="text-gray-400 text-center flex flex-col items-center">
                <Loader className="w-10 h-10 animate-spin mb-4 text-purple-500" />
                <p className="text-lg">جاري تحميل الفصل...</p>
              </div>
            )}
          </div>

          {/* شريط التقدم السفلي */}
          <div className="w-full h-1 bg-gray-800 absolute bottom-0">
            <div 
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${((currentImageIndex + 1) / chapterImages.length) * 100}%` }}
            ></div>
          </div>
          
        </div>
      )}
    </div>
  );
}
