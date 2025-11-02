import { NanoProteinViewer } from '@juliocesar-io/nano-protein-viewer-react';
import type { StructureUrl } from '@juliocesar-io/nano-protein-viewer-react';

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

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <NanoProteinViewer structureUrls={exampleUrls} />
    </div>
  );
}


