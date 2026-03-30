import axios from 'axios';

// نستخدم مسار Mangakakalot داخل Consumet لضمان توفر أغلب المانجات
const CONSUMET_URL = 'https://api.consumet.org/manga/mangakakalot';

export const getMangaChapters = async (title: string) => {
  try {
    // 1. البحث عن المانجا بالاسم
    const searchRes = await axios.get(`${CONSUMET_URL}/${encodeURIComponent(title)}`);
    
    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      return [];
    }

    // 2. أخذ المعرف (ID) لأول نتيجة
    const mangaId = searchRes.data.results[0].id;

    // 3. جلب تفاصيل المانجا والتي تحتوي على قائمة الفصول
    const infoRes = await axios.get(`${CONSUMET_URL}/info`, {
      params: { id: mangaId }
    });

    return infoRes.data.chapters || [];
  } catch (error) {
    console.error('خطأ في جلب الفصول من Consumet:', error);
    return [];
  }
};

export const getChapterImages = async (chapterId: string) => {
  try {
    // جلب روابط الصور المباشرة للفصل
    const response = await axios.get(`${CONSUMET_URL}/read`, {
      params: { chapterId: chapterId }
    });
    
    // واجهة Consumet ترجع مصفوفة كائنات، نحتاج نستخرج منها رابط الصورة فقط
    return response.data.map((item: any) => item.img);
  } catch (error) {
    console.error('خطأ في جلب صور الفصل:', error);
    throw error;
  }
};
