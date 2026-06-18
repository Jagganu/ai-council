/**
 * Config Loader Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader } from '../src/config/ConfigLoader';

describe('ConfigLoader', () => {
  const testConfigPath = path.join(__dirname, 'test-config.yaml');

  beforeEach(() => {
    // Set dummy API key for tests
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('should load valid config', () => {
    const yaml = `
council:
  name: "Test Council"

storage:
  mode: file
  path: .council/sessions

agents:
  count: 4
  
credentials:
  anthropicApiKey: test-key
`;
    fs.writeFileSync(testConfigPath, yaml);

    const config = ConfigLoader.loadFromFile(testConfigPath);

    expect(config.name).toBe('Test Council');
    expect(config.agents.count).toBe(4);
    expect(config.storage.mode).toBe('file');
  });

  it('should substitute environment variables', () => {
    process.env.TEST_API_KEY = 'my-secret-key';

    const yaml = `
credentials:
  anthropicApiKey: \${TEST_API_KEY}
`;
    fs.writeFileSync(testConfigPath, yaml);

    const config = ConfigLoader.loadFromFile(testConfigPath);

    expect(config.credentials.anthropicApiKey).toBe('my-secret-key');

    delete process.env.TEST_API_KEY;
  });

  it('should apply defaults', () => {
    const yaml = `
credentials:
  anthropicApiKey: test-key
`;
    fs.writeFileSync(testConfigPath, yaml);

    const config = ConfigLoader.loadFromFile(testConfigPath);

    expect(config.name).toBe('AI Council');
    expect(config.agents.count).toBe(4);
    expect(config.voting.maxRounds).toBe(15);
  });

  it('should validate agent count', () => {
    const yaml = `
agents:
  count: 0
credentials:
  anthropicApiKey: test-key
`;
    fs.writeFileSync(testConfigPath, yaml);

    expect(() => ConfigLoader.loadFromFile(testConfigPath)).toThrow(
      'agents.count must be >= 1'
    );
  });

  it('should throw on missing credentials', () => {
    const yaml = `
agents:
  count: 4
`;
    fs.writeFileSync(testConfigPath, yaml);

    expect(() => ConfigLoader.loadFromFile(testConfigPath)).toThrow(
      'No LLM credentials'
    );
  });

  it('should create default config', () => {
    const config = ConfigLoader.createDefault();

    expect(config.agents.count).toBe(4);
    expect(config.voting.maxRounds).toBe(15);
    expect(config.context.mode).toBe('summarized');
  });

  it('should save config to file', () => {
    const config = ConfigLoader.createDefault();
    ConfigLoader.saveToFile(config, testConfigPath);

    expect(fs.existsSync(testConfigPath)).toBe(true);
    const loaded = ConfigLoader.loadFromFile(testConfigPath);
    expect(loaded.name).toBe(config.name);
  });
});
