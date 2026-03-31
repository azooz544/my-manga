import { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-background border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo with Favicon */}
        <Link href="/">
          <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
            {/* Favicon Image */}
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/favicon-hero-manga-Ewb7sR9fzBexWPBNvF49Mu.webp" 
              alt="Team A Logo" 
              className="w-12 h-12 rounded-lg object-cover shadow-lg"
            />
            <div className="flex flex-col hidden sm:block">
              <span className="text-lg font-bold text-white leading-tight">Team A</span>
              <span className="text-xs text-gray-400">المانجا</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          <Link href="/">
            <div className="text-foreground hover:text-accent transition-colors cursor-pointer">الرئيسية</div>
          </Link>
          <a href="#" className="text-foreground hover:text-accent transition-colors">الأنواع</a>
          <a href="#" className="text-foreground hover:text-accent transition-colors">الأخبار</a>
          <a href="#" className="text-foreground hover:text-accent transition-colors">اتصل بنا</a>
        </nav>

        {/* Search and Mobile Menu */}
        <div className="flex items-center gap-4 ml-auto">
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <input
              type="text"
              placeholder="ابحث عن مانجا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-secondary rounded-l-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted-foreground"
            />
            <button
              type="submit"
              className="p-2 hover:bg-accent bg-secondary rounded-r-lg transition-colors border border-border border-l-0"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
          </form>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-accent" />
            ) : (
              <Menu className="w-5 h-5 text-accent" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-secondary border-t border-border">
          <div className="container py-4 flex flex-col gap-3">
            <Link href="/">
              <div className="text-foreground hover:text-accent transition-colors py-2 cursor-pointer">الرئيسية</div>
            </Link>
            <a href="#" className="text-foreground hover:text-accent transition-colors py-2">الأنواع</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors py-2">الأخبار</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors py-2">اتصل بنا</a>
          </div>
        </nav>
      )}
    </header>
  );
}
