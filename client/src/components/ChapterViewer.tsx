import { useState, useEffect } from 'react';
import { getChapterDetail } from '@/lib/mangaService';
import { ChevronLeft, ChevronRight, Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChapterViewerProps {
  mangaId: string;
  chapterId: string;
  chapterName?: string;
  onClose?: () => void;
}

export default function ChapterViewer({
  mangaId,
  chapterId,
  chapterName,
  onClose
}: ChapterViewerProps) {
  const [images, setImages] = useState<Array<{ title: string; image: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getChapterDetail(mangaId, chapterId);
        setImages(data.images);
      } catch (err) {
        setError('فشل في تحميل الفصل');
        console.error('Error fetching chapter:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [mangaId, chapterId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">{error || 'لا توجد صور للفصل'}</p>
          <Button onClick={onClose} variant="outline">
            إغلاق
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = images[currentPage];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-secondary border-b border-border p-4 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-bold">{chapterName || 'الفصل'}</h3>
          <p className="text-xs text-gray-400">
            الصفحة {currentPage + 1} من {images.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Download functionality
              const link = document.createElement('a');
              link.href = currentImage.image;
              link.download = `page-${currentPage + 1}.jpg`;
              link.click();
            }}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            إغلاق
          </Button>
        </div>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <img
          src={currentImage.image}
          alt={`Page ${currentPage + 1}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x800?text=Error+Loading+Image';
          }}
        />
      </div>

      {/* Navigation */}
      <div className="bg-secondary border-t border-border p-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </Button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={images.length}
            value={currentPage + 1}
            onChange={(e) => {
              const page = Math.min(Math.max(1, parseInt(e.target.value)), images.length) - 1;
              setCurrentPage(page);
            }}
            className="w-16 px-2 py-1 bg-background border border-border rounded text-white text-center text-sm"
          />
          <span className="text-gray-400 text-sm">/ {images.length}</span>
        </div>

        <Button
          variant="outline"
          onClick={() => setCurrentPage(Math.min(images.length - 1, currentPage + 1))}
          disabled={currentPage === images.length - 1}
          className="gap-2"
        >
          التالي
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
