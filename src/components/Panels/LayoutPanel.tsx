interface LayoutPanelProps {
  mode: 'single'|'grid';
  setMode: (m: 'single'|'grid') => void;
}

export function LayoutPanel({ mode, setMode }: LayoutPanelProps) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      bottom: 10,
      transform: 'translateX(-50%)',
      background: 'rgba(255,255,255,0.6)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 12,
      padding: 10,
      boxShadow: '0 8px 32px rgba(31,38,135,0.2)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 20
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setMode('single')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: mode==='single'?'#eef':'#fff', cursor: 'pointer' }}>Single</button>
        <button onClick={() => setMode('grid')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: mode==='grid'?'#eef':'#fff', cursor: 'pointer' }}>Grid</button>
      </div>
    </div>
  );
}


