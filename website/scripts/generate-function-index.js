#!/usr/bin/env node
/**
 * Generates a function index JSON from fallout2-ce source code.
 *
 * This script:
 * 1. Clones/updates fallout2-ce repository (or uses existing)
 * 2. Parses C++ source files for SSL opcode implementations
 * 3. Extracts function locations (file, line numbers)
 * 4. Detects duplicate SSL entries (multiple names for same C++ implementation)
 * 5. Shows diff and asks for confirmation before updating
 *
 * Usage:
 *   node scripts/generate-function-index.js [options]
 *
 * Options:
 *   --repo-path <path>  Path to fallout2-ce repo (default: .fallout2-ce)
 *   --yes, -y           Auto-confirm changes without prompting
 *   --dry-run           Show what would change without writing
 *   --validate          Check existing function-index.json for duplicates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const REPO_URL = 'https://github.com/fallout2-ce/fallout2-ce.git';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'function-index.json');

// Patterns for finding SSL opcode implementations
const OPCODE_PATTERNS = [
  // Pattern: static void opFunctionName(Program* program) - vanilla CamelCase style
  /^static\s+void\s+(op[A-Z][a-zA-Z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*\)/,
  // Pattern: void opFunctionName(Program* program) - vanilla CamelCase style
  /^void\s+(op[A-Z][a-zA-Z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*\)/,
  // Pattern: static void op_function_name(Program* program) - sfall snake_case style
  /^static\s+void\s+(op_[a-z][a-z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*\)/,
  // Pattern: void op_function_name(Program* program) - sfall snake_case style
  /^void\s+(op_[a-z][a-z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*\)/,
  // Pattern: static void _op_function_name(Program* program) - underscore-prefixed style
  /^static\s+void\s+(_op_[a-z][a-z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*\)/,
  // Pattern: void _op_function_name(Program* program) - underscore-prefixed style
  /^void\s+(_op_[a-z][a-z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*\)/,
  // Pattern: static void mf_function_name(Program* program, int args) - sfall metarule style
  /^static\s+void\s+(mf_[a-z][a-z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*,\s*int\s+\w+\s*\)/,
  // Pattern: void mf_function_name(Program* program, int args) - sfall metarule style
  /^void\s+(mf_[a-z][a-z0-9_]*)\s*\(\s*(?:fallout::)?Program\s*\*\s*\w+\s*,\s*int\s+\w+\s*\)/,
];

// Pattern for finding opcode name to function mapping with optional SSL name in comment
// interpreterRegisterOpcode(OPCODE_NAME, opFunctionName); // op_ssl_name
// Matches CamelCase (opFunctionName), snake_case (op_function_name), and underscore-prefixed (_op_function_name) styles
const OPCODE_REGISTER_PATTERN = /interpreterRegisterOpcode\s*\(\s*(\w+)\s*,\s*(_?op[A-Z_][a-zA-Z0-9_]*)\s*\).*?(?:\/\/\s*(op_\w+))?/g;

// Pattern for SSL name comment above function definition
// Matches: // self_obj, // obj_can_see_obj, etc.
// Does NOT match: // 0x455600 (hex addresses)
const SSL_COMMENT_PATTERN = /^\/\/\s*([a-z][a-z0-9_]*)/;

// Pattern for #define OPCODE_NAME value
const OPCODE_DEFINE_PATTERN = /^#define\s+(OPCODE_[A-Z_0-9]+)\s+(\d+|0x[0-9a-fA-F]+)/;

// Additional patterns for common script functions
const SCRIPT_FUNCTION_PATTERNS = [
  // scriptPredefinedProcedure_ functions
  /^(?:static\s+)?(?:int|void|bool)\s+(script[A-Z][a-zA-Z0-9_]*)\s*\(/,
  // builtin_ functions
  /^(?:static\s+)?(?:int|void|bool)\s+(builtin[A-Z][a-zA-Z0-9_]*)\s*\(/,
];

// Metarule SSL function name mappings
// These are SSL functions implemented as cases in opMetarule, not as separate functions
// The SSL names are defined in the SSL compiler, not in the C++ source
const METARULE_SSL_NAMES = {
  'METARULE_SIGNAL_END_GAME': 'signal_end_game',
  'METARULE_FIRST_RUN': 'map_first_run',
  'METARULE_ELEVATOR': 'elevator', // Note: elevator is typically used differently
  'METARULE_PARTY_COUNT': 'party_member_count',
  'METARULE_AREA_KNOWN': 'town_known',
  'METARULE_WHO_ON_DRUGS': 'drug_influence',
  'METARULE_MAP_KNOWN': 'map_is_known',
  'METARULE_IS_LOADGAME': 'is_loading_game',
  'METARULE_CAR_CURRENT_TOWN': 'car_current_town',
  'METARULE_GIVE_CAR_TO_PARTY': 'car_give_to_party',
  'METARULE_GIVE_CAR_GAS': 'car_give_gas',
  'METARULE_SKILL_CHECK_TAG': 'is_skill_tagged',
  'METARULE_DROP_ALL_INVEN': 'obj_drop_everything',
  'METARULE_INVEN_UNWIELD_WHO': 'inven_unwield',
  'METARULE_GET_WORLDMAP_XPOS': 'world_map_x_pos',
  'METARULE_GET_WORLDMAP_YPOS': 'world_map_y_pos',
  'METARULE_CURRENT_TOWN': 'cur_town',
  'METARULE_LANGUAGE_FILTER': 'language_filter_is_on',
  'METARULE_VIOLENCE_FILTER': 'violence_level_setting',
  'METARULE_WEAPON_DAMAGE_TYPE': 'weapon_damage_type',
  'METARULE_CRITTER_BARTERS': 'critter_barters',
  'METARULE_CRITTER_KILL_TYPE': 'critter_kill_type',
  'METARULE_SET_CAR_CARRY_AMOUNT': 'set_car_carry_amount',
  'METARULE_GET_CAR_CARRY_AMOUNT': 'get_car_carry_amount',
};

// Pattern to find metarule case statements
const METARULE_CASE_PATTERN = /^\s*case\s+(METARULE_[A-Z_]+)\s*:/;

// Override mappings for functions with WRONG comments in source code
// These override the comment-derived SSL name (not function name mismatches)
const SSL_COMMENT_OVERRIDES = {
  'op_sfall_func7': 'sfall_func7',  // Comment wrongly says sfall_func6
  'op_sfall_func8': 'sfall_func8',  // Comment wrongly says sfall_func6
  'opSuccess': 'is_success',        // Comment says "success" but SSL uses "is_success"
  'opCritical': 'is_critical',      // Comment says "critical" but SSL uses "is_critical"
  'op_type_of': 'typeof',           // Comment says "type_of" but SSL uses "typeof"
  'opWorldmap': 'world_map',        // No comment, derived name is "worldmap" but SSL uses "world_map"
  '_op_gdialog_barter': 'gdialog_mod_barter',  // Comment says "gdialog_barter" but SSL uses "gdialog_mod_barter"
};

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
 * Parse metarule case statements in opMetarule function
 * Returns entries for SSL functions implemented as metarule cases
 */
function parseMetaruleCases(filePath, repoPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(repoPath, filePath).replace(/\\/g, '/');
  const metaruleFunctions = {};

  // Find opMetarule function
  let inMetarule = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect start of opMetarule function
    if (line.includes('void opMetarule(Program* program)') ||
        line.includes('static void opMetarule(Program* program)')) {
      inMetarule = true;
      braceCount = 0;
    }

    if (inMetarule) {
      // Track braces to know when we exit the function
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }

      // Check for metarule case
      const caseMatch = line.match(METARULE_CASE_PATTERN);
      if (caseMatch) {
        const metaruleName = caseMatch[1];
        const sslName = METARULE_SSL_NAMES[metaruleName];

        if (sslName) {
          // Find the end of this case (next case, break, or default)
          let endLine = lineNum;
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            if (nextLine.match(/^\s*case\s+/) ||
                nextLine.match(/^\s*default\s*:/) ||
                nextLine.match(/^\s*break\s*;/)) {
              endLine = j + 1;
              break;
            }
            // Also stop at closing brace of switch
            if (nextLine.match(/^\s*}\s*$/)) {
              endLine = j;
              break;
            }
          }

          metaruleFunctions[sslName] = {
            file: relativePath,
            startLine: lineNum,
            endLine: endLine,
            kind: 'metarule',
            cppName: 'opMetarule',
            metarule: metaruleName,
          };
        }
      }

      // Exit when we leave the function
      if (braceCount === 0 && line.includes('}')) {
        inMetarule = false;
      }
    }
  }

  return metaruleFunctions;
}

/**
 * Create SSL function name from opcode function
 * e.g., opObjCanSeeObj -> obj_can_see_obj
 * e.g., op_sqrt -> sqrt
 * e.g., _op_gsay_start -> gsay_start
 * e.g., mf_get_ini_section -> get_ini_section
 */
function opcodeToSSLName(opcodeName) {
  // Handle underscore-prefixed style: _op_gsay_start -> gsay_start
  if (opcodeName.startsWith('_op_')) {
    return opcodeName.slice(4); // Remove '_op_' prefix
  }

  // Handle sfall-style snake_case: op_sqrt -> sqrt
  if (opcodeName.startsWith('op_')) {
    return opcodeName.slice(3); // Remove 'op_' prefix
  }

  // Handle sfall metarule style: mf_get_ini_section -> get_ini_section
  if (opcodeName.startsWith('mf_')) {
    return opcodeName.slice(3); // Remove 'mf_' prefix
  }

  // Handle vanilla CamelCase: opObjCanSeeObj -> obj_can_see_obj
  // Remove 'op' prefix and convert CamelCase to snake_case
  let name = opcodeName.replace(/^op/, '');
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
 * Detect duplicate entries - multiple SSL names pointing to the same C++ implementation
 * Returns an object with duplicates grouped by their source location
 */
function detectDuplicates(index) {
  const duplicates = {};
  const locationToNames = {}; // "file:startLine:endLine" -> [name1, name2, ...]

  for (const [name, info] of Object.entries(index.functions)) {
    // Skip C++ function names (entries without cppName are the original C++ entries)
    // We only want to check SSL aliases
    if (!info.cppName) continue;

    const locationKey = `${info.file}:${info.startLine}:${info.endLine}`;
    if (!locationToNames[locationKey]) {
      locationToNames[locationKey] = [];
    }
    locationToNames[locationKey].push(name);
  }

  // Find locations with multiple SSL names
  for (const [location, names] of Object.entries(locationToNames)) {
    if (names.length > 1) {
      duplicates[location] = {
        names: names.sort(),
        info: index.functions[names[0]],
      };
    }
  }

  return duplicates;
}

/**
 * Print duplicates and return true if any were found
 */
function printDuplicates(duplicates) {
  const entries = Object.entries(duplicates);
  if (entries.length === 0) {
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('DUPLICATE ENTRIES DETECTED');
  console.log('='.repeat(60));
  console.log('\nMultiple SSL function names pointing to the same C++ implementation:');
  console.log('(This may indicate redundant entries that should be consolidated)\n');

  for (const [location, { names, info }] of entries) {
    console.log(`  ${info.file}:${info.startLine}-${info.endLine} (${info.cppName}):`);
    names.forEach(name => console.log(`    - ${name}`));
    console.log();
  }

  console.log('='.repeat(60));
  console.log(`Total: ${entries.length} locations with duplicate SSL names`);
  console.log('='.repeat(60) + '\n');

  return true;
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
 * Validate the existing function index for duplicates
 */
function validateExistingIndex() {
  console.log('Validating existing function-index.json...\n');

  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`ERROR: ${OUTPUT_FILE} not found`);
    process.exit(1);
  }

  let index;
  try {
    index = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch (e) {
    console.error(`ERROR: Failed to parse ${OUTPUT_FILE}: ${e.message}`);
    process.exit(1);
  }

  console.log(`Loaded ${Object.keys(index.functions).length} function entries`);
  console.log(`Commit: ${index._meta?.shortCommit || 'unknown'}`);

  const duplicates = detectDuplicates(index);
  const hasDuplicates = printDuplicates(duplicates);

  if (hasDuplicates) {
    console.error('ERROR: Duplicate SSL function entries detected!');
    console.error('Each C++ implementation should have only one SSL function name in the index.');
    process.exit(1);
  } else {
    console.log('No duplicates found. Index is valid.');
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  let repoPath = null;
  let autoConfirm = false;
  let dryRun = false;
  let validateOnly = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo-path' && args[i + 1]) {
      repoPath = args[i + 1];
      i++;
    } else if (args[i] === '--yes' || args[i] === '-y') {
      autoConfirm = true;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--validate') {
      validateOnly = true;
    }
  }

  // Validate existing index without regenerating
  if (validateOnly) {
    validateExistingIndex();
    return;
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
  const allMetaruleFunctions = {}; // SSL metarule functions

  for (const file of sourceFiles) {
    const { functions, sslNamesFromComments } = parseSourceFile(file, repoPath);
    Object.assign(allFunctions, functions);
    Object.assign(allSslNames, sslNamesFromComments);

    // Also look for opcode registrations
    const { mappings, sslNames } = parseOpcodeRegistrations(file, repoPath);
    Object.assign(opcodeMappings, mappings);
    Object.assign(allSslNames, sslNames); // SSL names from registration comments

    // Parse metarule cases (only in interpreter_extra.cc)
    if (file.endsWith('interpreter_extra.cc')) {
      const metaruleFunctions = parseMetaruleCases(file, repoPath);
      Object.assign(allMetaruleFunctions, metaruleFunctions);
    }
  }

  console.log(`Found ${Object.keys(allFunctions).length} functions`);
  console.log(`Found ${Object.keys(opcodeMappings).length} opcode registrations`);
  console.log(`Found ${Object.keys(allSslNames).length} SSL name mappings from comments`);
  console.log(`Found ${Object.keys(allMetaruleFunctions).length} metarule functions`);

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

  // Add functions with their C++ name and ONE canonical SSL name
  for (const [funcName, info] of Object.entries(allFunctions)) {
    // Store by C++ function name
    index.functions[funcName] = {
      ...info,
      commit: shortCommit,
    };

    // If it's an opcode or metarule function, also store by ONE canonical SSL name
    // Priority: 1) Override for wrong comments, 2) Comment-derived name, 3) Function name derivation
    if (funcName.startsWith('op') || funcName.startsWith('_op') || funcName.startsWith('mf_')) {
      const sslName = SSL_COMMENT_OVERRIDES[funcName] || allSslNames[funcName] || opcodeToSSLName(funcName);
      if (sslName && sslName !== funcName.toLowerCase()) {
        index.functions[sslName] = {
          ...info,
          commit: shortCommit,
          cppName: funcName,
        };
      }
    }
  }

  // Add metarule functions (SSL functions implemented as cases in opMetarule)
  for (const [sslName, info] of Object.entries(allMetaruleFunctions)) {
    index.functions[sslName] = {
      ...info,
      commit: shortCommit,
    };
  }

  // Check for duplicate SSL entries pointing to same C++ implementation
  const duplicates = detectDuplicates(index);
  const hasDuplicates = printDuplicates(duplicates);

  if (hasDuplicates) {
    console.error('ERROR: Duplicate SSL function entries detected!');
    console.error('Each C++ implementation should have only one SSL function name in the index.');
    console.error('Please review and consolidate the duplicates listed above.');
    process.exit(1);
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
