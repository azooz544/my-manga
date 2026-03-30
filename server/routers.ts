import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  manga: router({
    search: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: title }) => {
        try {
          if (!title || title.trim().length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'عنوان المانجا مطلوب',
            });
          }

          console.log(`[Jikan Search] Searching for: ${title}`);
          const response = await fetch(
            `https://api.jikan.moe/v4/manga?query=${encodeURIComponent(title)}&limit=5`
          );

          if (!response.ok) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `خطأ من Jikan API: ${response.status}`,
            });
          }

          const data = await response.json();
          console.log(`[Jikan Search] Response:`, data);

          if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `لم يتم العثور على المانجا: "${title}"`,
            });
          }

          return data.data;
        } catch (error: any) {
          console.error('[Jikan Search Error]', error);
          
          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `خطأ في البحث: ${error.message || 'حدث خطأ غير متوقع'}`,
          });
        }
      }),
    
    getChapters: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: malId }) => {
        try {
          if (!malId || malId.toString().trim().length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'معرّف المانجا مطلوب',
            });
          }

          console.log(`[Jikan Chapters] Fetching chapters for malId: ${malId}`);
          
          // Jikan API doesn't provide detailed chapter data
          // We'll generate mock chapters based on the manga's chapter count
          const mangaResponse = await fetch(
            `https://api.jikan.moe/v4/manga/${malId}`
          );

          if (!mangaResponse.ok) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `خطأ من Jikan API: ${mangaResponse.status}`,
            });
          }

          const mangaData = await mangaResponse.json();
          const chapterCount = mangaData.data?.chapters || 50;

          // Generate mock chapters for display
          const mockChapters = Array.from({ length: Math.min(chapterCount, 100) }, (_, i) => ({
            hid: `ch-${i + 1}`,
            chap: i + 1,
            title: `الفصل ${i + 1}`,
            createdAt: new Date(Date.now() - (100 - i) * 86400000).toISOString(),
          }));

          console.log(`[Jikan Chapters] Generated ${mockChapters.length} mock chapters`);
          
          if (mockChapters.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'لم يتم العثور على فصول لهذه المانجا',
            });
          }

          return mockChapters;
        } catch (error: any) {
          console.error('[Jikan Chapters Error]', error);
          
          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `خطأ في جلب الفصول: ${error.message || 'حدث خطأ غير متوقع'}`,
          });
        }
      }),
    
    getChapterImages: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: chapterId }) => {
        try {
          if (!chapterId || chapterId.trim().length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'معرّف الفصل مطلوب',
            });
          }

          console.log(`[Chapter Images] Fetching images for chapter: ${chapterId}`);
          
          // Generate mock placeholder images for the chapter
          // In production, integrate with a real manga reading API like MangaDex
          const mockImages = Array.from({ length: 20 }, (_, i) => 
            `https://via.placeholder.com/600x900?text=صفحة+${i + 1}`
          );

          if (mockImages.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'لم يتم العثور على صور لهذا الفصل',
            });
          }

          console.log(`[Chapter Images] Generated ${mockImages.length} mock images`);
          return mockImages;
        } catch (error: any) {
          console.error('[Chapter Images Error]', error);
          
          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `خطأ في جلب الصور: ${error.message || 'حدث خطأ غير متوقع'}`,
          });
        }
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
