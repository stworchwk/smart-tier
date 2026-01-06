import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type { MemoryEntry, ConversationMemory } from '../types/index.js';

interface MemoryData {
  sessions: ConversationMemory[];
  current_session_id: string | null;
}

/**
 * Conversation memory tracker for smarter auto-upgrade decisions
 */
export class ConversationMemoryTracker {
  private dataPath: string;
  private data: MemoryData;
  private maxEntriesPerSession: number;
  private maxSessions: number;

  constructor(dataDir: string, maxEntriesPerSession: number = 100, maxSessions: number = 10) {
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.dataPath = join(dataDir, 'memory.json');
    this.maxEntriesPerSession = maxEntriesPerSession;
    this.maxSessions = maxSessions;
    this.data = this.load();

    // Start a new session if none exists
    if (!this.data.current_session_id) {
      this.startNewSession();
    }
  }

  /**
   * Load memory data from file
   */
  private load(): MemoryData {
    if (existsSync(this.dataPath)) {
      try {
        const raw = readFileSync(this.dataPath, 'utf-8');
        return JSON.parse(raw) as MemoryData;
      } catch {
        console.error('[memory] Failed to load memory data, starting fresh');
      }
    }
    return { sessions: [], current_session_id: null };
  }

  /**
   * Save memory data to file
   */
  private save(): void {
    try {
      const dir = dirname(this.dataPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('[memory] Failed to save memory data:', error);
    }
  }

  /**
   * Get current session
   */
  private getCurrentSession(): ConversationMemory | null {
    if (!this.data.current_session_id) return null;
    return this.data.sessions.find((s) => s.session_id === this.data.current_session_id) || null;
  }

  /**
   * Start a new session
   */
  startNewSession(): string {
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    const session: ConversationMemory = {
      session_id: sessionId,
      entries: [],
      created_at: now,
      last_updated: now,
    };

    this.data.sessions.push(session);
    this.data.current_session_id = sessionId;

    // Prune old sessions
    while (this.data.sessions.length > this.maxSessions) {
      this.data.sessions.shift();
    }

    this.save();
    return sessionId;
  }

  /**
   * Record a task pattern and tier usage
   */
  recordTask(taskPattern: string, tierUsed: string, success: boolean, context?: Record<string, unknown>): void {
    const session = this.getCurrentSession();
    if (!session) {
      this.startNewSession();
      return this.recordTask(taskPattern, tierUsed, success, context);
    }

    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      task_pattern: this.extractPattern(taskPattern),
      tier_used: tierUsed,
      success,
      context,
    };

    session.entries.push(entry);
    session.last_updated = entry.timestamp;

    // Prune old entries
    while (session.entries.length > this.maxEntriesPerSession) {
      session.entries.shift();
    }

    this.save();
  }

  /**
   * Record a tier switch
   */
  recordTierSwitch(fromTier: string, toTier: string, reason?: string): void {
    this.recordTask(`tier_switch:${fromTier}->${toTier}`, toTier, true, { reason });
  }

  /**
   * Extract a simplified pattern from a task description
   */
  private extractPattern(task: string): string {
    const lowered = task.toLowerCase();

    // Common patterns
    const patterns = [
      { match: /architect/i, pattern: 'architecture' },
      { match: /design/i, pattern: 'design' },
      { match: /security/i, pattern: 'security' },
      { match: /refactor/i, pattern: 'refactor' },
      { match: /implement/i, pattern: 'implementation' },
      { match: /create|add/i, pattern: 'creation' },
      { match: /fix|bug|debug/i, pattern: 'bugfix' },
      { match: /explore|search|find/i, pattern: 'exploration' },
      { match: /test/i, pattern: 'testing' },
      { match: /document/i, pattern: 'documentation' },
    ];

    for (const { match, pattern } of patterns) {
      if (match.test(lowered)) {
        return pattern;
      }
    }

    return 'general';
  }

  /**
   * Get recommended tier based on past patterns
   */
  getRecommendedTier(task: string): string | null {
    const pattern = this.extractPattern(task);
    const session = this.getCurrentSession();
    if (!session) return null;

    // Find successful uses of this pattern
    const relevantEntries = session.entries.filter(
      (e) => e.task_pattern === pattern && e.success
    );

    if (relevantEntries.length === 0) return null;

    // Count tier usage
    const tierCounts: Record<string, number> = {};
    for (const entry of relevantEntries) {
      tierCounts[entry.tier_used] = (tierCounts[entry.tier_used] || 0) + 1;
    }

    // Return most commonly used tier
    const entries = Object.entries(tierCounts);
    if (entries.length === 0) return null;

    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  /**
   * Get recent patterns for context
   */
  getRecentPatterns(limit: number = 5): string[] {
    const session = this.getCurrentSession();
    if (!session) return [];

    return session.entries
      .slice(-limit)
      .map((e) => e.task_pattern);
  }

  /**
   * Get session summary
   */
  getSessionSummary(): {
    session_id: string;
    entry_count: number;
    patterns: Record<string, number>;
    tier_usage: Record<string, number>;
    success_rate: number;
  } | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    const patterns: Record<string, number> = {};
    const tierUsage: Record<string, number> = {};
    let successCount = 0;

    for (const entry of session.entries) {
      patterns[entry.task_pattern] = (patterns[entry.task_pattern] || 0) + 1;
      tierUsage[entry.tier_used] = (tierUsage[entry.tier_used] || 0) + 1;
      if (entry.success) successCount++;
    }

    return {
      session_id: session.session_id,
      entry_count: session.entries.length,
      patterns,
      tier_usage: tierUsage,
      success_rate: session.entries.length > 0
        ? Math.round((successCount / session.entries.length) * 100)
        : 0,
    };
  }

  /**
   * Clear all memory (for testing)
   */
  clear(): void {
    this.data = { sessions: [], current_session_id: null };
    this.save();
    this.startNewSession();
  }
}
