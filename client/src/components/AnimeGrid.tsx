import { useState, useMemo } from 'react';
import { animeData, genres } from '@/lib/animeData';
import AnimeCard from './AnimeCard';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnimeGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const filteredAnime = useMemo(() => {
    return animeData.filter(anime => {
      const matchesSearch = anime.title.includes(searchQuery) || anime.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenres.length === 0 || selectedGenres.some(g => anime.genre.includes(g));
      const matchesStatus = !selectedStatus || anime.status === selectedStatus;
      return matchesSearch && matchesGenre && matchesStatus;
    });
  }, [searchQuery, selectedGenres, selectedStatus]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <section className="py-16 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">مكتبة الأنمي</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full"></div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-accent pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن أنمي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-secondary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              الحالة
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStatus === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('')}
                className="text-xs"
              >
                الكل
              </Button>
              <Button
                variant={selectedStatus === 'مكتمل' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('مكتمل')}
                className="text-xs"
              >
                مكتمل
              </Button>
              <Button
                variant={selectedStatus === 'جاري البث' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('جاري البث')}
                className="text-xs"
              >
                جاري البث
              </Button>
              <Button
                variant={selectedStatus === 'قريباً' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('قريباً')}
                className="text-xs"
              >
                قريباً
              </Button>
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">الأنواع</h3>
            <div className="flex flex-wrap gap-2">
              {genres.map(genre => (
                <Button
                  key={genre}
                  variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleGenre(genre)}
                  className="text-xs"
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-400 mb-6">
          تم العثور على <span className="text-accent font-semibold">{filteredAnime.length}</span> أنمي
        </p>

        {/* Anime Grid */}
        {filteredAnime.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnime.map(anime => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">لم يتم العثور على أي أنمي</p>
            <p className="text-gray-500 text-sm mt-2">جرب تغيير معايير البحث</p>
          </div>
        )}
      </div>
    </section>
  );
}
