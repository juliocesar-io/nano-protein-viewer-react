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
      display: 'flex',
      gap: 8,
      zIndex: 20
    }}>
      <button onClick={() => setMode('single')} style={{ 
        padding: '6px 12px', 
        borderRadius: 999, 
        border: mode === 'single' ? '2px solid #000000' : '1px solid rgba(0,0,0,0.2)', 
        background: '#ffffff', 
        color: '#000000', 
        fontSize: 12,
        letterSpacing: 0.2,
        boxShadow: '0 6px 16px rgba(0,0,0,0.3)', 
        cursor: 'pointer' 
      }}>Single</button>
      <button onClick={() => setMode('grid')} style={{ 
        padding: '6px 12px', 
        borderRadius: 999, 
        border: mode === 'grid' ? '2px solid #000000' : '1px solid rgba(0,0,0,0.2)', 
        background: '#ffffff', 
        color: '#000000', 
        fontSize: 12,
        letterSpacing: 0.2,
        boxShadow: '0 6px 16px rgba(0,0,0,0.3)', 
        cursor: 'pointer' 
      }}>Grid</button>
    </div>
  );
}


