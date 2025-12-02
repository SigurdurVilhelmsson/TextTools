import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Custom Turndown rules for better chemistry content handling
 */
function configureTurndown() {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  // Preserve tables properly
  turndownService.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td']);

  // Handle custom note blocks (if they come from Word as specific styles)
  turndownService.addRule('notes', {
    filter: function (node) {
      return (
        node.nodeName === 'DIV' &&
        (node.className.includes('note') ||
         node.className.includes('callout') ||
         node.className.includes('admonition'))
      );
    },
    replacement: function (content) {
      return '\n:::note\n' + content.trim() + '\n:::\n\n';
    }
  });

  // Better handling for subscripts and superscripts (for chemistry formulas)
  turndownService.addRule('subscript', {
    filter: ['sub'],
    replacement: function (content) {
      return '_' + content + '_';
    }
  });

  turndownService.addRule('superscript', {
    filter: ['sup'],
    replacement: function (content) {
      return '^' + content + '^';
    }
  });

  return turndownService;
}

/**
 * Extract images from document and create placeholders
 */
function createImageHandler(outputDir, documentName) {
  let imageCounter = 1;
  const images = [];

  return {
    handler: function (element) {
      const imageBuffer = element.read('base64');
      const extension = element.contentType.split('/')[1] || 'png';
      const imageName = `${documentName}-image-${imageCounter}.${extension}`;
      const imagePath = path.join(outputDir, 'images', imageName);

      images.push({
        buffer: imageBuffer,
        path: imagePath,
        name: imageName,
        placeholder: `![Image ${imageCounter}](./images/${imageName})`
      });

      imageCounter++;
      return { src: images[images.length - 1].placeholder };
    },
    images: images
  };
}

/**
 * Process HTML to clean up and improve markdown conversion
 */
function preprocessHtml(html) {
  // Clean up excessive whitespace
  html = html.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Convert Word's equation elements to LaTeX placeholders
  // This is a simplified approach - for better equation handling, consider using pandoc
  html = html.replace(/<span class="equation">([^<]+)<\/span>/g, '$$$1$$');

  return html;
}

/**
 * Post-process markdown to clean up and improve formatting
 */
function postprocessMarkdown(markdown) {
  // Clean up multiple blank lines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Fix spacing around headers
  markdown = markdown.replace(/\n(#{1,6}\s)/g, '\n\n$1');

  // Ensure proper spacing after headers
  markdown = markdown.replace(/(#{1,6}\s.+)\n([^\n])/g, '$1\n\n$2');

  // Fix table formatting
  markdown = markdown.replace(/\n(\|[^\n]+\|)\n([^\|])/g, '\n$1\n\n$2');

  // Convert subscripts/superscripts to LaTeX format for chemistry
  // H_2_O -> H_2O (for inline math)
  markdown = markdown.replace(/([A-Z][a-z]?)_(\d+)_/g, '$1_$2');

  // Wrap chemical formulas in LaTeX when detected
  // Simple pattern: Capital letter followed by optional lowercase and subscript numbers
  markdown = markdown.replace(/\b([A-Z][a-z]?)(\d+)([A-Z][a-z]?\d*)+\b/g, '$$$&$$');

  return markdown.trim();
}

/**
 * Convert .docx to markdown
 */
export async function convertDocxToMarkdown(inputPath, options = {}) {
  const {
    outputDir = path.dirname(inputPath),
    extractImages = true,
    preserveStyles = true
  } = options;

  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    if (extractImages) {
      await fs.mkdir(path.join(outputDir, 'images'), { recursive: true });
    }

    // Read the .docx file
    const buffer = await fs.readFile(inputPath);

    // Prepare image handler
    const documentName = path.basename(inputPath, '.docx');
    const imageHandler = extractImages
      ? createImageHandler(outputDir, documentName)
      : null;

    // Convert .docx to HTML using mammoth
    const mammothOptions = {
      convertImage: imageHandler ? mammoth.images.inline(imageHandler.handler) : undefined,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p[style-name='Note'] => div.note:fresh",
        "p[style-name='Equation'] => span.equation:fresh"
      ]
    };

    const result = await mammoth.convertToHtml(
      { buffer },
      mammothOptions
    );

    // Preprocess HTML
    let html = preprocessHtml(result.value);

    // Convert HTML to Markdown using Turndown
    const turndownService = configureTurndown();
    let markdown = turndownService.turndown(html);

    // Post-process markdown
    markdown = postprocessMarkdown(markdown);

    // Save images if any were extracted
    if (imageHandler && imageHandler.images.length > 0) {
      for (const image of imageHandler.images) {
        await fs.writeFile(
          image.path,
          Buffer.from(image.buffer, 'base64')
        );
      }
    }

    return {
      markdown,
      images: imageHandler ? imageHandler.images : [],
      warnings: result.messages,
      metadata: {
        originalFile: path.basename(inputPath),
        convertedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    throw new Error(`Failed to convert document: ${error.message}`);
  }
}

/**
 * Extract title from markdown content
 */
export function extractTitle(markdown) {
  // Try to find the first H1 heading
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Try to find any heading
  const headingMatch = markdown.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  return 'Untitled Document';
}

/**
 * Extract title from filename
 */
export function extractTitleFromFilename(filename) {
  const basename = path.basename(filename, path.extname(filename));
  // Convert kebab-case or snake_case to Title Case
  return basename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
