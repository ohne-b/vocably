import type { AssetFormat } from '../formats';

type Props = {
  format: AssetFormat;
  label?: string;
};

export const Placeholder = ({ format, label }: Props) => {
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
        background: 'linear-gradient(160deg, #4f46e5, #0ea5e9)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: minSide * 0.1, fontWeight: 700 }}>Vocably</div>
      {label && (
        <div style={{ fontSize: minSide * 0.05, fontWeight: 600 }}>{label}</div>
      )}
      <div style={{ fontSize: minSide * 0.035, opacity: 0.8 }}>
        {format.width} × {format.height}
      </div>
    </div>
  );
};
