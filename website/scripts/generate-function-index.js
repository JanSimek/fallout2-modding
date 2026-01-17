#!/usr/bin/env node
/**
 * Generates a function index JSON from fallout2-ce source code.
 *
 * This script:
 * 1. Clones/updates fallout2-ce repository (or uses existing)
 * 2. Parses C++ source files for SSL opcode implementations
 * 3. Extracts function locations (file, line numbers)
 * 4. Shows diff and asks for confirmation before updating
 *
 * Usage:
 *   node scripts/generate-function-index.js [options]
 *
 * Options:
 *   --repo-path <path>  Path to fallout2-ce repo (default: .fallout2-ce)
 *   --yes, -y           Auto-confirm changes without prompting
 *   --dry-run           Show what would change without writing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const REPO_URL = 'https://github.com/fallout2-ce/fallout2-ce.git';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'function-index.json');

// Patterns for finding SSL opcode implementations
const OPCODE_PATTERNS = [
  // Pattern: static void opFunctionName(Program* program)
  /^static\s+void\s+(op[A-Z][a-zA-Z0-9_]*)\s*\(\s*Program\s*\*\s*\w+\s*\)/,
  // Pattern: void opFunctionName(Program* program)
  /^void\s+(op[A-Z][a-zA-Z0-9_]*)\s*\(\s*Program\s*\*\s*\w+\s*\)/,
];

// Pattern for finding opcode name to function mapping with optional SSL name in comment
// interpreterRegisterOpcode(OPCODE_NAME, opFunctionName); // op_ssl_name
const OPCODE_REGISTER_PATTERN = /interpreterRegisterOpcode\s*\(\s*(\w+)\s*,\s*(op[A-Z][a-zA-Z0-9_]*)\s*\).*?(?:\/\/\s*(op_\w+))?/g;

// Pattern for SSL name comment above function definition
// Matches: // self_obj, // obj_can_see_obj, etc.
// Does NOT match: // 0x455600 (hex addresses)
const SSL_COMMENT_PATTERN = /^\/\/\s*([a-z][a-z0-9_]*)\s*$/;

// Pattern for #define OPCODE_NAME value
const OPCODE_DEFINE_PATTERN = /^#define\s+(OPCODE_[A-Z_0-9]+)\s+(\d+|0x[0-9a-fA-F]+)/;

// Additional patterns for common script functions
const SCRIPT_FUNCTION_PATTERNS = [
  // scriptPredefinedProcedure_ functions
  /^(?:static\s+)?(?:int|void|bool)\s+(script[A-Z][a-zA-Z0-9_]*)\s*\(/,
  // builtin_ functions
  /^(?:static\s+)?(?:int|void|bool)\s+(builtin[A-Z][a-zA-Z0-9_]*)\s*\(/,
];

/**
 * Get the current commit hash of a repository
 */
function getCommitHash(repoPath) {
  try {
    return execSync('git rev-parse HEAD', { cwd: repoPath, encoding: 'utf-8' }).trim();
  } catch (e) {
    console.error('Failed to get commit hash:', e.message);
    return 'main';
  }
}

/**
 * Get the short commit hash
 */
function getShortCommitHash(repoPath) {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoPath, encoding: 'utf-8' }).trim();
  } catch (e) {
    return 'main';
  }
}

/**
 * Clone or update the repository
 */
function ensureRepo(targetPath) {
  if (fs.existsSync(path.join(targetPath, '.git'))) {
    console.log('Repository exists, fetching latest...');
    try {
      execSync('git fetch origin', { cwd: targetPath, stdio: 'inherit' });
      execSync('git checkout main', { cwd: targetPath, stdio: 'inherit' });
      execSync('git pull origin main', { cwd: targetPath, stdio: 'inherit' });
    } catch (e) {
      console.warn('Failed to update repository, using existing state');
    }
  } else {
    console.log('Cloning repository...');
    fs.mkdirSync(targetPath, { recursive: true });
    execSync(`git clone --depth 1 ${REPO_URL} ${targetPath}`, { stdio: 'inherit' });
  }
}

/**
 * Find all C/C++ source files in a directory
 */
function findSourceFiles(dir, extensions = ['.c', '.cc', '.cpp', '.h', '.hpp']) {
  const results = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        walk(fullPath);
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Find function boundaries in a file
 * Returns the end line of a function starting at startLine
 */
function findFunctionEnd(lines, startLine) {
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];

    for (const char of line) {
      if (char === '{') {
        braceCount++;
        foundOpenBrace = true;
      } else if (char === '}') {
        braceCount--;
        if (foundOpenBrace && braceCount === 0) {
          return i + 1; // 1-indexed
        }
      }
    }
  }

  // If we can't find the end, return a reasonable default
  return Math.min(startLine + 50, lines.length);
}

/**
 * Parse a source file for function definitions
 * Also extracts SSL names from comments above functions (e.g., "// self_obj")
 */
function parseSourceFile(filePath, repoPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(repoPath, filePath).replace(/\\/g, '/');
  const functions = {};
  const sslNamesFromComments = {}; // funcName -> sslName

  lines.forEach((line, index) => {
    const lineNum = index + 1; // 1-indexed

    // Check opcode patterns
    for (const pattern of OPCODE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const funcName = match[1];
        const endLine = findFunctionEnd(lines, index);
        functions[funcName] = {
          file: relativePath,
          startLine: lineNum,
          endLine: endLine,
          kind: 'opcode',
        };

        // Check the lines above for an SSL name comment (e.g., "// self_obj")
        // May need to look past hex address comments like "// 0x455600"
        for (let lookBack = 1; lookBack <= 3 && index - lookBack >= 0; lookBack++) {
          const prevLine = lines[index - lookBack].trim();
          const commentMatch = prevLine.match(SSL_COMMENT_PATTERN);
          if (commentMatch) {
            sslNamesFromComments[funcName] = commentMatch[1];
            break;
          }
          // Stop looking if we hit a non-comment line
          if (!prevLine.startsWith('//') && prevLine !== '') {
            break;
          }
        }
      }
    }

    // Check script function patterns
    for (const pattern of SCRIPT_FUNCTION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const funcName = match[1];
        if (!functions[funcName]) {
          const endLine = findFunctionEnd(lines, index);
          functions[funcName] = {
            file: relativePath,
            startLine: lineNum,
            endLine: endLine,
            kind: 'function',
          };
        }
      }
    }
  });

  return { functions, sslNamesFromComments };
}

/**
 * Parse opcode registrations to build function -> SSL name mapping
 * Extracts SSL names from comments like: // op_self_obj
 */
function parseOpcodeRegistrations(filePath, repoPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const mappings = {};
  const sslNames = {}; // funcName -> sslName

  let match;
  while ((match = OPCODE_REGISTER_PATTERN.exec(content)) !== null) {
    const opcodeName = match[1];
    const funcName = match[2];
    const sslNameFromComment = match[3]; // e.g., "op_self_obj"

    mappings[opcodeName] = funcName;

    // If there's an SSL name in the comment, use it (without "op_" prefix)
    if (sslNameFromComment) {
      const sslName = sslNameFromComment.replace(/^op_/, '');
      sslNames[funcName] = sslName;
    }
  }

  return { mappings, sslNames };
}

/**
 * Create SSL function name from opcode function
 * e.g., opObjCanSeeObj -> obj_can_see_obj
 */
function opcodeToSSLName(opcodeName) {
  // Remove 'op' prefix and convert CamelCase to snake_case
  let name = opcodeName.replace(/^op/, '');

  // Handle special cases
  name = name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

  return name;
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

  const oldFunctions = oldIndex.functions || {};
  const newFunctions = newIndex.functions || {};

  // Check for commit change
  if (oldIndex._meta?.shortCommit !== newIndex._meta?.shortCommit) {
    changes.commitChanged = true;
    changes.oldCommit = oldIndex._meta?.shortCommit || 'none';
    changes.newCommit = newIndex._meta?.shortCommit;
  }

  // Find added and modified
  for (const [name, newInfo] of Object.entries(newFunctions)) {
    const oldInfo = oldFunctions[name];
    if (!oldInfo) {
      changes.added.push(name);
    } else if (
      oldInfo.file !== newInfo.file ||
      oldInfo.startLine !== newInfo.startLine ||
      oldInfo.endLine !== newInfo.endLine
    ) {
      changes.modified.push({
        name,
        old: oldInfo,
        new: newInfo,
      });
    }
  }

  // Find removed
  for (const name of Object.keys(oldFunctions)) {
    if (!newFunctions[name]) {
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
      if (old.file !== newInfo.file) {
        console.log(`      file: ${old.file} -> ${newInfo.file}`);
      }
      if (old.startLine !== newInfo.startLine || old.endLine !== newInfo.endLine) {
        console.log(`      lines: L${old.startLine}-${old.endLine} -> L${newInfo.startLine}-${newInfo.endLine}`);
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
  let repoPath = null;
  let autoConfirm = false;
  let dryRun = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo-path' && args[i + 1]) {
      repoPath = args[i + 1];
      i++;
    } else if (args[i] === '--yes' || args[i] === '-y') {
      autoConfirm = true;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  // Default repo path
  if (!repoPath) {
    repoPath = path.join(__dirname, '..', '.fallout2-ce');
  }

  console.log(`Repository path: ${repoPath}`);
  if (dryRun) console.log('DRY RUN - no files will be written');

  // Ensure repository exists
  ensureRepo(repoPath);

  const commit = getCommitHash(repoPath);
  const shortCommit = getShortCommitHash(repoPath);
  console.log(`Commit: ${commit} (${shortCommit})`);

  // Find all source files
  const srcDir = path.join(repoPath, 'src');
  const sourceFiles = findSourceFiles(srcDir);
  console.log(`Found ${sourceFiles.length} source files`);

  // Parse all files
  const allFunctions = {};
  const opcodeMappings = {};
  const allSslNames = {}; // funcName -> sslName (from comments and registrations)

  for (const file of sourceFiles) {
    const { functions, sslNamesFromComments } = parseSourceFile(file, repoPath);
    Object.assign(allFunctions, functions);
    Object.assign(allSslNames, sslNamesFromComments);

    // Also look for opcode registrations
    const { mappings, sslNames } = parseOpcodeRegistrations(file, repoPath);
    Object.assign(opcodeMappings, mappings);
    Object.assign(allSslNames, sslNames); // SSL names from registration comments
  }

  console.log(`Found ${Object.keys(allFunctions).length} functions`);
  console.log(`Found ${Object.keys(opcodeMappings).length} opcode registrations`);
  console.log(`Found ${Object.keys(allSslNames).length} SSL name mappings from comments`);

  // Build the final index with SSL names
  const index = {
    _meta: {
      repo: 'fallout2-ce/fallout2-ce',
      commit: commit,
      shortCommit: shortCommit,
      generatedAt: new Date().toISOString(),
      functionCount: Object.keys(allFunctions).length,
    },
    functions: {},
  };

  // Add functions with both their C++ name and SSL name
  for (const [funcName, info] of Object.entries(allFunctions)) {
    // Store by C++ function name
    index.functions[funcName] = {
      ...info,
      commit: shortCommit,
    };

    // If it's an opcode, also store by SSL name
    if (funcName.startsWith('op')) {
      // Prefer SSL name from comments/registrations, fall back to automatic conversion
      const sslName = allSslNames[funcName] || opcodeToSSLName(funcName);
      if (sslName && sslName !== funcName.toLowerCase()) {
        index.functions[sslName] = {
          ...info,
          commit: shortCommit,
          cppName: funcName,
        };
      }

      // If we have an explicit SSL name that differs from the auto-generated one,
      // also store under the auto-generated name for convenience
      const autoSslName = opcodeToSSLName(funcName);
      if (allSslNames[funcName] && autoSslName !== allSslNames[funcName] && !index.functions[autoSslName]) {
        index.functions[autoSslName] = {
          ...info,
          commit: shortCommit,
          cppName: funcName,
          sslName: allSslNames[funcName], // Note: this is the canonical SSL name
        };
      }
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(outputDir, { recursive: true });

  // Load existing index if it exists
  let existingIndex = { _meta: {}, functions: {} };
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
  console.log(`  Total entries: ${Object.keys(index.functions).length}`);
  const opcodes = Object.values(index.functions).filter(f => f.kind === 'opcode');
  const other = Object.values(index.functions).filter(f => f.kind !== 'opcode');
  console.log(`  - Opcode functions: ${opcodes.length}`);
  console.log(`  - Other functions: ${other.length}`);

  if (dryRun) {
    console.log('\nDry run complete. No files written.');
    return;
  }

  // Ask for confirmation
  let shouldWrite = autoConfirm;
  if (!autoConfirm) {
    shouldWrite = await askConfirmation('\nWrite changes to function-index.json? (y/N) ');
  }

  if (shouldWrite) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    console.log(`\nWrote function index to: ${OUTPUT_FILE}`);
  } else {
    console.log('\nAborted. No changes written.');
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
