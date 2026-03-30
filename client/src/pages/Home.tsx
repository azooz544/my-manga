import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MangaGrid from '@/components/MangaGrid';
import Footer from '@/components/Footer';

/**
 * Design Philosophy: Modern Bold
 * - Dark background with purple and cyan accents
 * - Arabic-friendly typography (Tajawal)
 * - Dynamic layout with smooth transitions
 * - High contrast for better readability
 * 
 * Team A - Manga Download Site
 * Powered by Manga Hook API
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />
      <MangaGrid />
      <Footer />
    </div>
  );
}
