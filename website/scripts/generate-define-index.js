#!/usr/bin/env node
/**
 * Generates a define index JSON from Fallout2 Restoration Project's define.h
 *
 * This script:
 * 1. Fetches define.h from GitHub (BGforgeNet/Fallout2_Restoration_Project)
 * 2. Parses #define statements with regex
 * 3. Tracks known prefixes (PERK_, TRAIT_, STAT_, SKILL_, etc.)
 * 4. Records line numbers and values
 * 5. Outputs JSON index pinned to specific commit
 *
 * Usage:
 *   node scripts/generate-define-index.js [options]
 *
 * Options:
 *   --yes, -y           Auto-confirm changes without prompting
 *   --dry-run           Show what would change without writing
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const REPO = 'BGforgeNet/Fallout2_Restoration_Project';
const FILE_PATH = 'scripts_src/headers/define.h';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'define-index.json');

// Known prefixes for categorization
const KNOWN_PREFIXES = [
  'PERK_',
  'TRAIT_',
  'STAT_',
  'SKILL_',
  'DAM_',
  'DMG_',
  'METARULE_',
  'item_type_',
  'INVEN_',
  'CRITTER_',
  'ONE_GAME_',
  'FLOAT_MSG_',
  'OBJ_TYPE_',
  'PID_',
  'PROTO_',
  'ANIM_',
  'SCRIPT_',
  'TILE_',
  'TEAM_',
  'REPUTATION_',
  'GVAR_',
  'LVAR_',
  'MVAR_',
  'MSG_',
  'AI_',
  'FID_',
  'GAME_',
  'TOWN_',
  'MAP_',
  'AREA_',
];

// Pattern for #define statements
// Matches: #define NAME value
// Also handles: #define NAME (expression)
const DEFINE_PATTERN = /^#define\s+([A-Za-z_][A-Za-z0-9_]*)\s+(.+?)(?:\s*\/\/.*)?$/;

/**
 * Fetch file content from GitHub raw URL
 */
function fetchFromGitHub(repo, filePath, commitOrRef = 'main') {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/${repo}/${commitOrRef}/${filePath}`;
    console.log(`Fetching: ${url}`);

    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
        https.get(res.headers.location, (redirectRes) => {
          let data = '';
          redirectRes.on('data', chunk => data += chunk);
          redirectRes.on('end', () => resolve(data));
        }).on('error', reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: Failed to fetch ${url}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Get the latest commit SHA for a file via GitHub API
 */
function getLatestCommit(repo, filePath) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${repo}/commits?path=${filePath}&per_page=1`;
    console.log(`Getting latest commit for: ${filePath}`);

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/commits?path=${encodeURIComponent(filePath)}&per_page=1`,
      headers: {
        'User-Agent': 'Fallout2-Modding-Docs',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: Failed to get commits`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const commits = JSON.parse(data);
          if (commits.length > 0) {
            resolve({
              sha: commits[0].sha,
              shortSha: commits[0].sha.substring(0, 7),
              date: commits[0].commit.committer.date,
            });
          } else {
            reject(new Error('No commits found for file'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse commits: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Determine the prefix category for a define name
 */
function getPrefix(name) {
  for (const prefix of KNOWN_PREFIXES) {
    if (name.startsWith(prefix)) {
      return prefix.replace(/_$/, ''); // Remove trailing underscore
    }
  }
  return 'OTHER';
}

/**
 * Parse define.h content and extract defines
 */
function parseDefines(content) {
  const lines = content.split('\n');
  const defines = {};

  lines.forEach((line, index) => {
    const lineNum = index + 1; // 1-indexed
    const trimmed = line.trim();

    // Skip empty lines, comments, and preprocessor directives other than #define
    if (!trimmed.startsWith('#define')) {
      return;
    }

    const match = trimmed.match(DEFINE_PATTERN);
    if (match) {
      const name = match[1];
      let value = match[2].trim();

      // Clean up value - remove trailing comments
      const commentIdx = value.indexOf('//');
      if (commentIdx !== -1) {
        value = value.substring(0, commentIdx).trim();
      }

      // Skip function-like macros (those with parentheses in the name)
      if (name.includes('(')) {
        return;
      }

      // Skip internal/private defines (starting with underscore typically)
      if (name.startsWith('_')) {
        return;
      }

      defines[name] = {
        line: lineNum,
        value: value,
        prefix: getPrefix(name),
      };
    }
  });

  return defines;
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Compare two indices and return changes
 */
function compareIndices(oldIndex, newIndex) {
  const changes = {
    added: [],
    removed: [],
    modified: [],
    commitChanged: false,
  };

  const oldDefines = oldIndex.defines || {};
  const newDefines = newIndex.defines || {};

  // Check for commit change
  if (oldIndex._meta?.shortCommit !== newIndex._meta?.shortCommit) {
    changes.commitChanged = true;
    changes.oldCommit = oldIndex._meta?.shortCommit || 'none';
    changes.newCommit = newIndex._meta?.shortCommit;
  }

  // Find added and modified
  for (const [name, newInfo] of Object.entries(newDefines)) {
    const oldInfo = oldDefines[name];
    if (!oldInfo) {
      changes.added.push(name);
    } else if (
      oldInfo.line !== newInfo.line ||
      oldInfo.value !== newInfo.value
    ) {
      changes.modified.push({
        name,
        old: oldInfo,
        new: newInfo,
      });
    }
  }

  // Find removed
  for (const name of Object.keys(oldDefines)) {
    if (!newDefines[name]) {
      changes.removed.push(name);
    }
  }

  return changes;
}

/**
 * Print changes summary
 */
function printChanges(changes) {
  console.log('\n' + '='.repeat(60));
  console.log('CHANGES DETECTED');
  console.log('='.repeat(60));

  if (changes.commitChanged) {
    console.log(`\nCommit: ${changes.oldCommit} -> ${changes.newCommit}`);
  }

  if (changes.added.length > 0) {
    console.log(`\n+ ADDED (${changes.added.length}):`);
    changes.added.slice(0, 20).forEach(name => console.log(`  + ${name}`));
    if (changes.added.length > 20) {
      console.log(`  ... and ${changes.added.length - 20} more`);
    }
  }

  if (changes.removed.length > 0) {
    console.log(`\n- REMOVED (${changes.removed.length}):`);
    changes.removed.slice(0, 20).forEach(name => console.log(`  - ${name}`));
    if (changes.removed.length > 20) {
      console.log(`  ... and ${changes.removed.length - 20} more`);
    }
  }

  if (changes.modified.length > 0) {
    console.log(`\n~ MODIFIED (${changes.modified.length}):`);
    changes.modified.slice(0, 10).forEach(({ name, old, new: newInfo }) => {
      console.log(`  ~ ${name}:`);
      if (old.line !== newInfo.line) {
        console.log(`      line: ${old.line} -> ${newInfo.line}`);
      }
      if (old.value !== newInfo.value) {
        console.log(`      value: ${old.value} -> ${newInfo.value}`);
      }
    });
    if (changes.modified.length > 10) {
      console.log(`  ... and ${changes.modified.length - 10} more`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  let autoConfirm = false;
  let dryRun = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yes' || args[i] === '-y') {
      autoConfirm = true;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  console.log(`Repository: ${REPO}`);
  console.log(`File: ${FILE_PATH}`);
  if (dryRun) console.log('DRY RUN - no files will be written');

  // Get latest commit info
  let commitInfo;
  try {
    commitInfo = await getLatestCommit(REPO, FILE_PATH);
    console.log(`Latest commit: ${commitInfo.sha} (${commitInfo.shortSha})`);
    console.log(`Commit date: ${commitInfo.date}`);
  } catch (e) {
    console.error('Failed to get latest commit:', e.message);
    console.log('Using "main" branch instead');
    commitInfo = { sha: 'main', shortSha: 'main', date: null };
  }

  // Fetch file content
  let content;
  try {
    content = await fetchFromGitHub(REPO, FILE_PATH, commitInfo.sha);
  } catch (e) {
    console.error('Failed to fetch file:', e.message);
    process.exit(1);
  }

  // Parse defines
  const defines = parseDefines(content);
  console.log(`Found ${Object.keys(defines).length} defines`);

  // Count by prefix
  const prefixCounts = {};
  for (const info of Object.values(defines)) {
    prefixCounts[info.prefix] = (prefixCounts[info.prefix] || 0) + 1;
  }
  console.log('\nDefines by prefix:');
  Object.entries(prefixCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([prefix, count]) => {
      console.log(`  ${prefix}: ${count}`);
    });

  // Build the index
  const index = {
    _meta: {
      repo: REPO,
      file: FILE_PATH,
      commit: commitInfo.sha,
      shortCommit: commitInfo.shortSha,
      generatedAt: new Date().toISOString(),
      defineCount: Object.keys(defines).length,
    },
    defines: defines,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(outputDir, { recursive: true });

  // Load existing index if it exists
  let existingIndex = { _meta: {}, defines: {} };
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingIndex = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse existing index, treating as empty');
    }
  }

  // Compare indices
  const changes = compareIndices(existingIndex, index);
  const hasChanges = changes.added.length > 0 ||
                     changes.removed.length > 0 ||
                     changes.modified.length > 0 ||
                     changes.commitChanged;

  if (!hasChanges) {
    console.log('\nNo changes detected. Index is up to date.');
    return;
  }

  // Print changes
  printChanges(changes);

  // Summary
  console.log(`\nSummary:`);
  console.log(`  Total defines: ${Object.keys(index.defines).length}`);

  if (dryRun) {
    console.log('\nDry run complete. No files written.');
    return;
  }

  // Ask for confirmation
  let shouldWrite = autoConfirm;
  if (!autoConfirm) {
    shouldWrite = await askConfirmation('\nWrite changes to define-index.json? (y/N) ');
  }

  if (shouldWrite) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    console.log(`\nWrote define index to: ${OUTPUT_FILE}`);
  } else {
    console.log('\nAborted. No changes written.');
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
