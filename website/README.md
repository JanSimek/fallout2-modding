# Fallout 2 Modding Documentation

SSL scripting and engine documentation for Fallout 2 Community Edition.

Built with [Docusaurus](https://docusaurus.io/).

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Project Structure

```
website/
├── docs/                    # Documentation content (MDX)
│   ├── ssl/                 # SSL scripting docs
│   │   ├── functions/       # Function reference
│   │   └── ...
│   └── formats/             # File format docs
├── src/
│   ├── components/          # React components
│   ├── css/                 # Global styles
│   ├── data/                # Generated data (function index)
│   └── theme/               # Theme customizations
├── scripts/                 # Build scripts
└── static/                  # Static assets
```

## Custom Components

### FnRef - Function Reference Link

Links to function implementations in the fallout2-ce source code.

```mdx
## self_obj

Returns the script's owner object.

<FnRef fn="self_obj" />
```

**Props:**
- `fn` - Function name (SSL name like `self_obj` or C++ name like `opGetSelf`)
- `label` - Optional custom label (default: "View implementation")
- `showLines` - Show line numbers in label
- `inline` - Render as inline link instead of block

The component uses a generated index that maps function names to their locations in the fallout2-ce repository with pinned commit hashes for stable links.

### ImplLink - Direct Implementation Link

Links directly to a file/lines in a GitHub repository.

```mdx
<ImplLink
  repo="fallout2-ce/fallout2-ce"
  path="src/proto_types.h"
  lines={[27, 35]}
  label="View item type enum"
/>
```

### FunctionTag - Tag Badge

Displays a colored badge (vanilla/sfall). Use CSS classes in MDX:

```mdx
## function_name <span class="tag-vanilla">vanilla</span> {#function_name}
## sfall_function <span class="tag-sfall">sfall</span> {#sfall_function}
```

## Function Index Generator

The function index maps SSL function names to their implementation locations in fallout2-ce.

### Usage

```bash
# Generate/update the index (interactive - shows diff, asks for confirmation)
npm run generate-index

# Preview changes without writing (dry run)
npm run generate-index:dry

# Auto-confirm changes (for CI/automation)
npm run generate-index:yes
```

### How It Works

1. Clones/updates the fallout2-ce repository to `.fallout2-ce/`
2. Parses C++ source files for opcode function definitions
3. Extracts SSL function names from comments (e.g., `// self_obj`)
4. Outputs `src/data/function-index.json` with file paths, line numbers, and commit hash

### Index Format

```json
{
  "_meta": {
    "repo": "fallout2-ce/fallout2-ce",
    "commit": "abc123...",
    "shortCommit": "abc123",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  },
  "functions": {
    "self_obj": {
      "file": "src/interpreter_extra.cc",
      "startLine": 1079,
      "endLine": 1083,
      "kind": "opcode",
      "commit": "abc123",
      "cppName": "opGetSelf"
    }
  }
}
```

### Options

```bash
node scripts/generate-function-index.js [options]

Options:
  --repo-path <path>  Path to fallout2-ce repo (default: .fallout2-ce)
  --yes, -y           Auto-confirm changes without prompting
  --dry-run           Show what would change without writing
```

## Adding New Function Documentation

1. Add the function to the appropriate file in `docs/ssl/functions/`
2. Use this format:

```mdx
## function_name <span class="tag-vanilla">vanilla</span> {#function_name}

```ssl
return_type function_name(param_type param)
```

Description of what the function does.

**Parameters:**
- `param` - Description

**Returns:** `return_type` - Description

<FnRef fn="function_name" />

---
```

3. Run `npm run generate-index:dry` to check if the function is in the index

### Bulk Adding FnRef Links

```bash
node scripts/add-fnref-links.js
```

This script automatically adds `<FnRef>` links to all function headings that exist in the index.

## SSL Syntax Highlighting

Custom Prism language definition for SSL is in `src/prism/ssl.js`.

## Deployment

```bash
# Build the site
npm run build

# Serve locally to test
npm run serve
```

For GitHub Pages, update `docusaurus.config.ts`:
- `url` - Your GitHub Pages URL
- `baseUrl` - Repository name (e.g., `/fallout2-modding/`)
- `organizationName` - Your GitHub username
