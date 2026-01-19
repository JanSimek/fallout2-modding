import React from 'react';
import defineIndex from '../data/define-index.json';
import type { DefineIndex, DefineInfo } from '../data/types';

const index = defineIndex as DefineIndex;

interface DefineRefProps {
  /** Define name to look up (e.g., "SKILL_SMALL_GUNS") */
  name: string;
  /** Optional label override (defaults to define name) */
  label?: string;
  /** Show the line number in the label */
  showLine?: boolean;
  /** Render as inline link instead of block */
  inline?: boolean;
}

/**
 * Component that renders a link to a define/macro in Fallout2 Restoration Project's define.h
 *
 * Uses a build-time generated index to resolve define locations, ensuring
 * stable links pinned to specific commits.
 *
 * @example
 * <DefineRef name="SKILL_SMALL_GUNS" />
 * <DefineRef name="DAM_CRIP_ARM_LEFT" inline />
 * <DefineRef name="PERK_bonus_hth_damage" label="Bonus HtH Damage perk" />
 */
export default function DefineRef({
  name,
  label,
  showLine = false,
  inline = false,
}: DefineRefProps): React.ReactElement {
  const info = index.defines[name];

  if (!info) {
    // Define not found in index
    if (inline) {
      return (
        <code style={{ color: 'var(--ifm-color-warning-dark)' }}>
          {name}
        </code>
      );
    }

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--ifm-color-warning-contrast-background)',
          borderRadius: '4px',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ opacity: 0.7 }}>Define not indexed:</span>
        <code>{name}</code>
      </div>
    );
  }

  // Build GitHub URL
  const { repo, file, shortCommit } = index._meta;
  const commitRef = shortCommit || 'main';
  const url = `https://github.com/${repo}/blob/${commitRef}/${file}#L${info.line}`;

  const displayLabel = label || name;
  const lineInfo = showLine ? ` (L${info.line})` : '';

  // Inline rendering - clickable code link
  if (inline) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
      >
        <code
          style={{
            backgroundColor: 'var(--ifm-color-emphasis-200)',
            padding: '0.1rem 0.3rem',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          {displayLabel}
        </code>
        {lineInfo && <span style={{ opacity: 0.6, fontSize: '0.85em' }}>{lineInfo}</span>}
      </a>
    );
  }

  // Block rendering with GitHub icon
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        backgroundColor: 'var(--ifm-color-emphasis-100)',
        borderRadius: '4px',
        fontSize: '0.9rem',
        marginBottom: '0.5rem',
      }}
    >
      <GitHubIcon />
      <a href={url} target="_blank" rel="noopener noreferrer">
        <code>{displayLabel}</code>
      </a>
      {showLine && (
        <span style={{ opacity: 0.6, fontSize: '0.85em' }}>
          (L{info.line})
        </span>
      )}
      {info.value && (
        <span style={{ opacity: 0.6, fontSize: '0.85em' }}>
          = {info.value}
        </span>
      )}
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ opacity: 0.7 }}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/**
 * Helper component to show define info without a link
 */
export function DefineInfo({ name }: { name: string }): React.ReactElement {
  const info = index.defines[name];

  if (!info) {
    return <span>Define not indexed: {name}</span>;
  }

  return (
    <span>
      <code>{name}</code> = {info.value} (line {info.line})
    </span>
  );
}

/**
 * Get define info from the index (for programmatic use)
 */
export function getDefineInfo(name: string): DefineInfo | undefined {
  return index.defines[name];
}

/**
 * Get the index metadata
 */
export function getDefineIndexMeta() {
  return index._meta;
}
