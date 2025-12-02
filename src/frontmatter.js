import yaml from 'js-yaml';

/**
 * Generate YAML frontmatter for the markdown document
 */
export function generateFrontmatter(options = {}) {
  const {
    title = 'Untitled',
    section = null,
    chapter = null,
    objectives = [],
    customFields = {}
  } = options;

  const frontmatter = {
    title,
    ...(section !== null && { section }),
    ...(chapter !== null && { chapter }),
    ...(objectives.length > 0 && { objectives }),
    ...customFields
  };

  return frontmatter;
}

/**
 * Convert frontmatter object to YAML string
 */
export function frontmatterToYaml(frontmatter) {
  const yamlString = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false
  });

  return `---\n${yamlString}---\n\n`;
}

/**
 * Combine frontmatter and markdown content
 */
export function addFrontmatterToMarkdown(markdown, frontmatterOptions) {
  const frontmatter = generateFrontmatter(frontmatterOptions);
  const yamlFrontmatter = frontmatterToYaml(frontmatter);

  return yamlFrontmatter + markdown;
}

/**
 * Parse existing frontmatter from markdown if present
 */
export function parseFrontmatter(markdown) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n\n/;
  const match = markdown.match(frontmatterRegex);

  if (match) {
    try {
      const frontmatter = yaml.load(match[1]);
      const content = markdown.replace(frontmatterRegex, '');
      return { frontmatter, content };
    } catch (error) {
      return { frontmatter: null, content: markdown };
    }
  }

  return { frontmatter: null, content: markdown };
}

/**
 * Merge frontmatter with existing frontmatter
 */
export function mergeFrontmatter(existing, updates) {
  return {
    ...existing,
    ...updates,
    // Merge arrays like objectives
    ...(updates.objectives && {
      objectives: [
        ...(existing.objectives || []),
        ...updates.objectives
      ]
    })
  };
}
