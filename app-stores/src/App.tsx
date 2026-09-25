import { useRef, useState } from 'react';
import { Canvas } from './Canvas';
import { exportPng } from './exportPng';
import { formats, type Store } from './formats';
import { Placeholder } from './templates/Placeholder';

const storeNames: Record<Store, string> = {
  'app-store': 'App Store',
  'google-play': 'Google Play',
};

const PREVIEW_HEIGHT = 720;

export const App = () => {
  const [formatId, setFormatId] = useState(formats[0].id);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const format = formats.find((f) => f.id === formatId) ?? formats[0];
  const scale = Math.min(PREVIEW_HEIGHT / format.height, 1);

  const onExport = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      await exportPng(canvasRef.current, format);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        {(Object.keys(storeNames) as Store[]).map((store) => (
          <section key={store}>
            <h2>{storeNames[store]}</h2>
            {formats
              .filter((f) => f.store === store)
              .map((f) => (
                <button
                  key={f.id}
                  className={f.id === formatId ? 'active' : ''}
                  onClick={() => setFormatId(f.id)}
                >
                  <span>{f.name}</span>
                  <small>
                    {f.width}×{f.height}
                  </small>
                </button>
              ))}
          </section>
        ))}
      </aside>
      <main className="preview">
        <div className="toolbar">
          <span>
            {storeNames[format.store]} · {format.name}
          </span>
          <button onClick={onExport} disabled={isExporting}>
            {isExporting ? 'Exporting…' : 'Export PNG'}
          </button>
        </div>
        <Canvas ref={canvasRef} format={format} scale={scale}>
          <Placeholder format={format} />
        </Canvas>
      </main>
    </div>
  );
};
