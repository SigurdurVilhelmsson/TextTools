import { promises as fs } from 'fs';
import path from 'path';

/**
 * Check if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Get all .docx files from a directory recursively
 */
async function getDocxFilesRecursive(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    // Skip node_modules and .git directories
    if (file.name === 'node_modules' || file.name === '.git') {
      continue;
    }

    if (file.isDirectory()) {
      await getDocxFilesRecursive(filePath, fileList);
    } else if (file.name.toLowerCase().endsWith('.docx') &&
               !file.name.startsWith('~$')) { // Skip Word temp files
      fileList.push(path.resolve(filePath));
    }
  }

  return fileList;
}

/**
 * Get all .docx files from a directory or pattern
 */
export async function findDocxFiles(inputPath) {
  try {
    const stats = await fs.stat(inputPath).catch(() => null);

    if (stats && stats.isDirectory()) {
      return await getDocxFilesRecursive(inputPath);
    } else if (stats && stats.isFile() && inputPath.toLowerCase().endsWith('.docx')) {
      return [path.resolve(inputPath)];
    } else {
      throw new Error(`Invalid input: ${inputPath}`);
    }
  } catch (error) {
    throw new Error(`Failed to find files: ${error.message}`);
  }
}

/**
 * Generate output filename
 */
export function generateOutputPath(inputPath, outputDir = null) {
  const basename = path.basename(inputPath, '.docx');
  const outputFilename = `${basename}.md`;

  if (outputDir) {
    return path.join(outputDir, outputFilename);
  }

  return path.join(path.dirname(inputPath), outputFilename);
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file statistics
 */
export async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validate input file
 */
export async function validateInputFile(filePath) {
  // Check if file exists
  if (!(await fileExists(filePath))) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check if it's a .docx file
  if (!filePath.toLowerCase().endsWith('.docx')) {
    throw new Error(`Invalid file type. Expected .docx file, got: ${path.extname(filePath)}`);
  }

  // Check if file is readable
  try {
    await fs.access(filePath, fs.constants.R_OK);
  } catch {
    throw new Error(`File is not readable: ${filePath}`);
  }

  return true;
}

/**
 * Create a summary of conversion results
 */
export function createConversionSummary(results) {
  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0
  };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9æðþöáéíóúý_\-\.]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
