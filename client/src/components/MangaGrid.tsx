import { useState, useEffect, useMemo } from 'react';
import { getTopManga, searchManga, transformJikanManga } from '@/lib/jikanService';
import MangaCard from './MangaCard';
import { Search, Filter, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MangaItem {
  id: string;
  image: string;
  title: string;
  chapter: string;
  view: string;
  description: string;
}

export default function MangaGrid() {
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState('all');

  // Fetch manga data from Jikan API
  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (searchQuery.trim()) {
          response = await searchManga(searchQuery, currentPage);
        } else {
          // Fetch top manga by default
          response = await getTopManga(currentPage, 'manga');
        }
        
        if (response && response.data && Array.isArray(response.data)) {
          const transformedManga = response.data.map(transformJikanManga);
          setMangaList(transformedManga);
        } else {
          setMangaList([]);
          setError('لم يتم العثور على بيانات المانجا');
        }
      } catch (err) {
        setError('فشل في تحميل بيانات المانجا. يرجى المحاولة لاحقاً.');
        console.error('Error fetching manga:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchManga();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, selectedType, searchQuery]);

  // Manga list is already filtered by API
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
            نوع الترتيب
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedType('all');
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              الأفضل
            </Button>
            <Button
              variant={selectedType === 'manga' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedType('manga');
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              الأكثر تقييماً
            </Button>
            <Button
              variant={selectedType === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedType('upcoming');
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              الجديدة
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

        {/* Pagination */}
        {!loading && mangaList.length > 0 && (
          <div className="flex justify-center gap-4 mt-12">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-white">الصفحة {currentPage}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => p + 1)}
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
