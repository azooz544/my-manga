/**
 * Scheduler Router
 * tRPC procedures for managing scheduled imports
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { scheduledImportService } from './scheduledImport';

export const schedulerRouter = router<any>({
  // Get scheduler configuration
  getConfig: publicProcedure.query(async (): Promise<any> => {
    return scheduledImportService.getConfig();
  }),

  // Update scheduler configuration
  updateConfig: publicProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        time: z.string().optional(),
        frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        sources: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      scheduledImportService.updateConfig(input);
      return {
        success: true,
        config: scheduledImportService.getConfig(),
      };
    }),

  // Get scheduler statistics
  getStats: publicProcedure.query(async (): Promise<any> => {
    return scheduledImportService.getStats();
  }),

  // Get import logs
  getLogs: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }: any) => {
      return scheduledImportService.getLogs(input.limit);
    }),

  // Get next scheduled run time
  getNextRunTime: publicProcedure.query(async (): Promise<any> => {
    const nextRun = scheduledImportService.getNextRunTime();
    return {
      nextRun: nextRun?.toISOString() || null,
      enabled: scheduledImportService.getConfig().enabled,
    };
  }),

  // Start scheduler
  start: publicProcedure.mutation(async (): Promise<any> => {
    scheduledImportService.start();
    return {
      success: true,
      message: 'Scheduler started',
    };
  }),

  // Stop scheduler
  stop: publicProcedure.mutation(async (): Promise<any> => {
    scheduledImportService.stop();
    return {
      success: true,
      message: 'Scheduler stopped',
    };
  }),

  // Run import manually
  runNow: publicProcedure.mutation(async (): Promise<any> => {
    const result = await scheduledImportService.run();
    return {
      success: result.status === 'success',
      result,
    };
  }),
});
