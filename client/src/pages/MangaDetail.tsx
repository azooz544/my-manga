import { useParams, Link } from 'wouter';
import { getMangaById } from '@/lib/jikanService';
import { getMangaWithChapters, getChapterPages, buildImageUrl } from '@/lib/mangadexService';
import { Button } from '@/components/ui/button';
import { Play, Star, Calendar, BookOpen, Tag, Loader, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchMangaDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const response = await getMangaById(parseInt(id));
          setManga(response.data);
          
          // Try to fetch chapters from MangaDex
          try {
            const chaptersData = await getMangaWithChapters(id);
            setChapters(chaptersData.chapters);
            
            // Load first chapter images
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

  const handleChapterSelect = async (chapterId: string) => {
    try {
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
      {/* Hero Section */}
      <div
        className="relative w-full h-96 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 15, 15, 0.8), rgba(107, 33, 168, 0.4)), url('${manga.images.jpg.large_image_url}')`,
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
      </div>

      {/* Content */}
      <div className="container relative -mt-32 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-24">
              <img
                src={manga.images.jpg.large_image_url}
                alt={manga.title}
                className="w-full aspect-video object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Manga';
                }}
              />
              <div className="p-6 space-y-4">
                {/* Rating */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">التقييم</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-white font-bold">{manga.score}</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    manga.status === 'Finished' ? 'bg-green-600 text-white' :
                    manga.status === 'Publishing' ? 'bg-blue-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {manga.status === 'Finished' ? 'مكتملة' : manga.status === 'Publishing' ? 'جاري النشر' : 'قريباً'}
                  </span>
                </div>

                {/* Chapters */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">عدد الفصول</p>
                  <div className="flex items-center gap-2 text-white">
                    <BookOpen className="w-4 h-4" />
                    <span>{manga.chapters || 'غير محدد'}</span>
                  </div>
                </div>

                {/* Published */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">سنة النشر</p>
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{publishYear}</span>
                  </div>
                </div>

                {/* Action Buttons */}
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

          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8 mb-8">
              {/* Title */}
              <h1 className="text-4xl font-bold text-white mb-2">{manga.title}</h1>
              {manga.title_english && (
                <p className="text-lg text-gray-400 mb-6">{manga.title_english}</p>
              )}
              <p className="text-lg text-gray-400 mb-6">بقلم: {authorNames || 'غير معروف'}</p>

              {/* Synopsis */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">الوصف</h2>
                <p className="text-gray-300 leading-relaxed line-clamp-6">
                  {manga.synopsis || 'لا يوجد وصف متاح'}
                </p>
              </div>

              {/* Genres */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">الأنواع</h2>
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 bg-purple-600/20 text-purple-300 px-4 py-2 rounded-full"
                    >
                      <Tag className="w-4 h-4" />
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">معلومات إضافية</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">عدد الفصول</p>
                    <p className="text-white font-semibold">{manga.chapters || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">عدد المجلدات</p>
                    <p className="text-white font-semibold">{manga.volumes || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">الحالة</p>
                    <p className="text-white font-semibold">
                      {manga.status === 'Finished' ? 'مكتملة' : 'جاري النشر'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">التقييم</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {manga.score}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters Preview */}
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
                        selectedChapter === chapter.id
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-secondary border-border hover:border-accent'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium group-hover:text-accent transition-colors">
                          الفصل {chapter.attributes.chapter || 'بدون رقم'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(chapter.attributes.publishAt).toLocaleDateString('ar-SA')}
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

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center pt-16">
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-20 right-4 text-white hover:text-accent transition-colors z-50"
            >
              <span className="text-2xl">✕</span>
            </button>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center max-w-4xl w-full">
              {chapterImages.length > 0 ? (
                <img
                  src={chapterImages[currentImageIndex]}
                  alt={`صفحة ${currentImageIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x800?text=Error+Loading+Image';
                  }}
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>جاري تحميل الصور...</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            {chapterImages.length > 0 && (
              <div className="flex items-center justify-between w-full max-w-4xl mt-6 gap-4">
                <button
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  disabled={currentImageIndex === 0}
                  className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="text-white text-center">
                  <p className="text-sm">صفحة {currentImageIndex + 1} من {chapterImages.length}</p>
                </div>

                <button
                  onClick={() => setCurrentImageIndex(Math.min(chapterImages.length - 1, currentImageIndex + 1))}
                  disabled={currentImageIndex === chapterImages.length - 1}
                  className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Keyboard Navigation Hint */}
            <p className="text-gray-400 text-xs mt-4">استخدم الأسهم أو انقر على الأزرار للتنقل</p>
          </div>
        </div>
      )}
    </div>
  );
}
