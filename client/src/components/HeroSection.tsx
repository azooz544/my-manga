import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

const HERO_IMAGE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-hero-banner-DCdpXstpHhkvzihaz3Y6kJ.webp';

export default function HeroSection() {
  return (
    <section
      className="relative w-full h-screen bg-cover bg-center pt-16 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(15, 15, 15, 0.7), rgba(107, 33, 168, 0.3)), url('${HERO_IMAGE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 h-full flex flex-col justify-center items-start">
        <div className="max-w-2xl">
          {/* Title */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
              مرحباً بك في عالم <span className="bg-gradient-to-l from-cyan-400 to-purple-600 bg-clip-text text-transparent">المانجا</span>
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full"></div>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
            اكتشف أفضل سلاسل المانجا والكوميكس اليابانية بجودة عالية وتحميل سريع. انضم إلى ملايين المعجبين حول العالم.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-600/50"
            >
              <Play className="w-5 h-5" />
              ابدأ القراءة الآن
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-gray-700">
            <div>
              <p className="text-3xl font-bold text-cyan-500">500+</p>
              <p className="text-gray-400">سلسلة مانجا</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">10K+</p>
              <p className="text-gray-400">فصل</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-cyan-500">24/7</p>
              <p className="text-gray-400">متاح</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
