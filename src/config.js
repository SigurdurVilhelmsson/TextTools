import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Load configuration from a file (JSON or YAML)
 */
export async function loadConfig(configPath) {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const ext = path.extname(configPath).toLowerCase();

    if (ext === '.json') {
      return JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      return yaml.load(content);
    } else {
      throw new Error(`Unsupported config file format: ${ext}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Config file not found: ${configPath}`);
    }
    throw new Error(`Failed to load config: ${error.message}`);
  }
}

/**
 * Look for default config files in the current directory
 */
export async function findDefaultConfig() {
  const defaultNames = [
    '.doc2mdrc.json',
    '.doc2mdrc.yaml',
    '.doc2mdrc.yml',
    'doc2md.config.json',
    'doc2md.config.yaml',
    'doc2md.config.yml'
  ];

  for (const name of defaultNames) {
    try {
      await fs.access(name);
      return name;
    } catch {
      // File doesn't exist, try next
      continue;
    }
  }

  return null;
}

/**
 * Merge CLI options with config file
 */
export function mergeOptions(configOptions = {}, cliOptions = {}) {
  return {
    ...configOptions,
    ...cliOptions,
    // Merge nested objects
    frontmatter: {
      ...(configOptions.frontmatter || {}),
      ...(cliOptions.frontmatter || {})
    }
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];

  // Validate chapter is a number if provided
  if (config.frontmatter?.chapter !== undefined &&
      typeof config.frontmatter.chapter !== 'number') {
    errors.push('Chapter must be a number');
  }

  // Validate objectives is an array if provided
  if (config.frontmatter?.objectives !== undefined &&
      !Array.isArray(config.frontmatter.objectives)) {
    errors.push('Objectives must be an array');
  }

  // Validate outputDir is a string if provided
  if (config.outputDir !== undefined &&
      typeof config.outputDir !== 'string') {
    errors.push('outputDir must be a string');
  }

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

/**
 * Create example config file
 */
export function getExampleConfig() {
  return {
    outputDir: './output',
    extractImages: true,
    frontmatter: {
      chapter: 1,
      section: '1.1',
      objectives: [
        'Example objective 1',
        'Example objective 2'
      ]
    }
  };
}
