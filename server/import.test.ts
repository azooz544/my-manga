import { describe, it, expect, beforeEach } from 'vitest';
import { scheduledImportService } from './scheduledImport';

describe('Scheduled Import Service', () => {
  beforeEach(() => {
    scheduledImportService.stop();
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      const config = scheduledImportService.getConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(false);
      expect(config.time).toBe('02:00');
      expect(config.frequency).toBe('daily');
    });

    it('should update configuration', () => {
      scheduledImportService.updateConfig({
        enabled: true,
        time: '03:00',
        frequency: 'weekly',
      });

      const config = scheduledImportService.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.time).toBe('03:00');
      expect(config.frequency).toBe('weekly');
    });

    it('should support all frequency options', () => {
      const frequencies = ['daily', 'weekly', 'monthly'] as const;

      for (const freq of frequencies) {
        scheduledImportService.updateConfig({ frequency: freq });
        expect(scheduledImportService.getConfig().frequency).toBe(freq);
      }
    });
  });

  describe('Import Execution', () => {
    it('should run import and return log', async () => {
      const result = await scheduledImportService.run();

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.itemsImported).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    }, { timeout: 10000 });

    it('should track import logs', async () => {
      const initialStats = scheduledImportService.getStats();
      const initialRuns = initialStats.totalRuns;

      await scheduledImportService.run();
      await scheduledImportService.run();

      const stats = scheduledImportService.getStats();
      expect(stats.totalRuns).toBe(initialRuns + 2);
    }, { timeout: 10000 });
  });

  describe('Statistics', () => {
    it('should calculate statistics', async () => {
      const initialStats = scheduledImportService.getStats();
      const initialRuns = initialStats.totalRuns;

      await scheduledImportService.run();

      const stats = scheduledImportService.getStats();
      expect(stats.totalRuns).toBe(initialRuns + 1);
      expect(stats.successfulRuns).toBeGreaterThanOrEqual(initialStats.successfulRuns);
    }, { timeout: 10000 });
  });

  describe('Next Run Time', () => {
    it('should return null when disabled', () => {
      scheduledImportService.updateConfig({ enabled: false });
      const nextRun = scheduledImportService.getNextRunTime();
      expect(nextRun).toBeNull();
    });

    it('should calculate next run time for daily schedule', () => {
      scheduledImportService.updateConfig({
        enabled: true,
        time: '23:00',
        frequency: 'daily',
      });

      const nextRun = scheduledImportService.getNextRunTime();
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.getHours()).toBe(23);
      expect(nextRun?.getMinutes()).toBe(0);
    });

    it('should calculate next run time for weekly schedule', () => {
      scheduledImportService.updateConfig({
        enabled: true,
        time: '02:00',
        frequency: 'weekly',
        dayOfWeek: 1,
      });

      const nextRun = scheduledImportService.getNextRunTime();
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.getDay()).toBe(1);
    });

    it('should calculate next run time for monthly schedule', () => {
      scheduledImportService.updateConfig({
        enabled: true,
        time: '02:00',
        frequency: 'monthly',
        dayOfMonth: 15,
      });

      const nextRun = scheduledImportService.getNextRunTime();
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.getDate()).toBe(15);
    });
  });

  describe('Source Configuration', () => {
    it('should support all sources', () => {
      const sources = ['anilist', 'myanimelist', 'jikan', 'mangadex', 'kitsu'];

      scheduledImportService.updateConfig({ sources });

      const config = scheduledImportService.getConfig();
      expect(config.sources).toEqual(sources);
    });

    it('should allow partial source selection', () => {
      const sources = ['anilist', 'mangadex'];

      scheduledImportService.updateConfig({ sources });

      const config = scheduledImportService.getConfig();
      expect(config.sources).toEqual(sources);
      expect(config.sources.length).toBe(2);
    });
  });
});
