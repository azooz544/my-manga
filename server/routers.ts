import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { searchManga, getChapters, getChapterImages } from "./_core/mangadexProxy";

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

          console.log(`[Router] Searching for manga: ${title}`);
          
          // استخدام MangaDex API للبحث
          const results = await searchManga(title, {
            maxRetries: 3,
            timeout: 15000,
            delayMs: 1000,
          });

          if (!results || results.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `لم يتم العثور على المانجا: "${title}"`,
            });
          }

          console.log(`[Router] Found ${results.length} manga results`);
          return results;
        } catch (error: any) {
          console.error('[Router] Search error:', error);
          
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
      .query(async ({ input: mangaId }) => {
        try {
          if (!mangaId || mangaId.trim().length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'معرّف المانجا مطلوب',
            });
          }

          console.log(`[Router] Fetching chapters for mangaId: ${mangaId}`);
          
          // استخدام MangaDex API لجلب الفصول (مع تصفية الفصول الخارجية)
          const chapters = await getChapters(mangaId, {
            maxRetries: 3,
            timeout: 15000,
            delayMs: 1000,
          });

          if (!chapters || chapters.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'لم يتم العثور على فصول لهذه المانجا',
            });
          }

          console.log(`[Router] Found ${chapters.length} chapters`);
          return chapters;
        } catch (error: any) {
          console.error('[Router] Get chapters error:', error);
          
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

          console.log(`[Router] Fetching images for chapter: ${chapterId}`);
          
          // استخدام MangaDex API لجلب صور الفصل
          const images = await getChapterImages(chapterId, {
            maxRetries: 3,
            timeout: 15000,
            delayMs: 1000,
          });

          if (!images || images.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'لم يتم العثور على صور لهذا الفصل',
            });
          }

          console.log(`[Router] Found ${images.length} images`);
          return images;
        } catch (error: any) {
          console.error('[Router] Get images error:', error);
          
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
