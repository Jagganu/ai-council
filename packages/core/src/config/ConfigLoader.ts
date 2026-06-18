/**
 * Configuration Loader - YAML parsing, validation, env substitution
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import {
  OrchestratorConfig,
  StorageMode,
  ContextMode,
  MemoryMode,
  VotingConfig,
  ConsensusMode,
  CredentialsConfig,
  AgentPoolConfig,
  LLMConfig,
  LLMProvider,
  AgentViewpoint,
} from '../types';

export class ConfigLoader {
  /**
   * Load config from YAML file with env var substitution
   */
  static loadFromFile(filePath: string): OrchestratorConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Config file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const substituted = this.substituteEnvVars(content);
    const parsed = yaml.parse(substituted);

    return this.validate(parsed);
  }

  /**
   * Substitute ${VAR_NAME} with environment variables
   */
  private static substituteEnvVars(content: string): string {
    return content.replace(/\$\{([A-Z_]+)\}/g, (match, varName) => {
      const value = process.env[varName];
      if (!value) {
        throw new Error(`Environment variable not found: ${varName}`);
      }
      return value;
    });
  }

  /**
   * Validate and normalize config
   */
  private static validate(rawConfig: any): OrchestratorConfig {
    const config: OrchestratorConfig = {
      name: rawConfig.council?.name || 'AI Council',
      description: rawConfig.council?.description || '',
      logLevel: rawConfig.council?.logLevel || 'info',

      storage: {
        mode: (rawConfig.storage?.mode || 'file') as StorageMode,
        path: rawConfig.storage?.path || '.council/sessions',
        connectionString: rawConfig.storage?.connectionString,
      },

      context: {
        mode: (rawConfig.context?.mode || 'summarized') as ContextMode,
        maxHistoryRounds: rawConfig.context?.maxHistoryRounds || 10,
      },

      memory: {
        mode: (rawConfig.memory?.mode || 'session') as MemoryMode,
      },

      credentials: this.validateCredentials(rawConfig.credentials || {}),

      agents: this.validateAgents(rawConfig.agents || {}),

      voting: this.validateVoting(rawConfig.voting || {}),
    };

    // Ensure storage directory exists
    if (config.storage.mode === 'file' && config.storage.path) {
      const dir = path.dirname(config.storage.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    return config;
  }

  private static validateCredentials(creds: any): CredentialsConfig {
    const validated: CredentialsConfig = {};

    if (creds.anthropicApiKey) validated.anthropicApiKey = creds.anthropicApiKey;
    if (creds.openaiApiKey) validated.openaiApiKey = creds.openaiApiKey;
    if (creds.googleApiKey) validated.googleApiKey = creds.googleApiKey;
    if (creds.openrouterApiKey) validated.openrouterApiKey = creds.openrouterApiKey;
    if (creds.localModelUrl) validated.localModelUrl = creds.localModelUrl;

    if (Object.keys(validated).length === 0) {
      throw new Error(
        'No LLM credentials configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY'
      );
    }

    return validated;
  }

  private static validateAgents(agents: any): AgentPoolConfig {
    const count = agents.count !== undefined ? agents.count : 4;

    if (count < 1) {
      throw new Error('agents.count must be >= 1');
    }

    const viewpoints: (AgentViewpoint | string)[] = agents.viewpoints || [
      AgentViewpoint.SECURITY,
      AgentViewpoint.PERFORMANCE,
      AgentViewpoint.SCALABILITY,
      AgentViewpoint.SIMPLICITY,
    ];

    if (viewpoints.length > count) {
      throw new Error('More viewpoints than agents');
    }

    // Repeat viewpoints if needed
    const repeatedViewpoints: (AgentViewpoint | string)[] = [];
    for (let i = 0; i < count; i++) {
      repeatedViewpoints.push(viewpoints[i % viewpoints.length]);
    }

    const config: AgentPoolConfig = {
      count,
      viewpoints: repeatedViewpoints,
      weights: agents.weights || {},
      vetoAgents: agents.vetoAgents || [],
    };

    // Setup LLM configs
    if (agents.llmConfigs && Array.isArray(agents.llmConfigs)) {
      config.llmConfigs = agents.llmConfigs.map((llmCfg: any) => ({
        provider: llmCfg.provider || 'anthropic',
        model: llmCfg.model || 'claude-sonnet',
        temperature: llmCfg.temperature ?? 0.7,
        maxTokens: llmCfg.maxTokens ?? 2000,
      }));
    }

    if (agents.defaultLLM) {
      config.defaultLLM = {
        provider: agents.defaultLLM.provider || 'anthropic',
        model: agents.defaultLLM.model || 'claude-sonnet',
        temperature: agents.defaultLLM.temperature ?? 0.7,
        maxTokens: agents.defaultLLM.maxTokens ?? 2000,
      };
    } else {
      config.defaultLLM = {
        provider: 'anthropic',
        model: 'claude-sonnet',
        temperature: 0.7,
        maxTokens: 2000,
      };
    }

    if (!config.llmConfigs) {
      config.llmConfigs = [config.defaultLLM];
    }

    return config;
  }

  private static validateVoting(voting: any): VotingConfig {
    const mode = (voting.mode || ConsensusMode.SUPERMAJORITY) as ConsensusMode;

    const config: VotingConfig = {
      mode,
      threshold: voting.threshold ?? 0.75,
      requiredAgents: voting.requiredAgents || [],
      vetoAgents: voting.vetoAgents || [],
      maxRounds: voting.maxRounds ?? 15,
    };

    if (config.threshold !== undefined && (config.threshold < 0 || config.threshold > 1)) {
      throw new Error('voting.threshold must be between 0 and 1');
    }

    return config;
  }

  /**
   * Create default config
   */
  static createDefault(): OrchestratorConfig {
    return {
      name: 'AI Council',
      description: 'Multi-agent consensus for development decisions',
      logLevel: 'info',

      storage: {
        mode: StorageMode.FILE,
        path: '.council/sessions',
      },

      context: {
        mode: ContextMode.SUMMARIZED,
        maxHistoryRounds: 10,
      },

      memory: {
        mode: MemoryMode.SESSION,
      },

      credentials: {
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      },

      agents: {
        count: 4,
        viewpoints: [
          AgentViewpoint.SECURITY,
          AgentViewpoint.PERFORMANCE,
          AgentViewpoint.SCALABILITY,
          AgentViewpoint.SIMPLICITY,
        ],
        defaultLLM: {
          provider: LLMProvider.ANTHROPIC,
          model: 'claude-sonnet',
          temperature: 0.7,
          maxTokens: 2000,
        },
      },

      voting: {
        mode: ConsensusMode.SUPERMAJORITY,
        threshold: 0.75,
        maxRounds: 15,
      },
    };
  }

  /**
   * Save config to YAML file
   */
  static saveToFile(config: OrchestratorConfig, filePath: string): void {
    const yamlStr = yaml.stringify(config);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, yamlStr, 'utf-8');
  }
}
