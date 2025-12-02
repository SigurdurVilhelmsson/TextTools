# Examples

This directory contains example configuration files and sample documents for doc2md.

## Configuration Files

### JSON Config (`.doc2mdrc.json`)

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

### YAML Config (`.doc2mdrc.yaml`)

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

## Usage

To use these config files:

1. Copy one of the config files to your project root:
   ```bash
   cp examples/.doc2mdrc.json .
   ```

2. Edit the config to match your needs

3. Run doc2md (it will automatically find the config):
   ```bash
   node bin/doc2md.js convert your-document.docx
   ```

Or specify the config explicitly:
```bash
node bin/doc2md.js convert your-document.docx --config examples/.doc2mdrc.json
```

## Sample Documents

To test the converter, create a Word document with:

- Headings (Heading 1, Heading 2, etc.)
- Bold and italic text
- Tables
- Images
- Chemistry equations (using Word's equation editor)
- Icelandic text: "Þetta er próf með íslenskum stöfum: á, é, í, ó, ú, ý, þ, æ, ð, ö"

Then run:
```bash
node bin/doc2md.js convert your-test.docx --verbose
```
