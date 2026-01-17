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
