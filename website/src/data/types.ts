/**
 * Type definitions for the generated function index
 */

export interface FunctionInfo {
  /** Relative path to the source file */
  file: string;
  /** Starting line number (1-indexed) */
  startLine: number;
  /** Ending line number (1-indexed) */
  endLine: number;
  /** Function kind */
  kind: 'opcode' | 'function' | 'struct' | 'enum' | 'constant';
  /** Commit hash (short) */
  commit: string;
  /** Original C++ function name (if different from key) */
  cppName?: string;
}

export interface FunctionIndexMeta {
  /** GitHub repository in format "owner/repo" */
  repo: string;
  /** Full commit hash */
  commit: string;
  /** Short commit hash */
  shortCommit: string;
  /** ISO timestamp when the index was generated */
  generatedAt: string | null;
  /** Total number of functions in the index */
  functionCount: number;
}

export interface FunctionIndex {
  _meta: FunctionIndexMeta;
  functions: Record<string, FunctionInfo>;
}

/**
 * Type definitions for the generated define index
 */

export interface DefineInfo {
  /** Line number where the define is located (1-indexed) */
  line: number;
  /** The value of the define */
  value: string;
  /** Prefix category (e.g., "PERK", "SKILL", "DAM") */
  prefix: string;
}

export interface DefineIndexMeta {
  /** GitHub repository in format "owner/repo" */
  repo: string;
  /** File path within the repository */
  file: string;
  /** Full commit hash */
  commit: string;
  /** Short commit hash */
  shortCommit: string;
  /** ISO timestamp when the index was generated */
  generatedAt: string | null;
  /** Total number of defines in the index */
  defineCount: number;
}

export interface DefineIndex {
  _meta: DefineIndexMeta;
  defines: Record<string, DefineInfo>;
}
