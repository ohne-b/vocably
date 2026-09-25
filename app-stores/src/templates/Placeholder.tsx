import type { ReactNode } from 'react';
import type { AssetFormat } from '../formats';

type Props = {
  format: AssetFormat;
  label?: string;
  children?: ReactNode;
};

export const Placeholder = ({ format, label, children }: Props) => {
  const minSide = Math.min(format.width, format.height);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: minSide * 0.02,
        background: '#fff',
        color: '#000',
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <div style={{ fontSize: minSide * 0.1, fontWeight: 700 }}>Vocably</div>
      {label && (
        <div style={{ fontSize: minSide * 0.05, fontWeight: 600 }}>{label}</div>
      )}
      {children}
    </div>
  );
};
