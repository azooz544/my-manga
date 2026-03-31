import { useLocation, useRoute } from 'wouter';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { trpcClient } from '@/lib/trpcClient';

interface Manga {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
}

export default function SearchResults() {
  const [location, navigate] = useLocation();
  const [route, params] = useRoute('/search/:query');
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = params?.query ? decodeURIComponent(params.query) : '';

  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const searchResults = await trpcClient.manga.search(query);
        
        // Safely convert results to proper format
        const formattedResults = (searchResults || []).map((manga: any) => ({
          id: typeof manga.id === 'string' ? manga.id : '',
          title: typeof manga.title === 'string' ? manga.title : (manga.title?.en || 'بدون عنوان'),
          coverUrl: typeof manga.coverUrl === 'string' ? manga.coverUrl : '',
          description: typeof manga.description === 'string' ? manga.description : ''
        }));
        
        setResults(formattedResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ في البحث');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="العودة للرئيسية"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">نتائج البحث</h1>
            <p className="text-sm text-muted-foreground">
              {query && `البحث عن: "${query}"`}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3">جاري البحث...</span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
            <p className="font-semibold">خطأ في البحث</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              لم يتم العثور على نتائج للبحث عن "{query}"
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              تم العثور على {results.length} نتيجة
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((manga) => (
                <button
                  key={manga.id}
                  onClick={() => navigate(`/manga/${manga.id}`)}
                  className="group relative overflow-hidden rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  {/* Manga cover image */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                    <img
                      src={manga.coverUrl}
                      alt={manga.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"%3E%3Crect fill="%23333" width="200" height="300"/%3E%3Ctext x="50%" y="50%" font-size="14" fill="%23666" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white font-semibold">اقرأ الآن</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm line-clamp-2 text-left">
                      {manga.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 text-left">
                      {manga.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
