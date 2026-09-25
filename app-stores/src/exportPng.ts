import { toPng } from 'html-to-image';
import type { AssetFormat } from './formats';

export const exportPng = async (node: HTMLElement, format: AssetFormat) => {
  const dataUrl = await toPng(node, {
    width: format.width,
    height: format.height,
    pixelRatio: 1,
    // The node is scaled down for preview; export it unscaled.
    style: { transform: 'none' },
  });

  const link = document.createElement('a');
  link.download = `${format.id}.png`;
  link.href = dataUrl;
  link.click();
};
