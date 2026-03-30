/**
 * Mock Manga Data
 * This is sample data used when the API is unavailable
 */

export const mockMangaList = {
  mangaList: [
    {
      id: "manga-001",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "Attack on Titan",
      chapter: "Chapter 139",
      view: "105.8M",
      description: "في عالم حيث البشرية محاصرة بجدران عملاقة، يكتشف إيرين أن لديه قوة خاصة."
    },
    {
      id: "manga-002",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "One Piece",
      chapter: "Chapter 1050",
      view: "98.5M",
      description: "تتبع مغامرات لوفي في البحث عن كنز القرصان الأسطوري."
    },
    {
      id: "manga-003",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "Naruto",
      chapter: "Chapter 700",
      view: "87.3M",
      description: "قصة ناروتو في رحلته ليصبح أقوى نينجا في القرية."
    },
    {
      id: "manga-004",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "Death Note",
      chapter: "Chapter 108",
      view: "76.2M",
      description: "دفتر سحري يمنح صاحبه القوة على التحكم بمصير الآخرين."
    },
    {
      id: "manga-005",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "Demon Slayer",
      chapter: "Chapter 205",
      view: "92.1M",
      description: "تانجيرو يسعى للانتقام من الشياطين الذين قتلوا عائلته."
    },
    {
      id: "manga-006",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "Jujutsu Kaisen",
      chapter: "Chapter 236",
      view: "88.7M",
      description: "يوجي يدخل عالم السحرة بعد ابتلاعه إصبع لعنة قوية."
    },
    {
      id: "manga-007",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "My Hero Academia",
      chapter: "Chapter 426",
      view: "81.4M",
      description: "ديكو يحلم بأن يصبح بطلاً رغم عدم امتلاكه لقوة خاصة."
    },
    {
      id: "manga-008",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=400&fit=crop",
      title: "Bleach",
      chapter: "Chapter 686",
      view: "79.9M",
      description: "إيتشيجو يكتشف أنه يستطيع رؤية الأرواح والتعامل معها."
    }
  ],
  metaData: {
    totalStories: 500,
    totalPages: 100,
    type: [
      { id: "newest", type: "الأحدث" },
      { id: "latest", type: "الأخير" },
      { id: "topview", type: "الأكثر مشاهدة" }
    ],
    state: [
      { id: "all", type: "الكل" },
      { id: "Completed", type: "مكتمل" },
      { id: "Ongoing", type: "جاري البث" }
    ],
    category: [
      { id: "all", type: "الكل" },
      { id: "Action", type: "أكشن" },
      { id: "Adventure", type: "مغامرة" },
      { id: "Comedy", type: "كوميديا" },
      { id: "Drama", type: "دراما" }
    ]
  }
};

export const mockMangaDetail = {
  imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=800&fit=crop",
  name: "Attack on Titan",
  author: "Hajime Isayama",
  status: "Completed",
  updated: "Apr 22, 2022",
  view: "105.8M",
  genres: ["Action", "Adventure", "Dark Fantasy", "Supernatural"],
  chapterList: [
    {
      id: "chapter-139",
      path: "/chapter/manga-001/chapter-139",
      name: "Vol.34 Chapter 139: Moving Toward That Tree On The Hill",
      view: "353.2K",
      createdAt: "Apr 22, 2022"
    },
    {
      id: "chapter-138",
      path: "/chapter/manga-001/chapter-138",
      name: "Vol.34 Chapter 138: A Rumbling to the Future",
      view: "412.1K",
      createdAt: "Apr 8, 2022"
    },
    {
      id: "chapter-137",
      path: "/chapter/manga-001/chapter-137",
      name: "Vol.34 Chapter 137: Titans",
      view: "389.5K",
      createdAt: "Mar 25, 2022"
    },
    {
      id: "chapter-136",
      path: "/chapter/manga-001/chapter-136",
      name: "Vol.34 Chapter 136: Offer Your Hearts",
      view: "401.2K",
      createdAt: "Mar 11, 2022"
    },
    {
      id: "chapter-135",
      path: "/chapter/manga-001/chapter-135",
      name: "Vol.33 Chapter 135: Descent",
      view: "378.9K",
      createdAt: "Feb 25, 2022"
    }
  ]
};

export const mockChapterDetail = {
  title: "Attack on Titan",
  currentChapter: "Vol.34 Chapter 139: Moving Toward That Tree On The Hill",
  chapterListIds: [
    { id: "chapter-139", name: "Vol.34 Chapter 139: Moving Toward That Tree On The Hill" },
    { id: "chapter-138", name: "Vol.34 Chapter 138: A Rumbling to the Future" },
    { id: "chapter-137", name: "Vol.34 Chapter 137: Titans" }
  ],
  images: [
    {
      title: "Attack on Titan Vol.34 Chapter 139 page 1",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=1000&fit=crop"
    },
    {
      title: "Attack on Titan Vol.34 Chapter 139 page 2",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=1000&fit=crop"
    },
    {
      title: "Attack on Titan Vol.34 Chapter 139 page 3",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=1000&fit=crop"
    },
    {
      title: "Attack on Titan Vol.34 Chapter 139 page 4",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=1000&fit=crop"
    },
    {
      title: "Attack on Titan Vol.34 Chapter 139 page 5",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=1000&fit=crop"
    }
  ]
};
