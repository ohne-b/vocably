import type { ReactNode } from 'react';
import type { AssetFormat } from './formats';

type Props = {
  format: AssetFormat;
  scale: number;
  children: ReactNode;
};

// Renders children at the exact pixel size of the format,
// visually scaled down to fit the preview area.
// `data-canvas` marks the unscaled node that exportZip captures.
export const Canvas = ({ format, scale, children }: Props) => (
  <div
    style={{
      width: format.width * scale,
      height: format.height * scale,
      flexShrink: 0,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
    }}
  >
    <div
      data-canvas
      style={{
        width: format.width,
        height: format.height,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  </div>
);
