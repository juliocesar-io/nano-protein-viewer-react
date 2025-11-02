import { NanoProteinViewer, type StructureUrl } from '@juliocesar-io/nano-protein-viewer-react';

const structures: StructureUrl[] = [
  { name: '1CRN', url: 'https://files.rcsb.org/download/1CRN.pdb', format: 'pdb' }
];

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <NanoProteinViewer structureUrls={structures} />
    </div>
  );
}
