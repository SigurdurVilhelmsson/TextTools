#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { convertDocument, convertMultipleDocuments } from '../src/index.js';
import { loadConfig, findDefaultConfig, mergeOptions } from '../src/config.js';
import { findDocxFiles } from '../src/utils.js';
import { promises as fs } from 'fs';

const program = new Command();

program
  .name('doc2md')
  .description('Convert Word documents (.docx) to Markdown with custom frontmatter')
  .version('1.0.0');

program
  .command('convert <input>')
  .description('Convert a .docx file or directory to Markdown')
  .option('-o, --output <dir>', 'Output directory for converted files')
  .option('-c, --config <file>', 'Config file path (JSON or YAML)')
  .option('-t, --title <title>', 'Document title for frontmatter')
  .option('-s, --section <section>', 'Section number (e.g., "1.3")')
  .option('--chapter <number>', 'Chapter number', parseInt)
  .option('--no-images', 'Skip image extraction')
  .option('--objectives <items>', 'Comma-separated list of objectives')
  .option('-v, --verbose', 'Verbose output')
  .option('-b, --batch', 'Batch mode for multiple files')
  .action(async (input, options) => {
    try {
      console.log(chalk.blue.bold('\n📄 doc2md - Word to Markdown Converter\n'));

      // Load config file if specified or find default
      let config = {};
      if (options.config) {
        config = await loadConfig(options.config);
        if (options.verbose) {
          console.log(chalk.gray(`Using config file: ${options.config}\n`));
        }
      } else {
        const defaultConfig = await findDefaultConfig();
        if (defaultConfig) {
          config = await loadConfig(defaultConfig);
          if (options.verbose) {
            console.log(chalk.gray(`Using config file: ${defaultConfig}\n`));
          }
        }
      }

      // Parse objectives if provided
      let objectives = [];
      if (options.objectives) {
        objectives = options.objectives.split(',').map(o => o.trim());
      } else if (config.frontmatter?.objectives) {
        objectives = config.frontmatter.objectives;
      }

      // Merge options
      const mergedOptions = mergeOptions(config, {
        outputDir: options.output,
        extractImages: options.images !== false,
        verbose: options.verbose || false,
        frontmatter: {
          title: options.title,
          section: options.section,
          chapter: options.chapter,
          objectives: objectives.length > 0 ? objectives : undefined
        }
      });

      // Find input files
      const inputFiles = await findDocxFiles(input);

      if (inputFiles.length === 0) {
        console.log(chalk.yellow('⚠ No .docx files found'));
        process.exit(1);
      }

      if (inputFiles.length === 1 && !options.batch) {
        // Single file conversion
        const result = await convertDocument(inputFiles[0], mergedOptions);

        if (result.success) {
          console.log(chalk.green('✓ Conversion successful!\n'));
          console.log(chalk.gray(`Input:  ${result.inputFile}`));
          console.log(chalk.gray(`Output: ${result.outputFile}`));

          if (result.imagesExtracted > 0) {
            console.log(chalk.gray(`Images: ${result.imagesExtracted} extracted`));
          }

          if (result.warnings && result.warnings.length > 0 && options.verbose) {
            console.log(chalk.yellow(`\n⚠ Warnings:`));
            result.warnings.forEach(w => console.log(chalk.gray(`  - ${w.message}`)));
          }

          console.log();
        }
      } else {
        // Batch conversion
        console.log(chalk.gray(`Found ${inputFiles.length} file(s) to convert\n`));

        const batchResult = await convertMultipleDocuments(inputFiles, mergedOptions);

        // Display results
        console.log();
        console.log(chalk.green(`✓ Batch conversion complete!\n`));
        console.log(chalk.gray(`Total:      ${batchResult.summary.total}`));
        console.log(chalk.green(`Successful: ${batchResult.summary.successful}`));

        if (batchResult.summary.failed > 0) {
          console.log(chalk.red(`Failed:     ${batchResult.summary.failed}`));

          if (options.verbose) {
            console.log(chalk.yellow(`\nFailed files:`));
            batchResult.results
              .filter(r => !r.success)
              .forEach(r => {
                console.log(chalk.gray(`  - ${path.basename(r.inputFile)}: ${r.error}`));
              });
          }
        }

        console.log();
      }

    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      if (options.verbose && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Create example config file')
  .option('-f, --format <format>', 'Config format (json or yaml)', 'json')
  .action(async (options) => {
    try {
      const format = options.format.toLowerCase();
      const filename = format === 'yaml' ? '.doc2mdrc.yaml' : '.doc2mdrc.json';

      const exampleConfig = {
        outputDir: './output',
        extractImages: true,
        frontmatter: {
          chapter: 1,
          section: '1.1',
          objectives: [
            'First objective',
            'Second objective'
          ]
        }
      };

      if (format === 'yaml') {
        const yaml = await import('js-yaml');
        await fs.writeFile(filename, yaml.dump(exampleConfig, { indent: 2 }), 'utf-8');
      } else {
        await fs.writeFile(filename, JSON.stringify(exampleConfig, null, 2), 'utf-8');
      }

      console.log(chalk.green(`✓ Created ${filename}`));
      console.log(chalk.gray('Edit this file to customize your conversion settings\n'));

    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();
