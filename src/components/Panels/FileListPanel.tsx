import type { StructureFormat } from '@types';

interface FileListPanelProps {
  files: Array<{ name: string; format: StructureFormat }>;
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function FileListPanel({ files, currentIndex, onSelect }: FileListPanelProps) {
  return (
    <div style={{
      background: 'rgba(30, 30, 30, 0.95)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 12,
      padding: 12,
      width: '100%',
      boxSizing: 'border-box',
      maxHeight: '70vh',
      overflowY: 'auto',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>Loaded Files</h3>
      </div>
      {files.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>No files loaded.</div>
      ) : (
        <div>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              onClick={() => onSelect(i)}
              title={f.name}
              style={{
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 4,
                marginBottom: 6,
                background: i === currentIndex ? 'rgba(100, 150, 255, 0.3)' : 'rgba(50, 50, 50, 0.6)',
                borderLeft: i === currentIndex ? '3px solid #5B9CFF' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'rgba(255,255,255,0.9)'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <span style={{
                marginLeft: 8,
                fontSize: 11,
                background: 'rgba(100, 100, 100, 0.5)',
                padding: '1px 6px',
                borderRadius: 3,
                color: 'rgba(255,255,255,0.8)'
              }}>{f.format.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

