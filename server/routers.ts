import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
    getChapters: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: mangaDexId }) => {
        try {
          const response = await fetch(
            `https://api.mangadex.org/manga/${mangaDexId}/feed?translatedLanguage[]=ar&translatedLanguage[]=en&order[chapter]=asc&limit=500`
          );
          const data = await response.json();
          
          // فلترة الفصول الحقيقية فقط
          const validChapters = data.data.filter((ch: any) => 
            ch.attributes && ch.attributes.pages > 0 && ch.attributes.externalUrl === null
          );

          return validChapters;
        } catch (error) {
          console.error('Error fetching chapters:', error);
          return [];
        }
      }),
    
    getChapterPages: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: chapterId }) => {
        try {
          const response = await fetch(
            `https://api.mangadex.org/at-home/server/${chapterId}`
          );
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('Error fetching chapter pages:', error);
          throw error;
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
