import { useParams } from 'wouter';
import { animeData } from '@/lib/animeData';
import { Button } from '@/components/ui/button';
import { Play, Download, Star, Calendar, Tv, Tag } from 'lucide-react';
import { useState } from 'react';

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const anime = animeData.find(a => a.id === parseInt(id || '0'));
  const [selectedQuality, setSelectedQuality] = useState(0);

  if (!anime) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">لم يتم العثور على الأنمي</h1>
          <a href="/" className="text-accent hover:underline">العودة إلى الرئيسية</a>
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
          backgroundImage: `linear-gradient(135deg, rgba(15, 15, 15, 0.8), rgba(107, 33, 168, 0.4)), url('${anime.image}')`,
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
                src={anime.image}
                alt={anime.title}
                className="w-full aspect-video object-cover"
              />
              <div className="p-6 space-y-4">
                {/* Status */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    anime.status === 'مكتمل' ? 'bg-green-600 text-white' :
                    anime.status === 'جاري البث' ? 'bg-blue-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {anime.status}
                  </span>
                </div>

                {/* Rating */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">التقييم</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-lg font-bold text-white">{anime.rating}</span>
                    <span className="text-xs text-gray-400">/10</span>
                  </div>
                </div>

                {/* Episodes */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">عدد الحلقات</p>
                  <div className="flex items-center gap-2 text-white">
                    <Tv className="w-4 h-4" />
                    <span>{anime.episodes}</span>
                  </div>
                </div>

                {/* Year */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">السنة</p>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="w-4 h-4" />
                    <span>{anime.year}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    <Play className="w-4 h-4" />
                    مشاهدة الآن
                  </Button>
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black gap-2">
                    <Download className="w-4 h-4" />
                    تحميل الآن
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8">
              {/* Title */}
              <h1 className="text-4xl font-bold text-white mb-2">{anime.title}</h1>
              <p className="text-lg text-gray-400 mb-6">{anime.titleEn}</p>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">الوصف</h2>
                <p className="text-gray-300 leading-relaxed">{anime.description}</p>
              </div>

              {/* Genres */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">الأنواع</h2>
                <div className="flex flex-wrap gap-2">
                  {anime.genre.map((g, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 bg-purple-600/20 text-purple-300 px-4 py-2 rounded-full"
                    >
                      <Tag className="w-4 h-4" />
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Download Options */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">خيارات التحميل</h2>
                <div className="space-y-3">
                  {anime.downloadLinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedQuality(idx)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedQuality === idx
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{link.quality}</p>
                          <p className="text-sm text-gray-400">حجم الملف: {link.size}</p>
                        </div>
                        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
                          <Download className="w-4 h-4 mr-2" />
                          تحميل
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">معلومات إضافية</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">نوع الأنمي</p>
                    <p className="text-white font-semibold">سلسلة تلفزيونية</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">الاستوديو</p>
                    <p className="text-white font-semibold">استوديو متخصص</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">المخرج</p>
                    <p className="text-white font-semibold">مخرج محترف</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">الموسم</p>
                    <p className="text-white font-semibold">{anime.year}</p>
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
