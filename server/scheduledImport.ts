/**
 * Scheduled Import Service
 * Automatically imports manga from multiple sources on a schedule
 */

import axios from 'axios';

interface ScheduleConfig {
  enabled: boolean;
  time: string; // HH:mm format (24-hour)
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 (0 = Sunday)
  dayOfMonth?: number; // 1-31
  sources: string[];
}

interface ScheduledImportLog {
  timestamp: Date;
  status: 'success' | 'error' | 'skipped';
  itemsImported: number;
  duplicatesRemoved: number;
  duration: number;
  message: string;
}

class ScheduledImportService {
  private config: ScheduleConfig = {
    enabled: false,
    time: '02:00', // 2 AM
    frequency: 'daily',
    sources: ['anilist', 'myanimelist', 'jikan', 'mangadex', 'kitsu'],
  };

  private logs: ScheduledImportLog[] = [];
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Initialize the scheduled import service
   */
  init(customConfig?: Partial<ScheduleConfig>): void {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    if (this.config.enabled) {
      this.start();
    }

    console.log('[ScheduledImport] Service initialized');
    console.log('[ScheduledImport] Config:', this.config);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.log('[ScheduledImport] Already running');
      return;
    }

    // Check every minute if it's time to run
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 60000); // Check every minute

    console.log('[ScheduledImport] Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[ScheduledImport] Scheduler stopped');
    }
  }

  /**
   * Check if it's time to run and execute if needed
   */
  private checkAndRun(): void {
    if (this.isRunning) {
      return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if current time matches scheduled time
    if (currentTime !== this.config.time) {
      return;
    }

    // Check frequency
    if (!this.shouldRunToday(now)) {
      return;
    }

    this.run();
  }

  /**
   * Determine if import should run today based on frequency
   */
  private shouldRunToday(date: Date): boolean {
    switch (this.config.frequency) {
      case 'daily':
        return true;

      case 'weekly':
        return date.getDay() === (this.config.dayOfWeek || 0);

      case 'monthly':
        return date.getDate() === (this.config.dayOfMonth || 1);

      default:
        return false;
    }
  }

  /**
   * Run the import process
   */
  async run(): Promise<ScheduledImportLog> {
    console.log('[ScheduledImport] Starting scheduled import...');

    this.isRunning = true;
    const startTime = Date.now();
    const log: ScheduledImportLog = {
      timestamp: new Date(),
      status: 'success',
      itemsImported: 0,
      duplicatesRemoved: 0,
      duration: 0,
      message: 'Import started',
    };

    try {
      // Simulate import process
      // In production, this would call the actual import functions
      const result = await this.simulateImport();

      log.itemsImported = result.imported;
      log.duplicatesRemoved = result.duplicates;
      log.message = `Imported ${result.imported} manga, removed ${result.duplicates} duplicates`;
      log.status = 'success';

      console.log('[ScheduledImport] ✓ Import completed successfully');
    } catch (error: any) {
      log.status = 'error';
      log.message = `Error: ${error.message}`;
      console.error('[ScheduledImport] ✗ Import failed:', error);
    } finally {
      log.duration = Date.now() - startTime;
      this.logs.push(log);

      // Keep only last 100 logs
      if (this.logs.length > 100) {
        this.logs = this.logs.slice(-100);
      }

      this.isRunning = false;
    }

    return log;
  }

  /**
   * Simulate import process (for testing)
   */
  private async simulateImport(): Promise<{ imported: number; duplicates: number }> {
    // Simulate API calls delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      imported: Math.floor(Math.random() * 50) + 50,
      duplicates: Math.floor(Math.random() * 20) + 10,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): ScheduleConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enabled && !this.intervalId) {
      this.start();
    } else if (!this.config.enabled && this.intervalId) {
      this.stop();
    }

    console.log('[ScheduledImport] Config updated:', this.config);
  }

  /**
   * Get import logs
   */
  getLogs(limit: number = 10): ScheduledImportLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalImported: number;
    totalDuplicates: number;
    averageDuration: number;
  } {
    const stats = {
      totalRuns: this.logs.length,
      successfulRuns: this.logs.filter(l => l.status === 'success').length,
      failedRuns: this.logs.filter(l => l.status === 'error').length,
      totalImported: this.logs.reduce((sum, l) => sum + l.itemsImported, 0),
      totalDuplicates: this.logs.reduce((sum, l) => sum + l.duplicatesRemoved, 0),
      averageDuration: this.logs.length > 0 ? Math.round(this.logs.reduce((sum, l) => sum + l.duration, 0) / this.logs.length) : 0,
    };

    return stats;
  }

  /**
   * Get next scheduled run time
   */
  getNextRunTime(): Date | null {
    if (!this.config.enabled) {
      return null;
    }

    const now = new Date();
    const [hours, minutes] = this.config.time.split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    // Adjust for frequency
    switch (this.config.frequency) {
      case 'weekly':
        while (nextRun.getDay() !== (this.config.dayOfWeek || 0)) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'monthly':
        while (nextRun.getDate() !== (this.config.dayOfMonth || 1)) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
    }

    return nextRun;
  }
}

// Export singleton instance
export const scheduledImportService = new ScheduledImportService();

export { ScheduleConfig, ScheduledImportLog };
