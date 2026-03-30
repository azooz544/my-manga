export interface Anime {
  id: number;
  title: string;
  titleEn: string;
  description: string;
  image: string;
  rating: number;
  episodes: number;
  year: number;
  genre: string[];
  status: 'مكتمل' | 'جاري البث' | 'قريباً';
  downloadLinks: {
    quality: string;
    size: string;
    link: string;
  }[];
}

export const animeData: Anime[] = [
  {
    id: 1,
    title: 'هجوم العمالقة',
    titleEn: 'Attack on Titan',
    description: 'قصة درامية عن البشرية في صراع مستمر ضد العمالقة الغامضين الذين يهددون وجودهم.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 9.0,
    episodes: 139,
    year: 2013,
    genre: ['أكشن', 'دراما', 'خيال'],
    status: 'مكتمل',
    downloadLinks: [
      { quality: '1080p', size: '2.5GB', link: '#' },
      { quality: '720p', size: '1.2GB', link: '#' },
      { quality: '480p', size: '500MB', link: '#' }
    ]
  },
  {
    id: 2,
    title: 'ديث نوت',
    titleEn: 'Death Note',
    description: 'قصة مثيرة عن فتى يجد دفتراً سحرياً يمنحه قوة إنهاء حياة أي شخص.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 8.6,
    episodes: 37,
    year: 2006,
    genre: ['نفسي', 'دراما', 'غموض'],
    status: 'مكتمل',
    downloadLinks: [
      { quality: '1080p', size: '1.8GB', link: '#' },
      { quality: '720p', size: '900MB', link: '#' },
      { quality: '480p', size: '350MB', link: '#' }
    ]
  },
  {
    id: 3,
    title: 'ناروتو',
    titleEn: 'Naruto',
    description: 'تتبع رحلة ناروتو من كونه شخصاً ضعيفاً إلى أقوى نينجا في العالم.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 8.3,
    episodes: 720,
    year: 2002,
    genre: ['أكشن', 'مغامرة', 'خيال'],
    status: 'مكتمل',
    downloadLinks: [
      { quality: '1080p', size: '15GB', link: '#' },
      { quality: '720p', size: '8GB', link: '#' },
      { quality: '480p', size: '3GB', link: '#' }
    ]
  },
  {
    id: 4,
    title: 'ون بيس',
    titleEn: 'One Piece',
    description: 'قصة ملحمية عن بحار يسعى للعثور على الكنز الأسطوري وتحقيق حلمه.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 8.9,
    episodes: 1000,
    year: 1999,
    genre: ['أكشن', 'مغامرة', 'كوميديا'],
    status: 'جاري البث',
    downloadLinks: [
      { quality: '1080p', size: '20GB', link: '#' },
      { quality: '720p', size: '10GB', link: '#' },
      { quality: '480p', size: '4GB', link: '#' }
    ]
  },
  {
    id: 5,
    title: 'كود جياس',
    titleEn: 'Code Geass',
    description: 'قصة عن فتى يحصل على قوة سحرية تمنحه السيطرة على عقول الآخرين.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 8.7,
    episodes: 50,
    year: 2006,
    genre: ['أكشن', 'نفسي', 'دراما'],
    status: 'مكتمل',
    downloadLinks: [
      { quality: '1080p', size: '2.2GB', link: '#' },
      { quality: '720p', size: '1.1GB', link: '#' },
      { quality: '480p', size: '450MB', link: '#' }
    ]
  },
  {
    id: 6,
    title: 'ستيل ألكيميست',
    titleEn: 'Fullmetal Alchemist',
    description: 'قصة أخوين يسعيان لاستعادة أجسادهما بعد فشل تجربة خيمياوية.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 9.1,
    episodes: 64,
    year: 2005,
    genre: ['أكشن', 'دراما', 'خيال'],
    status: 'مكتمل',
    downloadLinks: [
      { quality: '1080p', size: '2.8GB', link: '#' },
      { quality: '720p', size: '1.4GB', link: '#' },
      { quality: '480p', size: '550MB', link: '#' }
    ]
  },
  {
    id: 7,
    title: 'توكيو غول',
    titleEn: 'Tokyo Ghoul',
    description: 'قصة مظلمة عن فتى يتحول إلى مخلوق غامض ويجب عليه التعايش مع طبيعته الجديدة.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 7.8,
    episodes: 48,
    year: 2014,
    genre: ['أكشن', 'دراما', 'رعب'],
    status: 'مكتمل',
    downloadLinks: [
      { quality: '1080p', size: '2.1GB', link: '#' },
      { quality: '720p', size: '1.0GB', link: '#' },
      { quality: '480p', size: '400MB', link: '#' }
    ]
  },
  {
    id: 8,
    title: 'أكاديمية البطل',
    titleEn: 'My Hero Academia',
    description: 'قصة عن فتى عادي يحصل على قوة خارقة ويسعى لأن يصبح بطلاً.',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487489075/KqQ5RRmF8R5CT2sVVfLZbb/anime-featured-showcase-HFxEExykondoTtUKnNrLCT.webp',
    rating: 8.4,
    episodes: 139,
    year: 2016,
    genre: ['أكشن', 'مدرسة', 'خيال'],
    status: 'جاري البث',
    downloadLinks: [
      { quality: '1080p', size: '4.5GB', link: '#' },
      { quality: '720p', size: '2.2GB', link: '#' },
      { quality: '480p', size: '900MB', link: '#' }
    ]
  }
];

export const genres = ['أكشن', 'دراما', 'كوميديا', 'خيال', 'رومانسية', 'نفسي', 'غموض', 'رعب', 'مغامرة'];
