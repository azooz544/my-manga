import { useParams, Link } from 'wouter';
import { getMangaDetail } from '@/lib/mangaService';
import { Button } from '@/components/ui/button';
import { Play, Star, Calendar, BookOpen, Tag, Loader, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MangaDetail {
  imageUrl: string;
  name: string;
  author: string;
  status: string;
  updated: string;
  view: string;
  genres: string[];
  chapterList: Array<{
    id: string;
    path: string;
    name: string;
    view: string;
    createdAt: string;
  }>;
}

export default function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMangaDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const data = await getMangaDetail(id);
          setManga(data);
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
            <a className="text-accent hover:underline flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة إلى الرئيسية
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <div
        className="relative w-full h-96 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 15, 15, 0.8), rgba(107, 33, 168, 0.4)), url('${manga.imageUrl}')`,
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
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <img
                src={manga.imageUrl}
                alt={manga.name}
                className="w-full aspect-video object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Manga';
                }}
              />
              <div className="p-6 space-y-4">
                {/* Status */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    manga.status === 'Completed' ? 'bg-green-600 text-white' :
                    manga.status === 'Ongoing' ? 'bg-blue-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {manga.status === 'Completed' ? 'مكتمل' : manga.status === 'Ongoing' ? 'جاري البث' : 'قريباً'}
                  </span>
                </div>

                {/* Views */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">المشاهدات</p>
                  <div className="flex items-center gap-2 text-white">
                    <Play className="w-4 h-4" />
                    <span>{manga.view}</span>
                  </div>
                </div>

                {/* Updated */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">آخر تحديث</p>
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{manga.updated}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    <Play className="w-4 h-4" />
                    ابدأ القراءة
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8">
              {/* Title */}
              <h1 className="text-4xl font-bold text-white mb-2">{manga.name}</h1>
              <p className="text-lg text-gray-400 mb-6">بقلم: {manga.author}</p>

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
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  الفصول ({manga.chapterList.length})
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {manga.chapterList.slice(0, 20).map((chapter, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className="flex items-center justify-between p-3 bg-secondary border border-border rounded-lg hover:border-accent transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-accent transition-colors">
                          {chapter.name}
                        </p>
                        <p className="text-xs text-gray-500">{chapter.createdAt}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-4">{chapter.view}</span>
                    </a>
                  ))}
                  {manga.chapterList.length > 20 && (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">
                        و {manga.chapterList.length - 20} فصل آخر...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">معلومات إضافية</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">نوع المانجا</p>
                    <p className="text-white font-semibold">مانجا يابانية</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">المؤلف</p>
                    <p className="text-white font-semibold">{manga.author}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">الحالة</p>
                    <p className="text-white font-semibold">
                      {manga.status === 'Completed' ? 'مكتملة' : 'جاري النشر'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">عدد الفصول</p>
                    <p className="text-white font-semibold">{manga.chapterList.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
