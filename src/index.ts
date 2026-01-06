#!/usr/bin/env node

import 'dotenv/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { loadConfig, getDefaultConfig } from './config/loader.js';
import { startServer } from './server.js';

async function main(): Promise<void> {
  try {
    // Get paths from environment or use defaults
    const configPath = process.env.CONFIG_PATH || join(process.cwd(), 'config');
    const dataPath = process.env.DATA_PATH || join(process.cwd(), 'data');

    // Load configuration
    let config;
    if (existsSync(join(configPath, 'providers.yaml'))) {
      console.error(`[model-optimizer] Loading config from: ${configPath}`);
      config = await loadConfig(configPath);
    } else {
      console.error('[model-optimizer] Using default configuration');
      config = getDefaultConfig();
    }

    // Start the MCP server
    await startServer(config, dataPath);
  } catch (error) {
    console.error('[model-optimizer] Fatal error:', error);
    process.exit(1);
  }
}

main();
