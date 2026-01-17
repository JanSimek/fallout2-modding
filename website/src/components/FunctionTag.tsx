import React from 'react';

interface FunctionTagProps {
  type: 'vanilla' | 'sfall';
}

const tagStyles: Record<string, React.CSSProperties> = {
  vanilla: {
    backgroundColor: '#6b7280',
    color: '#ffffff',
  },
  sfall: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
  },
};

const baseStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  marginLeft: '8px',
  verticalAlign: 'middle',
};

export default function FunctionTag({ type }: FunctionTagProps): React.ReactElement {
  return (
    <span style={{ ...baseStyle, ...tagStyles[type] }}>
      {type}
    </span>
  );
}
