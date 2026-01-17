import React from 'react';

interface ImplLinkProps {
  /** GitHub repository in format "owner/repo" */
  repo: string;
  /** File path within the repository */
  path: string;
  /** Optional line range [startLine, endLine] */
  lines?: [number, number];
  /** Optional commit SHA or branch name (defaults to 'main') */
  commitOrRef?: string;
  /** Optional link label text */
  label?: string;
}

/**
 * Component that renders a link to a specific file (and optionally lines)
 * in a GitHub repository.
 *
 * @example
 * <ImplLink
 *   repo="alexbatalov/fallout2-ce"
 *   path="src/proto_types.h"
 *   lines={[27, 35]}
 *   label="View item type enum"
 * />
 */
export default function ImplLink({
  repo,
  path,
  lines,
  commitOrRef = 'main',
  label = 'View implementation',
}: ImplLinkProps): React.ReactElement {
  // Build the GitHub URL
  let url = `https://github.com/${repo}/blob/${commitOrRef}/${path}`;

  // Add line range if specified
  if (lines && lines.length === 2) {
    const [startLine, endLine] = lines;
    if (startLine === endLine) {
      url += `#L${startLine}`;
    } else {
      url += `#L${startLine}-L${endLine}`;
    }
  }

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
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
      {lines && (
        <span style={{ opacity: 0.6, fontSize: '0.85em' }}>
          (L{lines[0]}-{lines[1]})
        </span>
      )}
    </div>
  );
}
