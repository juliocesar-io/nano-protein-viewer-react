import { NanoProteinViewer, type StructureUrl } from '@juliocesar-io/nano-protein-viewer-react';

const exampleUrls: StructureUrl[] = [
  {
    name: 'AF-A0A2K6V5L6-F1',
    url: 'https://alphafold.ebi.ac.uk/files/AF-A0A2K6V5L6-F1-model_v6.cif',
    format: 'mmcif',
    style: {
      illustrative: true,
      surface: { enabled: true, opacity: 8, inherit: true }
    }
  },
  {
    name: '1CRN',
    url: 'https://files.rcsb.org/download/1CRN.pdb',
    format: 'pdb',
    style: {
      colorMode: 'secondary',
      customColor: '#4ECDC4',
      illustrative: false,
      surface: { enabled: true, opacity: 40, inherit: true }
    }
  }
];

function getRemoteUrlsFromQuery(): StructureUrl[] | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  if (from !== 'remote_url') return null;
  const urls = params.getAll('url').filter(Boolean);
  if (urls.length === 0) return null;
  const toName = (u: string) => {
    try {
      const p = new URL(u);
      const last = p.pathname.split('/').filter(Boolean).pop() || u;
      return decodeURIComponent(last);
    } catch {
      const parts = u.split('/').filter(Boolean);
      return decodeURIComponent(parts[parts.length - 1] || u);
    }
  };
  return urls.map(u => ({ name: toName(u), url: u })) as StructureUrl[];
}

export default function App() {
  const remote = getRemoteUrlsFromQuery();
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <NanoProteinViewer structureUrls={remote ?? exampleUrls} />
    </div>
  );
}


