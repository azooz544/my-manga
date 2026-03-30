import { useState } from 'react';
import { Download, Star, Play } from 'lucide-react';
import { Anime } from '@/lib/animeData';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface AnimeCardProps {
  anime: Anime;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  return (
    <div
      className="group relative rounded-lg overflow-hidden bg-card border border-border transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-purple-600/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-video overflow-hidden bg-secondary">
        <img
          src={anime.image}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                anime.status === 'مكتمل' ? 'bg-green-600 text-white' :
                anime.status === 'جاري البث' ? 'bg-blue-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {anime.status}
              </span>
              <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">{anime.rating}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href={`/anime/${anime.id}`}>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2 text-sm"
                >
                  <Play className="w-4 h-4" />
                  مشاهدة
                </Button>
              </Link>
              <div className="relative">
                <Button
                  className="bg-cyan-500 hover:bg-cyan-600 text-black gap-2 text-sm"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>

                {/* Download Menu */}
                {showDownloadMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-secondary border border-border rounded-lg shadow-lg z-10 min-w-max">
                    {anime.downloadLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.link}
                        className="block px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {link.quality} ({link.size})
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
          {anime.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {anime.titleEn}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
          {anime.description}
        </p>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-3">
          {anime.genre.slice(0, 2).map((g, idx) => (
            <span
              key={idx}
              className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full"
            >
              {g}
            </span>
          ))}
          {anime.genre.length > 2 && (
            <span className="text-xs text-gray-500">+{anime.genre.length - 2}</span>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-border">
          <span>{anime.episodes} حلقة</span>
          <span>{anime.year}</span>
        </div>
      </div>
    </div>
  );
}
