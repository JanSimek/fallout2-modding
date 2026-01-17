import React from 'react';
import ImplLink from './ImplLink';

interface SymbolInfo {
  path: string;
  startLine: number;
  endLine: number;
  kind: 'function' | 'struct' | 'enum' | 'constant';
  ref: string;
}

interface ImplRefProps {
  /** Symbol name to look up (e.g., "ItemProto", "opGetCritterStat") */
  symbol: string;
  /** Optional label override */
  label?: string;
}

// This would be populated from a generated index file in production
// For now, we use a static mapping of known symbols
const symbolIndex: Record<string, SymbolInfo> = {
  // Proto structures
  Proto: {
    path: 'src/proto_types.h',
    startLine: 443,
    endLine: 462,
    kind: 'struct',
    ref: 'main',
  },
  ItemProto: {
    path: 'src/proto_types.h',
    startLine: 316,
    endLine: 333,
    kind: 'struct',
    ref: 'main',
  },
  CritterProto: {
    path: 'src/proto_types.h',
    startLine: 347,
    endLine: 360,
    kind: 'struct',
    ref: 'main',
  },
  SceneryProto: {
    path: 'src/proto_types.h',
    startLine: 395,
    endLine: 409,
    kind: 'struct',
    ref: 'main',
  },
  WallProto: {
    path: 'src/proto_types.h',
    startLine: 411,
    endLine: 421,
    kind: 'struct',
    ref: 'main',
  },
  TileProto: {
    path: 'src/proto_types.h',
    startLine: 423,
    endLine: 431,
    kind: 'struct',
    ref: 'main',
  },
  MiscProto: {
    path: 'src/proto_types.h',
    startLine: 433,
    endLine: 441,
    kind: 'struct',
    ref: 'main',
  },

  // Enums
  ITEM_TYPE: {
    path: 'src/proto_types.h',
    startLine: 27,
    endLine: 35,
    kind: 'enum',
    ref: 'main',
  },
  SCENERY_TYPE: {
    path: 'src/proto_types.h',
    startLine: 37,
    endLine: 45,
    kind: 'enum',
    ref: 'main',
  },
  DAMAGE_TYPE: {
    path: 'src/proto_types.h',
    startLine: 59,
    endLine: 68,
    kind: 'enum',
    ref: 'main',
  },
  KILL_TYPE: {
    path: 'src/proto_types.h',
    startLine: 106,
    endLine: 132,
    kind: 'enum',
    ref: 'main',
  },

  // Opcodes
  Opcode: {
    path: 'src/interpreter.h',
    startLine: 16,
    endLine: 93,
    kind: 'enum',
    ref: 'main',
  },
};

/**
 * Component that automatically resolves a symbol name to its implementation
 * location and renders a link.
 *
 * In the future, this will use a generated index file. For now, it uses
 * a static mapping of known symbols.
 *
 * @example
 * <ImplRef symbol="ItemProto" />
 * <ImplRef symbol="opGetCritterStat" label="View critter stat handler" />
 */
export default function ImplRef({ symbol, label }: ImplRefProps): React.ReactElement {
  const info = symbolIndex[symbol];

  if (!info) {
    // Symbol not found in index - render a placeholder
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
        }}
      >
        <span>Symbol not indexed: {symbol}</span>
      </div>
    );
  }

  const defaultLabel = `View ${info.kind}: ${symbol}`;

  return (
    <ImplLink
      repo="fallout2-ce/fallout2-ce"
      path={info.path}
      lines={[info.startLine, info.endLine]}
      commitOrRef={info.ref}
      label={label || defaultLabel}
    />
  );
}
