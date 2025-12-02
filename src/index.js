import { promises as fs } from 'fs';
import path from 'path';
import {
  convertDocxToMarkdown,
  extractTitle,
  extractTitleFromFilename
} from './converter.js';
import { addFrontmatterToMarkdown } from './frontmatter.js';
import {
  generateOutputPath,
  validateInputFile,
  createConversionSummary
} from './utils.js';

/**
 * Main conversion function
 */
export async function convertDocument(inputPath, options = {}) {
  const {
    outputDir = path.dirname(inputPath),
    outputFile = null,
    extractImages = true,
    frontmatter = {},
    verbose = false
  } = options;

  // Validate input
  await validateInputFile(inputPath);

  // Convert document
  if (verbose) {
    console.log(`Converting: ${path.basename(inputPath)}`);
  }

  const result = await convertDocxToMarkdown(inputPath, {
    outputDir,
    extractImages,
    preserveStyles: true
  });

  // Extract title if not provided
  const title = frontmatter.title ||
                extractTitle(result.markdown) ||
                extractTitleFromFilename(inputPath);

  // Add frontmatter
  const finalMarkdown = addFrontmatterToMarkdown(result.markdown, {
    title,
    ...frontmatter
  });

  // Determine output path
  const outputPath = outputFile || generateOutputPath(inputPath, outputDir);

  // Write output file
  await fs.writeFile(outputPath, finalMarkdown, 'utf-8');

  return {
    success: true,
    inputFile: inputPath,
    outputFile: outputPath,
    imagesExtracted: result.images.length,
    warnings: result.warnings,
    metadata: result.metadata
  };
}

/**
 * Batch conversion function
 */
export async function convertMultipleDocuments(inputFiles, options = {}) {
  const { verbose = false } = options;
  const results = [];

  if (verbose) {
    console.log(`\nConverting ${inputFiles.length} document(s)...\n`);
  }

  for (const inputFile of inputFiles) {
    try {
      const result = await convertDocument(inputFile, options);
      results.push(result);

      if (verbose) {
        console.log(`✓ ${path.basename(inputFile)} -> ${path.basename(result.outputFile)}`);
      }
    } catch (error) {
      results.push({
        success: false,
        inputFile,
        error: error.message
      });

      if (verbose) {
        console.log(`✗ ${path.basename(inputFile)}: ${error.message}`);
      }
    }
  }

  // Create summary
  const summary = createConversionSummary(results);

  if (verbose) {
    console.log(`\nConversion complete: ${summary.successful}/${summary.total} successful`);
  }

  return {
    results,
    summary
  };
}

export {
  convertDocxToMarkdown,
  addFrontmatterToMarkdown
};
