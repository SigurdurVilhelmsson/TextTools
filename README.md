# doc2md - Word to Markdown Converter

Convert Word documents (.docx) to Markdown with custom YAML frontmatter, designed for educational content and technical documentation. Perfect for chemistry textbooks, course materials, and any content with equations, tables, and Icelandic text.

## Features

- **Convert .docx to Markdown** - Preserves formatting, tables, lists, and structure
- **Custom Frontmatter** - Add YAML frontmatter with title, section, chapter, and objectives
- **Image Extraction** - Automatically extract and reference images with sequential naming
- **Chemistry Support** - Handle equations with LaTeX formatting for KaTeX rendering
- **Batch Conversion** - Convert multiple files at once
- **Config Files** - Use JSON or YAML config files for consistent settings
- **Icelandic Support** - Full UTF-8 support for Icelandic characters

## Installation

### Local Installation

```bash
npm install
```

### Global Installation

```bash
npm install -g .
```

After global installation, you can use `doc2md` command from anywhere.

## Quick Start

### Convert a single file

```bash
npm run convert input.docx
```

Or with the CLI directly:

```bash
node bin/doc2md.js convert input.docx
```

### Convert with custom options

```bash
node bin/doc2md.js convert input.docx \
  --output ./output \
  --title "Eðlis- og efnafræðilegir eiginleikar" \
  --section "1.3" \
  --chapter 1 \
  --objectives "Greina á milli eðlislegra eiginleika,Útskýra muninn á breytingum"
```

### Batch conversion

```bash
# Convert all .docx files in a directory
node bin/doc2md.js convert ./documents --batch --verbose
```

## Usage

### Commands

#### `convert <input>`

Convert a .docx file or directory to Markdown.

**Options:**

- `-o, --output <dir>` - Output directory for converted files
- `-c, --config <file>` - Config file path (JSON or YAML)
- `-t, --title <title>` - Document title for frontmatter
- `-s, --section <section>` - Section number (e.g., "1.3")
- `--chapter <number>` - Chapter number
- `--no-images` - Skip image extraction
- `--objectives <items>` - Comma-separated list of objectives
- `-v, --verbose` - Verbose output
- `-b, --batch` - Batch mode for multiple files

**Examples:**

```bash
# Basic conversion
node bin/doc2md.js convert document.docx

# With custom frontmatter
node bin/doc2md.js convert document.docx \
  --title "Chapter Title" \
  --section "2.1" \
  --chapter 2

# With config file
node bin/doc2md.js convert document.docx --config doc2md.config.json

# Batch conversion with verbose output
node bin/doc2md.js convert ./documents --batch --verbose
```

#### `init`

Create an example config file.

**Options:**

- `-f, --format <format>` - Config format (json or yaml), defaults to json

**Examples:**

```bash
# Create JSON config
node bin/doc2md.js init

# Create YAML config
node bin/doc2md.js init --format yaml
```

## Configuration

### Config File

Create a config file to set default options for all conversions. The tool automatically looks for:

- `.doc2mdrc.json`
- `.doc2mdrc.yaml` / `.doc2mdrc.yml`
- `doc2md.config.json`
- `doc2md.config.yaml` / `doc2md.config.yml`

**Example JSON config:**

```json
{
  "outputDir": "./output",
  "extractImages": true,
  "frontmatter": {
    "chapter": 1,
    "section": "1.1",
    "objectives": [
      "Greina á milli eðlislegra og efnafræðilegra eiginleika",
      "Útskýra muninn á eðlisbreytingum og efnahvörfum"
    ]
  }
}
```

**Example YAML config:**

```yaml
outputDir: ./output
extractImages: true
frontmatter:
  chapter: 1
  section: "1.1"
  objectives:
    - Greina á milli eðlislegra og efnafræðilegra eiginleika
    - Útskýra muninn á eðlisbreytingum og efnahvörfum
```

## Output Format

The converter generates Markdown files with YAML frontmatter:

```markdown
---
title: "Eðlis- og efnafræðilegir eiginleikar"
section: "1.3"
chapter: 1
objectives:
  - Greina á milli eðlislegra og efnafræðilegra eiginleika
  - Útskýra muninn á eðlisbreytingum og efnahvörfum
---

# Eðlis- og efnafræðilegir eiginleikar

Content with markdown formatting...

## Tables

| Eiginleiki | Lýsing |
|------------|--------|
| **Litur** | Sjónrænn eiginleiki |

## Images

![Image 1](./images/document-image-1.png)

## Equations

Inline equations: $H_2O$ or $\text{Fe}_2\text{O}_3$

Block equations:

$$
\text{2H}_2 + \text{O}_2 \rightarrow \text{2H}_2\text{O}
$$
```

## Working with Chemistry Content

### Equations

The converter handles equations in several ways:

1. **Inline equations**: Wrapped in single dollar signs `$...$`
2. **Block equations**: Wrapped in double dollar signs `$$...$$`
3. **Chemical formulas**: Automatically detected and wrapped (e.g., `H_2O` becomes `$H_2O$`)

### Subscripts and Superscripts

- Subscripts (H₂O) → `$H_2O$`
- Superscripts → `$x^2$`

### Special Characters

Full support for Icelandic characters: á, é, í, ó, ú, ý, þ, æ, ð, ö

## Image Handling

When `extractImages` is enabled:

1. Images are extracted from the Word document
2. Saved to an `images/` subdirectory
3. Named sequentially: `document-name-image-1.png`, `document-name-image-2.png`, etc.
4. Referenced in markdown with relative paths

## Project Structure

```
TextTools/
├── bin/
│   └── doc2md.js          # CLI entry point
├── src/
│   ├── index.js           # Main conversion orchestration
│   ├── converter.js       # Core .docx to Markdown conversion
│   ├── frontmatter.js     # YAML frontmatter generation
│   ├── config.js          # Config file handling
│   └── utils.js           # Utility functions
├── examples/
│   ├── .doc2mdrc.json     # Example config file
│   └── sample.docx        # Sample document (to be added)
├── test/
│   └── (tests to be added)
├── package.json
├── LICENSE
└── README.md
```

## Dependencies

- **mammoth** - Converts .docx to HTML
- **turndown** - Converts HTML to Markdown
- **commander** - CLI framework
- **js-yaml** - YAML parsing and generation
- **chalk** - Terminal styling

## Development

### Adding Custom Styles

Edit `src/converter.js` to add custom Word style mappings:

```javascript
styleMap: [
  "p[style-name='Custom Style'] => div.custom:fresh",
  // Add more mappings...
]
```

### Adding Custom Turndown Rules

Extend the Turndown configuration in `src/converter.js`:

```javascript
turndownService.addRule('customRule', {
  filter: function (node) {
    // Your filter logic
  },
  replacement: function (content) {
    // Your replacement logic
  }
});
```

## Alternative: Using LibreOffice

If you prefer to use LibreOffice headless for conversion (better for complex documents):

```bash
# Convert to HTML first
libreoffice --headless --convert-to html input.docx --outdir ./temp

# Then use doc2md on the HTML (requires extension)
# Or use pandoc as an alternative:
pandoc -f docx -t markdown input.docx -o output.md
```

## Alternative: Using Pandoc

For better equation support, you can use Pandoc:

```bash
# Install pandoc
sudo apt-get install pandoc

# Convert with pandoc
pandoc -f docx -t markdown input.docx -o output.md --extract-media=./images
```

Then add frontmatter manually or use the frontmatter module programmatically.

## Troubleshooting

### Equations not converting properly

- Ensure equations in Word are created using Word's equation editor
- Consider using Pandoc for better equation support
- Check that the equations are in MathML or OMML format

### Images not extracting

- Verify images are embedded in the document (not linked)
- Check that the output directory has write permissions
- Use `--verbose` flag to see detailed error messages

### Icelandic characters appearing incorrectly

- Ensure your terminal supports UTF-8
- Check that the .docx file is saved with proper encoding

## Roadmap

- [ ] Add interactive mode for frontmatter input
- [ ] Improve equation detection and conversion
- [ ] Add support for custom Word styles as markdown classes
- [ ] Implement LaTeX equation validation
- [ ] Add unit tests
- [ ] Create web interface

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

Sigurður E. Vilhelmsson

## Support

For issues and feature requests, please use the GitHub issue tracker.
