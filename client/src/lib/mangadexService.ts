import axios from 'axios';

export const getMangaWithChapters = async (mangaDexId: string) => {
  try {
    const response = await axios.get(`https://api.mangadex.org/manga/${mangaDexId}/feed`, {
      params: {
        translatedLanguage: ['ar', 'en'],
        order: { chapter: 'asc' },
        limit: 500,
      }
    });
    
    // فلترة ذكية: نأخذ فقط الفصول التي تحتوي على صفحات فعلية (pages > 0) وليست روابط خارجية
    const validChapters = response.data.data.filter((ch: any) => 
      ch.attributes && ch.attributes.pages > 0 && ch.attributes.externalUrl === null
    );

    return { chapters: validChapters };
  } catch (error) {
    console.error('خطأ في جلب الفصول من MangaDex:', error);
    return { chapters: [] };
  }
};

export const getChapterPages = async (chapterId: string) => {
  try {
    const response = await axios.get(`https://api.mangadex.org/at-home/server/${chapterId}`);
    return response.data;
  } catch (error) {
    console.error('خطأ في جلب بيانات صور الفصل:', error);
    throw error;
  }
};

export const buildImageUrl = (baseUrl: string, hash: string, fileName: string) => {
  return `${baseUrl}/data/${hash}/${fileName}`;
};
