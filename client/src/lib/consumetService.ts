import axios from 'axios';

const COMICK_API = 'https://api.comick.cc';

export const getMangaChapters = async (title: string) => {
  try {
    // 1. البحث عن المانجا باسمها
    const searchRes = await axios.get(`${COMICK_API}/v1.0/search?q=${encodeURIComponent(title)}&limit=1`);

    if (!searchRes.data || searchRes.data.length === 0) {
      return [];
    }

    const mangaHid = searchRes.data[0].hid;

    // 2. جلب قائمة الفصول
    const chaptersRes = await axios.get(`${COMICK_API}/comic/${mangaHid}/chapters?limit=100`);

    // 3. تهيئة البيانات لتناسب واجهة موقعك مباشرة
    const chapters = chaptersRes.data.chapters.map((ch: any) => ({
      id: ch.hid, // نستخدم المعرف الخاص بهم لجلب الصور لاحقاً
      title: ch.title,
      chapter: ch.chap
    }));

    return chapters;
  } catch (error) {
    console.error('خطأ في جلب الفصول من ComicK:', error);
    return [];
  }
};

export const getChapterImages = async (chapterId: string) => {
  try {
    // جلب بيانات الفصل لاستخراج الصور
    const response = await axios.get(`${COMICK_API}/chapter/${chapterId}`);
    
    // تركيب روابط الصور المباشرة
    const images = response.data.chapter.md_images.map((img: any) =>
      `https://meo.comick.pictures/${img.b2key}`
    );
    
    return images;
  } catch (error) {
    console.error('خطأ في جلب الصور من ComicK:', error);
    throw error;
  }
};
