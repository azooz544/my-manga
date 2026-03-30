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
    search: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: title }) => {
        try {
          const response = await fetch(
            `https://api.comick.cc/v1.0/search?q=${encodeURIComponent(title)}&limit=1`
          );
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('Error searching manga:', error);
          return [];
        }
      }),
    
    getChapters: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: hid }) => {
        try {
          const response = await fetch(
            `https://api.comick.cc/comic/${hid}/chapters?limit=100`
          );
          const data = await response.json();
          return data.chapters || [];
        } catch (error) {
          console.error('Error fetching chapters:', error);
          return [];
        }
      }),
    
    getChapterImages: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input: chapterId }) => {
        try {
          const response = await fetch(
            `https://api.comick.cc/chapter/${chapterId}`
          );
          const data = await response.json();
          
          // تركيب روابط الصور بإضافة https://meo.comick.pictures/ قبل كل b2key
          const images = data.chapter.md_images.map((img: any) =>
            `https://meo.comick.pictures/${img.b2key}`
          );
          
          return images;
        } catch (error) {
          console.error('Error fetching chapter images:', error);
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
