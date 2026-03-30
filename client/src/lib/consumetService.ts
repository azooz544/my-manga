import axios from 'axios';

// استخدمنا بروكسي لتخطي مشكلة CORS وحظر المتصفح
const PROXY_URL = 'https://api.allorigins.win/raw?url=';
const COMICK_API = 'https://api.comick.cc';

export const getMangaChapters = async (title: string) => {
  try {
    const searchUrl = `${COMICK_API}/v1.0/search?q=${encodeURIComponent(title)}&limit=1`;
    // نمرر الرابط داخل البروكسي
    const searchRes = await axios.get(`${PROXY_URL}${encodeURIComponent(searchUrl)}`);

    if (!searchRes.data || searchRes.data.length === 0) {
      alert(`لم نجد فصولاً لـ: ${title} في قاعدة البيانات.`);
      return [];
    }

    const mangaHid = searchRes.data[0].hid;
    const chaptersUrl = `${COMICK_API}/comic/${mangaHid}/chapters?limit=100`;
    const chaptersRes = await axios.get(`${PROXY_URL}${encodeURIComponent(chaptersUrl)}`);

    if (!chaptersRes.data || !chaptersRes.data.chapters) return [];

    return chaptersRes.data.chapters.map((ch: any) => ({
      id: ch.hid,
      title: ch.title,
      chapter: ch.chap
    }));
  } catch (error: any) {
    alert('تم حظر الاتصال من قبل المتصفح أو أن السيرفر لا يستجيب.');
    console.error('API Error:', error);
    return [];
  }
};

export const getChapterImages = async (chapterId: string) => {
  try {
    const chapterUrl = `${COMICK_API}/chapter/${chapterId}`;
    const response = await axios.get(`${PROXY_URL}${encodeURIComponent(chapterUrl)}`);
    
    return response.data.chapter.md_images.map((img: any) =>
      `https://meo.comick.pictures/${img.b2key}`
    );
  } catch (error) {
    console.error('خطأ في جلب الصور:', error);
    throw error;
  }
};
