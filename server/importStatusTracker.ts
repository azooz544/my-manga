/**
 * Import Status Tracker
 * Tracks and logs the status of multi-source imports
 */

interface ImportLog {
  timestamp: Date;
  source: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  itemsProcessed?: number;
  itemsImported?: number;
  duration?: number;
  error?: string;
}

interface ImportSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  logs: ImportLog[];
  totalItems: number;
  totalImported: number;
  totalDuplicates: number;
  totalErrors: number;
}

class ImportStatusTracker {
  private sessions: Map<string, ImportSession> = new Map();
  private currentSession: ImportSession | null = null;

  startSession(sessionId: string): ImportSession {
    const session: ImportSession = {
      sessionId,
      startTime: new Date(),
      logs: [],
      totalItems: 0,
      totalImported: 0,
      totalDuplicates: 0,
      totalErrors: 0,
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;
    this.log(sessionId, 'system', 'pending', `Import session started: ${sessionId}`);

    return session;
  }

  log(
    sessionId: string,
    source: string,
    status: 'pending' | 'running' | 'success' | 'error',
    message: string,
    data?: {
      itemsProcessed?: number;
      itemsImported?: number;
      duration?: number;
      error?: string;
    }
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`[Tracker] Session not found: ${sessionId}`);
      return;
    }

    const logEntry: ImportLog = {
      timestamp: new Date(),
      source,
      status,
      message,
      ...data,
    };

    session.logs.push(logEntry);

    // Update counters
    if (data?.itemsProcessed) {
      session.totalItems += data.itemsProcessed;
    }
    if (data?.itemsImported) {
      session.totalImported += data.itemsImported;
    }
    if (status === 'error') {
      session.totalErrors++;
    }

    // Log to console
    const timestamp = logEntry.timestamp.toISOString();
    const icon =
      status === 'success'
        ? '✓'
        : status === 'error'
          ? '✗'
          : status === 'running'
            ? '⟳'
            : '○';

    console.log(
      `[${timestamp}] [${source}] ${icon} ${message}${data?.duration ? ` (${data.duration}ms)` : ''}`
    );

    if (data?.error) {
      console.error(`  Error: ${data.error}`);
    }
  }

  endSession(sessionId: string): ImportSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`[Tracker] Session not found: ${sessionId}`);
      return null;
    }

    session.endTime = new Date();
    const duration = session.endTime.getTime() - session.startTime.getTime();

    this.log(
      sessionId,
      'system',
      'success',
      `Import session completed in ${(duration / 1000).toFixed(2)}s`,
      { duration }
    );

    this.currentSession = null;
    return session;
  }

  getSession(sessionId: string): ImportSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getAllSessions(): ImportSession[] {
    return Array.from(this.sessions.values());
  }

  getSummary(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return 'Session not found';

    const duration = session.endTime
      ? ((session.endTime.getTime() - session.startTime.getTime()) / 1000).toFixed(2)
      : 'ongoing';

    return `
╔════════════════════════════════════════════════════════╗
║              IMPORT SESSION SUMMARY                    ║
╠════════════════════════════════════════════════════════╣
║ Session ID:          ${String(sessionId).padEnd(40)} ║
║ Start Time:          ${String(session.startTime.toISOString()).padEnd(40)} ║
║ Total Items:         ${String(session.totalItems).padEnd(40)} ║
║ Total Imported:      ${String(session.totalImported).padEnd(40)} ║
║ Total Duplicates:    ${String(session.totalDuplicates).padEnd(40)} ║
║ Total Errors:        ${String(session.totalErrors).padEnd(40)} ║
║ Duration:            ${String(duration + 's').padEnd(40)} ║
╚════════════════════════════════════════════════════════╝
    `;
  }

  exportLogs(sessionId: string): ImportLog[] {
    const session = this.sessions.get(sessionId);
    return session ? session.logs : [];
  }

  clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

// Export singleton instance
export const importTracker = new ImportStatusTracker();
export { ImportLog, ImportSession };
