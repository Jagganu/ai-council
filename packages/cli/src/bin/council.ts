#!/usr/bin/env node

/**
 * AI Council CLI - Main entry point
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import {
  Orchestrator,
  ConfigLoader,
  OrchestratorConfig,
  SessionConfig,
} from '@ai-council/core';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  try {
    switch (command) {
      case 'review':
        await handleReview();
        break;
      case 'plan':
        await handlePlan();
        break;
      case 'config':
        await handleConfig();
        break;
      case 'replay':
        await handleReplay();
        break;
      case 'init':
        await handleInit();
        break;
      case 'list':
        await handleList();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleReview() {
  const task = args.slice(1).join(' ') || 'Review this code';
  console.log(chalk.blue('\n🤔 Starting AI Council deliberation...\n'));

  const configPath = getConfigPath();
  const config = ConfigLoader.loadFromFile(configPath);

  const sessionId = `session-${Date.now()}`;
  const orchestrator = new Orchestrator();

  await orchestrator.initialize(config, {
    sessionId,
    task,
    startTime: new Date(),
    orchestratorConfig: config,
  });

  console.log(chalk.cyan(`📋 Task: ${task}\n`));
  console.log(chalk.cyan(`🔧 Agents: ${config.agents.count}`));
  console.log(chalk.cyan(`🗳️  Voting: ${config.voting.mode}\n`));

  const result = await orchestrator.processTask(task);

  // Display results
  displayResults(result);

  // Save session
  const storage = await orchestrator.getStorage();
  await storage.saveSession(result);

  console.log(chalk.green(`\n✅ Session saved: ${sessionId}`));
  console.log(chalk.gray(`Run 'council replay ${sessionId}' to view details\n`));
}

async function handlePlan() {
  const task = args.slice(1).join(' ') || 'Plan this task';
  console.log(chalk.blue('\n🎯 AI Council Planning Phase\n'));

  const configPath = getConfigPath();
  const config = ConfigLoader.loadFromFile(configPath);

  const sessionId = `session-plan-${Date.now()}`;
  const orchestrator = new Orchestrator();

  await orchestrator.initialize(config, {
    sessionId,
    task,
    startTime: new Date(),
    orchestratorConfig: config,
  });

  console.log(chalk.cyan(`📋 Task: ${task}\n`));

  const result = await orchestrator.processTask(task);
  displayResults(result);

  const storage = await orchestrator.getStorage();
  await storage.saveSession(result);

  console.log(chalk.green(`\n✅ Session saved: ${sessionId}\n`));
}

async function handleConfig() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    console.log(chalk.yellow('⚠️  No config found. Run: council init\n'));
    return;
  }

  const config = ConfigLoader.loadFromFile(configPath);
  console.log(chalk.blue('\n📋 Current Configuration:\n'));
  console.log(JSON.stringify(config, null, 2));
  console.log();
}

async function handleReplay() {
  const sessionId = args[1];

  if (!sessionId) {
    console.log(chalk.red('Usage: council replay <sessionId>\n'));
    return;
  }

  const configPath = getConfigPath();
  const config = ConfigLoader.loadFromFile(configPath);
  const storage = new (await import('@ai-council/core')).SessionStorage({
    mode: 'file',
    path: config.storage.path,
  });

  const session = await storage.loadSession(sessionId);

  if (!session) {
    console.log(chalk.red(`❌ Session not found: ${sessionId}\n`));
    return;
  }

  console.log(chalk.blue(`\n📼 Replaying session: ${sessionId}\n`));

  for (const entry of session.sessionLog) {
    const time = entry.timestamp.toString().slice(16, 24);
    console.log(chalk.gray(`[${time}]`), chalk.cyan(entry.eventType), entry.data);
  }

  console.log();
}

async function handleInit() {
  const configPath = getConfigPath();

  if (fs.existsSync(configPath)) {
    console.log(chalk.yellow(`⚠️  Config already exists: ${configPath}\n`));
    return;
  }

  console.log(chalk.blue('\n🚀 AI Council Setup Wizard\n'));

  const config = ConfigLoader.createDefault();

  // Check for API keys
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log(
      chalk.yellow(
        '⚠️  No LLM credentials found.\n   Set ANTHROPIC_API_KEY or OPENAI_API_KEY\n'
      )
    );
  }

  ConfigLoader.saveToFile(config, configPath);
  console.log(chalk.green(`✅ Config created: ${configPath}\n`));
  console.log('Next: council review "your task"\n');
}

async function handleList() {
  const configPath = getConfigPath();
  const config = ConfigLoader.loadFromFile(configPath);
  const storage = new (await import('@ai-council/core')).SessionStorage({
    mode: 'file',
    path: config.storage.path,
  });

  const sessions = await storage.listSessions();

  console.log(chalk.blue('\n📋 Sessions:\n'));
  if (sessions.length === 0) {
    console.log(chalk.gray('No sessions yet\n'));
  } else {
    for (const session of sessions) {
      console.log(chalk.cyan(`  ${session}`));
    }
    console.log();
  }
}

function displayResults(result: any) {
  console.log(chalk.blue('\n📊 Results:\n'));

  for (const decision of result.decisions) {
    console.log(chalk.cyan(`Phase: ${decision.phase}`));
    console.log(`Rounds: ${decision.round}`);
    console.log(`Approved: ${decision.finalApproved ? '✅' : '❌'}\n`);
  }

  const consensusCount = result.consensusResults.length;
  const achievedCount = result.consensusResults.filter((r: any) => r.achieved).length;
  console.log(
    chalk.cyan(`Consensus: ${achievedCount}/${consensusCount} rounds achieved`)
  );
}

function getConfigPath(): string {
  return process.env.COUNCIL_CONFIG || '.council/config.yaml';
}

function showHelp() {
  console.log(chalk.blue('\n🤖 AI Council - Multi-Agent Consensus\n'));
  console.log(chalk.cyan('Usage:'));
  console.log('  council review <task>     Run full deliberation');
  console.log('  council plan <task>       Run planning phase only');
  console.log('  council config            Show current config');
  console.log('  council replay <sessionId> Replay a session');
  console.log('  council init              Initialize config');
  console.log('  council list              List sessions\n');
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
