import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AnimeGrid from '@/components/AnimeGrid';
import Footer from '@/components/Footer';

/**
 * Design Philosophy: Modern Bold
 * - Dark background with purple and cyan accents
 * - Arabic-friendly typography (Tajawal)
 * - Dynamic layout with smooth transitions
 * - High contrast for better readability
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />
      <AnimeGrid />
      <Footer />
    </div>
  );
}
