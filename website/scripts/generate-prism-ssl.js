#!/usr/bin/env node
/**
 * Generates the Prism SSL language definition from documented functions in MDX files.
 *
 * Run: node scripts/generate-prism-ssl.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const functionsDir = path.join(__dirname, '../docs/ssl/functions');
const outputPath = path.join(__dirname, '../src/prism/ssl.js');

// Extract function names from MDX documentation using the {#anchor} pattern
const mdxFiles = fs.readdirSync(functionsDir).filter(f => f.endsWith('.mdx'));

const functionNames = new Set();

for (const file of mdxFiles) {
  const content = fs.readFileSync(path.join(functionsDir, file), 'utf-8');
  // Match {#function_name} anchors (only lowercase with underscores)
  const matches = content.matchAll(/\{#([a-z][a-z0-9_]*)\}/g);
  for (const match of matches) {
    functionNames.add(match[1]);
  }
}

const sslFunctions = Array.from(functionNames).sort();

// Build the pattern
const builtinPattern = sslFunctions.join('|');

const sslLanguage = `/**
 * Prism syntax highlighting for SSL (Star Trek Scripting Language)
 * Used in Fallout 2 modding.
 *
 * AUTO-GENERATED from docs/ssl/functions/*.mdx
 * Run: node scripts/generate-prism-ssl.js
 *
 * Last generated: ${new Date().toISOString()}
 * Function count: ${sslFunctions.length}
 */

const sslLanguage = {
  comment: [
    {
      pattern: /\\/\\*[\\s\\S]*?\\*\\//,
      greedy: true,
    },
    {
      pattern: /\\/\\/.*/,
      greedy: true,
    },
  ],
  string: {
    pattern: /"(?:[^"\\\\]|\\\\.)*"/,
    greedy: true,
  },
  directive: {
    pattern: /#\\s*(?:include|define|ifdef|ifndef|else|endif|undef)\\b.*/,
    alias: 'property',
  },
  keyword:
    /\\b(?:if|then|else|while|do|begin|end|return|call|procedure|variable|for|foreach|in|break|continue|and|or|not|bwand|bwor|bwxor|bwnot|import|export)\\b/,
  'class-name': {
    pattern: /\\b(?:int|void|float|string|boolean|ObjectPtr|any)\\b/,
    alias: 'class-name',
  },
  builtin: {
    pattern:
      /\\b(?:${builtinPattern})\\b/,
    alias: 'function',
  },
  constant: {
    pattern:
      /\\b(?:STAT_[A-Za-z_]+|SKILL_[A-Za-z_]+|PERK_[A-Za-z_]+|TRAIT_[A-Za-z_]+|PID_[A-Za-z_]+|SCRIPT_[A-Za-z_]+|OBJ_TYPE_[A-Za-z_]+|ITEM_TYPE_[A-Za-z_]+|DAMAGE_TYPE_[A-Za-z_]+|DMG_[A-Za-z_]+|KILL_TYPE_[A-Za-z_]+|GVAR_[A-Za-z_]+|LVAR_[A-Za-z_]+|MVAR_[A-Za-z_]+|FLOAT_MSG_[A-Za-z_]+|INVEN_TYPE_[A-Za-z_]+|INVEN_CMD_[A-Za-z_]+|ANIM_[A-Za-z_]+|DAM_[A-Za-z_]+|PCSTAT_[A-Za-z_]+|METARULE[0-9]*_[A-Za-z_]+|GOOD|NEUTRAL|BAD|TRUE|FALSE|true|false|NULL)\\b/,
    alias: 'constant',
  },
  number: [
    {
      pattern: /\\b0x[0-9a-fA-F]+\\b/,
    },
    {
      pattern: /\\b\\d+(?:\\.\\d+)?\\b/,
    },
  ],
  operator: /\\+|-|\\*|\\/|%|:=|==|!=|<=|>=|<|>/,
  punctuation: /[{}[\\];(),]/,
};

module.exports = sslLanguage;
`;

fs.writeFileSync(outputPath, sslLanguage);

console.log(`Generated ${outputPath}`);
console.log(`Included ${sslFunctions.length} documented SSL functions`);
console.log(`Sample: ${sslFunctions.slice(0, 10).join(', ')}...`);
