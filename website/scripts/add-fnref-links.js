#!/usr/bin/env node
/**
 * Adds <FnRef fn="..."> links to function documentation files.
 * Finds function headings and adds FnRef before the --- separator.
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'ssl', 'functions');
const INDEX_FILE = path.join(__dirname, '..', 'src', 'data', 'function-index.json');

// Load function index
const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));

// Files to process
const FILES = [
  'script.mdx',
  'object.mdx',
  'critter.mdx',
  'inventory.mdx',
  'animation.mdx',
  'combat.mdx',
  'dialog.mdx',
  'map.mdx',
  'time.mdx',
  'skill.mdx',
  'party.mdx',
  'meta.mdx',
];

// Pattern to match function headings: ## function_name <span...> {#function_name}
const HEADING_PATTERN = /^## (\w+) <span[^>]*>[^<]*<\/span> \{#\w+\}$/;

function processFile(filename) {
  const filepath = path.join(DOCS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`Skipping ${filename} - not found`);
    return;
  }

  let content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  const newLines = [];

  let currentFunction = null;
  let addedCount = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this is a function heading
    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
      currentFunction = headingMatch[1];
    }

    // Check if this is a separator and we have a current function
    if (line === '---' && currentFunction) {
      // Check if the previous non-empty line is already a FnRef
      let prevIdx = newLines.length - 1;
      while (prevIdx >= 0 && newLines[prevIdx].trim() === '') {
        prevIdx--;
      }

      const prevLine = prevIdx >= 0 ? newLines[prevIdx] : '';
      const hasFnRef = prevLine.includes('<FnRef');

      // Check if function exists in index
      const inIndex = index.functions[currentFunction];

      if (!hasFnRef && inIndex) {
        // Add FnRef before the separator
        newLines.push('');
        newLines.push(`<FnRef fn="${currentFunction}" />`);
        addedCount++;
      }

      currentFunction = null;
    }

    newLines.push(line);
    i++;
  }

  // Handle last function (no trailing ---)
  if (currentFunction && index.functions[currentFunction]) {
    // Check if already has FnRef
    let prevIdx = newLines.length - 1;
    while (prevIdx >= 0 && newLines[prevIdx].trim() === '') {
      prevIdx--;
    }
    const prevLine = prevIdx >= 0 ? newLines[prevIdx] : '';
    if (!prevLine.includes('<FnRef')) {
      newLines.push('');
      newLines.push(`<FnRef fn="${currentFunction}" />`);
      addedCount++;
    }
  }

  // Write back
  fs.writeFileSync(filepath, newLines.join('\n'));
  console.log(`${filename}: Added ${addedCount} FnRef links`);
}

// Process all files
console.log('Adding FnRef links to function documentation...\n');
for (const file of FILES) {
  processFile(file);
}
console.log('\nDone!');
