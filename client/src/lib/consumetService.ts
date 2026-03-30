import axios from 'axios';

const CONSUMET_URL = 'https://api.consumet.org/manga/mangakakalot';

export const getMangaChapters = async (title: string) => {
  try {
    // إظهار رسالة في الكونسول لتتبع البحث
    console.log(`جاري البحث عن المانجا باسم: ${title}`);
    
    const searchRes = await axios.get(`${CONSUMET_URL}/${encodeURIComponent(title)}`);
    
    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      alert(`لم نتمكن من العثور على فصول لـ "${title}" في قاعدة بيانات Mangakakalot.`);
      return [];
    }

    const mangaId = searchRes.data.results[0].id;
    console.log(`تم العثور على المانجا، الـ ID: ${mangaId}`);

    const infoRes = await axios.get(`${CONSUMET_URL}/info`, {
      params: { id: mangaId }
    });

    return infoRes.data.chapters || [];
  } catch (error: any) {
    // هذي الرسالة بتطلع لك لو السيرفر فيه مشكلة أو رافض الاتصال
    alert(`تعذر الاتصال بسيرفر الفصول (Consumet). تفاصيل الخطأ: ${error.message}`);
    console.error('خطأ في جلب الفصول:', error);
    return [];
  }
};

export const getChapterImages = async (chapterId: string) => {
  try {
    const response = await axios.get(`${CONSUMET_URL}/read`, {
      params: { chapterId: chapterId }
    });
    
    return response.data.map((item: any) => item.img);
  } catch (error: any) {
    alert(`خطأ في جلب الصور: ${error.message}`);
    throw error;
  }
};
