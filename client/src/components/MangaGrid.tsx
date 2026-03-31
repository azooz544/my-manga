import { useState, useEffect, useMemo } from 'react';
import MangaCard from './MangaCard';
import { Search, Filter, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpcClient } from '@/lib/trpcClient';

interface MangaItem {
  id: string;
  image: string;
  title: string;
  chapter: string;
  view: string;
  description: string;
  rating?: number;
  type?: string;
}

export default function MangaGrid() {
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Fetch manga data from database
  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call the backend to get all manga
        const response = await trpcClient.manga.getAll({
          type: selectedType === 'all' ? undefined : selectedType,
        });

        if (response && Array.isArray(response)) {
          // Transform database manga to MangaItem format
          let transformed = response.map((manga: any) => ({
            id: manga.id.toString(),
            image: manga.coverUrl || '/placeholder-manga.png',
            title: manga.title,
            chapter: `${manga.year}`,
            view: `${manga.rating || 0}⭐`,
            description: manga.description || 'لا توجد وصفة متاحة',
            rating: manga.rating,
            type: manga.type,
          }));

          // Filter by search query
          if (searchQuery.trim()) {
            transformed = transformed.filter(m =>
              m.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }

          setMangaList(transformed);
        } else {
          setMangaList([]);
          setError('لم يتم العثور على بيانات المانجا');
        }
      } catch (err: any) {
        setError(`فشل في تحميل بيانات المانجا: ${err?.message || 'خطأ غير معروف'}`);
        console.error('Error fetching manga:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchManga();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [selectedType, searchQuery]);

  // Manga list is already filtered
  const filteredManga = useMemo(() => {
    return mangaList;
  }, [mangaList]);

  return (
    <section className="py-16 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">مكتبة المانجا</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full"></div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-accent pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن مانجا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-secondary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            نوع المحتوى
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
              className="text-xs"
            >
              الكل
            </Button>
            <Button
              variant={selectedType === 'manga' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('manga')}
              className="text-xs"
            >
              مانجا
            </Button>
            <Button
              variant={selectedType === 'manhwa' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('manhwa')}
              className="text-xs"
            >
              مانهوا
            </Button>
            <Button
              variant={selectedType === 'manhua' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('manhua')}
              className="text-xs"
            >
              مانهوا صينية
            </Button>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-gray-400 mb-6">
            تم العثور على <span className="text-accent font-semibold">{filteredManga.length}</span> مانجا
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader className="w-8 h-8 text-accent animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Manga Grid */}
        {!loading && filteredManga.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredManga.map(manga => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredManga.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">لم يتم العثور على أي مانجا</p>
            <p className="text-gray-500 text-sm mt-2">جرب تغيير معايير البحث</p>
          </div>
        )}
      </div>
    </section>
  );
}
