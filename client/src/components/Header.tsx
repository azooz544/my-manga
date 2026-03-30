import { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { Link } from 'wouter';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-background border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div className="flex flex-col hidden sm:block">
              <span className="text-lg font-bold text-white leading-tight">Team A</span>
              <span className="text-xs text-gray-400">المانجا</span>
            </div>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/">
            <a className="text-foreground hover:text-accent transition-colors">الرئيسية</a>
          </Link>
          <a href="#" className="text-foreground hover:text-accent transition-colors">الأنواع</a>
          <a href="#" className="text-foreground hover:text-accent transition-colors">الأخبار</a>
          <a href="#" className="text-foreground hover:text-accent transition-colors">اتصل بنا</a>
        </nav>

        {/* Search and Mobile Menu */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <Search className="w-5 h-5 text-accent" />
          </button>

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
              <a className="text-foreground hover:text-accent transition-colors py-2">الرئيسية</a>
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
