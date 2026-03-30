import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface MangaCardProps {
  manga: {
    id: string;
    image: string;
    title: string;
    chapter: string;
    view: string;
    description: string;
  };
}

export default function MangaCard({ manga }: MangaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="block group">
      <Link href={`/manga/${manga.id}`}>
        <div
          className="relative rounded-lg overflow-hidden bg-card border border-border transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-purple-600/20 cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Container */}
          <div className="relative w-full aspect-video overflow-hidden bg-secondary">
            <img
              src={manga.image}
              alt={manga.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Manga';
              }}
            />

            {/* Overlay */}
            {isHovered && (
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2 text-sm">
                    <Eye className="w-4 h-4" />
                    اقرأ الآن
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
              {manga.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
              {manga.description || 'لا توجد وصف متاح'}
            </p>

            {/* Meta Info */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{manga.view}</span>
              </div>
              <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full">
                {manga.chapter}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
