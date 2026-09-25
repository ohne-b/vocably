import { zip } from 'fflate';
import { toBlob } from 'html-to-image';
import type { AssetFormat } from './formats';

const renderPng = async (node: HTMLElement, format: AssetFormat) => {
  const blob = await toBlob(node, {
    width: format.width,
    height: format.height,
    pixelRatio: 1,
    // The node is scaled down for preview; export it unscaled.
    style: { transform: 'none' },
  });
  if (!blob) throw new Error('html-to-image returned no image');
  return new Uint8Array(await blob.arrayBuffer());
};

const createZip = (files: Record<string, Uint8Array>) =>
  new Promise<Uint8Array>((resolve, reject) =>
    // PNGs are already compressed, so store them as is.
    zip(files, { level: 0 }, (error, data) =>
      error ? reject(error) : resolve(data)
    )
  );

// Exports every [data-canvas] inside `root` into `<format.id>.zip`,
// one folder per [data-language] group: `en/01.png`, `en/02.png`, …
export const exportZip = async (
  root: HTMLElement,
  format: AssetFormat,
  onProgress?: (done: number, total: number) => void
) => {
  const entries = [
    ...root.querySelectorAll<HTMLElement>('[data-language]'),
  ].flatMap((group) =>
    [...group.querySelectorAll<HTMLElement>('[data-canvas]')].map(
      (node, index) => ({
        path: `${group.dataset.language}/${String(index + 1).padStart(2, '0')}.png`,
        node,
      })
    )
  );

  const files: Record<string, Uint8Array> = {};
  onProgress?.(0, entries.length);
  // One at a time: html-to-image clones the whole subtree for every capture.
  for (const [done, { path, node }] of entries.entries()) {
    files[path] = await renderPng(node, format);
    onProgress?.(done + 1, entries.length);
  }

  const data = await createZip(files);
  const url = URL.createObjectURL(
    new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
  );
  const link = document.createElement('a');
  link.download = `${format.id}.zip`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url));
};
