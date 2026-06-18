/**
 * Session Storage - File-based persistence
 */

import * as fs from 'fs';
import * as path from 'path';
import { OrchestratorState } from '../types';

export interface StorageConfig {
  mode: 'file' | 'memory';
  path?: string;
}

export class SessionStorage {
  private config: StorageConfig;
  private memoryStore: Map<string, OrchestratorState> = new Map();

  constructor(config: StorageConfig) {
    this.config = config;

    if (config.mode === 'file' && config.path) {
      this.ensureDirectoryExists(config.path);
    }
  }

  async saveSession(session: OrchestratorState): Promise<void> {
    if (this.config.mode === 'memory') {
      this.memoryStore.set(session.sessionId, session);
      return;
    }

    const filePath = this.getSessionPath(session.sessionId);
    const json = JSON.stringify(session, null, 2);
    fs.writeFileSync(filePath, json, 'utf-8');
  }

  async loadSession(sessionId: string): Promise<OrchestratorState | null> {
    if (this.config.mode === 'memory') {
      return this.memoryStore.get(sessionId) || null;
    }

    const filePath = this.getSessionPath(sessionId);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const json = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(json);
  }

  async listSessions(): Promise<string[]> {
    if (this.config.mode === 'memory') {
      return Array.from(this.memoryStore.keys());
    }

    if (!this.config.path || !fs.existsSync(this.config.path)) {
      return [];
    }

    const files = fs.readdirSync(this.config.path);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (this.config.mode === 'memory') {
      this.memoryStore.delete(sessionId);
      return;
    }

    const filePath = this.getSessionPath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async exportSession(sessionId: string): Promise<string> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return JSON.stringify(session, null, 2);
  }

  private getSessionPath(sessionId: string): string {
    const fileName = `${sessionId}.json`;
    return path.join(this.config.path || '.council/sessions', fileName);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Clear all sessions (for testing)
   */
  async clear(): Promise<void> {
    if (this.config.mode === 'memory') {
      this.memoryStore.clear();
      return;
    }

    if (this.config.path && fs.existsSync(this.config.path)) {
      const files = fs.readdirSync(this.config.path);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.config.path, file));
        }
      }
    }
  }
}
