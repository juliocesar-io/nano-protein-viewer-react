import { useEffect, useRef, useState } from 'react';
import type { LoadedStructure } from '@types';
import { createMolstarViewer } from '@utils/molstar';

interface GridViewProps {
  files: LoadedStructure[];
  maxActive?: number;
  onSelect?: (index: number) => void;
}

export function GridView({ files, maxActive = 8, onSelect }: GridViewProps) {
  const viewersRef = useRef<Array<ReturnType<typeof createMolstarViewer> | null>>([]);
  const activeOrderRef = useRef<number[]>([]);
  const [previews, setPreviews] = useState<(string|null)[]>([]);

  useEffect(() => {
    viewersRef.current = files.map(() => null);
    activeOrderRef.current = [];
    setPreviews(files.map(() => null));
  }, [files.length]);

  // Generate preview images using offscreen Mol* viewers
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // create hidden container
        const host = document.createElement('div');
        host.style.position = 'absolute'; host.style.left = '-9999px'; host.style.top = '-9999px';
        host.style.width = '300px'; host.style.height = '200px';
        document.body.appendChild(host);
        const v = createMolstarViewer();
        try {
          await v.mount(host);
          await v.loadStructureText(file.data, file.format);
          await new Promise(r => setTimeout(r, 200));
          const canvas = host.querySelector('canvas') as HTMLCanvasElement | null;
          const url = canvas ? canvas.toDataURL('image/png') : null;
          if (!cancelled) {
            setPreviews(prev => {
              const next = prev.slice(); next[i] = url; return next;
            });
          }
        } catch {
          // ignore
        } finally {
          try { await v.clear(); } catch {}
          document.body.removeChild(host);
        }
        if (cancelled) break;
      }
    })();
    return () => { cancelled = true; };
  }, [files]);

  const deactivateOldest = async () => {
    const oldest = activeOrderRef.current.shift();
    if (oldest === undefined) return;
    const v = viewersRef.current[oldest];
    if (v) {
      await v.clear();
      viewersRef.current[oldest] = null;
    }
    const slot = document.getElementById(`grid-item-${oldest}`);
    if (slot) slot.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666">Click to activate</div>';
  };

  const activate = async (index: number) => {
    if (viewersRef.current[index]) {
      // refresh LRU order
      activeOrderRef.current = activeOrderRef.current.filter(i => i !== index);
      activeOrderRef.current.push(index);
      return;
    }
    if (activeOrderRef.current.length >= maxActive) {
      await deactivateOldest();
    }
    const host = document.getElementById(`grid-item-${index}`);
    if (!host) return;
    const v = createMolstarViewer();
    viewersRef.current[index] = v;
    await v.mount(host);
    const f = files[index];
    await v.loadStructureText(f.data, f.format);
    activeOrderRef.current.push(index);
    if (onSelect) onSelect(index);
  };

  const gap = 8; // px
  const cols = Math.max(1, Math.min(files.length, 6));
  const rows = Math.max(1, Math.ceil(files.length / cols));
  const colGapTotal = (cols - 1) * gap;
  const rowGapTotal = (rows - 1) * gap;
  const itemWidth = `calc((100% - ${colGapTotal}px) / ${cols})`;
  const itemHeight = `calc((100% - ${rowGapTotal}px) / ${rows})`;

  return (
    <div style={{ position: 'absolute', inset: 0, padding: gap, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: 'stretch', alignContent: 'stretch', height: '100%' }}>
        {files.map((f, i) => (
          <div
            key={i}
            style={{
              border: '1px solid hsl(220,13%,91%)',
              borderRadius: 8,
              background: '#fff',
              width: itemWidth,
              height: itemHeight,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minWidth: 0
            }}
          >
            <div style={{ background: 'hsl(220, 9%, 46%)', color: 'hsl(210,40%,98%)', padding: '6px 10px', fontSize: 12, flexShrink: 0 }}>{f.name}</div>
            <div id={`grid-item-${i}`} style={{ flex: 1, cursor: 'pointer', position: 'relative', minHeight: 0 }} onClick={() => activate(i)}>
              {previews[i] ? (
                <img src={previews[i]!} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#666' }}>Loading preview…</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


