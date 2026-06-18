/**
 * End-to-End Integration Test
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Orchestrator,
  ConfigLoader,
  SessionStorage,
  StorageMode,
} from '../src/index';

describe('End-to-End Orchestrator', () => {
  let orchestrator: Orchestrator;
  let storage: SessionStorage;
  const testSessionId = `test-session-${Date.now()}`;
  const testStoragePath = path.join(__dirname, 'test-sessions');

  beforeEach(() => {
    orchestrator = new Orchestrator();
    storage = new SessionStorage({ mode: 'memory' });

    // Set test API key
    process.env.ANTHROPIC_API_KEY = 'test-key';

    // Ensure test directory exists
    if (!fs.existsSync(testStoragePath)) {
      fs.mkdirSync(testStoragePath, { recursive: true });
    }
  });

  afterEach(async () => {
    // Cleanup
    if (fs.existsSync(testStoragePath)) {
      const files = fs.readdirSync(testStoragePath);
      for (const file of files) {
        fs.unlinkSync(path.join(testStoragePath, file));
      }
      fs.rmdirSync(testStoragePath);
    }
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('should initialize orchestrator with config', async () => {
    const config = ConfigLoader.createDefault();
    config.storage.mode = StorageMode.MEMORY;

    await orchestrator.initialize(config, {
      sessionId: testSessionId,
      task: 'Test task',
      startTime: new Date(),
      orchestratorConfig: config,
    });

    const state = orchestrator.getState();
    expect(state.sessionId).toBe(testSessionId);
    expect(state.sessionLog.length).toBeGreaterThan(0);
  });

  it('should log events correctly', async () => {
    const config = ConfigLoader.createDefault();
    config.storage.mode = StorageMode.MEMORY;

    await orchestrator.initialize(config, {
      sessionId: testSessionId,
      task: 'Test task',
      startTime: new Date(),
      orchestratorConfig: config,
    });

    const log = orchestrator.getSessionLog();
    const sessionStartEvent = log.find((e) => e.eventType === 'SESSION_STARTED');

    expect(sessionStartEvent).toBeDefined();
    expect(sessionStartEvent?.data.task).toBe('Test task');
  });

  it('should have config loader with default values', () => {
    const config = ConfigLoader.createDefault();

    expect(config.agents.count).toBe(4);
    expect(config.voting.maxRounds).toBe(15);
    expect(config.context.mode).toBe('summarized');
  });

  it('should create and save config', async () => {
    const config = ConfigLoader.createDefault();
    const testPath = path.join(testStoragePath, 'test-config.yaml');

    ConfigLoader.saveToFile(config, testPath);
    expect(fs.existsSync(testPath)).toBe(true);

    const loaded = ConfigLoader.loadFromFile(testPath);
    expect(loaded.name).toBe(config.name);
    expect(loaded.agents.count).toBe(config.agents.count);
  });

  it('should store and retrieve session from memory', async () => {
    const config = ConfigLoader.createDefault();
    config.storage.mode = StorageMode.MEMORY;

    await orchestrator.initialize(config, {
      sessionId: testSessionId,
      task: 'Test task',
      startTime: new Date(),
      orchestratorConfig: config,
    });

    const state = orchestrator.getState();
    await storage.saveSession(state);

    const loaded = await storage.loadSession(testSessionId);
    expect(loaded).toBeDefined();
    expect(loaded?.sessionId).toBe(testSessionId);
  });

  it('should list sessions', async () => {
    const sessionIds = ['session-1', 'session-2', 'session-3'];

    for (const id of sessionIds) {
      const config = ConfigLoader.createDefault();
      config.storage.mode = StorageMode.MEMORY;

      const orch = new Orchestrator();
      await orch.initialize(config, {
        sessionId: id,
        task: 'Test',
        startTime: new Date(),
        orchestratorConfig: config,
      });

      await storage.saveSession(orch.getState());
    }

    const sessions = await storage.listSessions();
    expect(sessions).toHaveLength(3);
    expect(sessions).toContain('session-1');
  });
});
